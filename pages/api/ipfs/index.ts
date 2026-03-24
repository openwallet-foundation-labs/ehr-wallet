import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  });
  
  clearTimeout(id);
  return response;
}

/**
 * Helper function to convert between CID versions
 * This is a simplified implementation - in production, use a proper CID library
 */
function normalizeCid(cid: string): { cidv0: string | null, cidv1: string | null } {
  // Simple detection of CID version
  const isCidv0 = cid.startsWith('Qm');
  const isCidv1 = cid.startsWith('b');
  
  // For this simple implementation, we just return the original CID
  // In a production environment, use the CID library to properly convert between versions
  return {
    cidv0: isCidv0 ? cid : null,
    cidv1: isCidv1 ? cid : null
  };
}

/**
 * API route to proxy IPFS requests to avoid CORS issues
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the CID or accessId from the query parameters
  const { cid, accessId, format = 'raw', responseType = 'auto' } = req.query;
  
  // If accessId is provided, look up the CID in the database
  let cidToUse = cid;
  
  if (accessId && (!cid || Array.isArray(cid))) {
    try {
      // Import prisma client
      const { prisma } = require('@/lib/prisma');
      
      
      // Look up the shared data record in the database
      const sharedData = await prisma.sharedMedicalData.findFirst({
        where: {
          accessId: Array.isArray(accessId) ? accessId[0] : accessId,
          isActive: true,
        },
      });
      
      // If no record is found, return an error
      if (!sharedData) {
        return res.status(404).json({ error: 'Shared data not found or access has been revoked' });
      }
      
      // Check if the data has expired
      const now = new Date();
      if (now > sharedData.expiryTime) {
        return res.status(403).json({ error: 'Access has expired' });
      }
      
      // Get the IPFS CID from the shared data record
      cidToUse = sharedData.ipfsCid;
      
      // Increment the access count
      await prisma.sharedMedicalData.update({
        where: {
          id: sharedData.id,
        },
        data: {
          accessCount: {
            increment: 1,
          },
        },
      });
      
      // If the data is password protected, return a JSON response with metadata
      if (sharedData.hasPassword) {
        return res.status(200).json({
          accessId: sharedData.accessId,
          ipfsCid: sharedData.ipfsCid,
          hasPassword: true,
          expiryTime: sharedData.expiryTime,
          message: 'This content is password protected. Please use the password to decrypt it.',
        });
      }
    } catch (error) {
      console.error('Error retrieving shared data:', error);
      return res.status(500).json({ error: 'Failed to retrieve shared data' });
    }
  }
  
  // Validate the CID
  if (!cidToUse || Array.isArray(cidToUse)) {
    return res.status(400).json({ error: 'Missing IPFS CID parameter' });
  }
  
  // Make sure cidToUse is a string
  const cidString = Array.isArray(cidToUse) ? cidToUse[0] : cidToUse;
  
  // Normalize the CID to determine its version
  const normalizedCid = normalizeCid(cidString);
  const isCIDv1 = !!normalizedCid.cidv1;
  const isCIDv0 = !!normalizedCid.cidv0;
  
  // Log CID information for debugging
  
  // Special handling for known CIDs with their specific requirements
  const knownCids: Record<string, {
    preferredFormats: string[];
    preferredGateways: string[];
    needsSpecialHandling: boolean;
  }> = {
    'bagaaierapfdluuliyl5h6bwstq6o7427terxinsbd5ougxvvtrgit52fmxqq': {
      preferredFormats: ['dag-json', 'raw', 'dag-cbor', ''],
      preferredGateways: ['https://dweb.link/ipfs', 'https://cloudflare-ipfs.com/ipfs'],
      needsSpecialHandling: true
    },
    'bagaaieraogtm52c46bjycxklevgsfs5lben3k2zfoqxgqcwguvb2wuqyngmq': {
      preferredFormats: ['dag-json', 'dag-cbor', 'raw', ''],
      preferredGateways: ['https://ipfs.io/ipfs', 'https://dweb.link/ipfs'],
      needsSpecialHandling: true
    }
  };
  
  // Check if this is a known CID
  const knownCidConfig = knownCids[cidString as keyof typeof knownCids];
  
  // For CIDv1 format, we need to try specific IPFS API approaches
  // These CIDs often require special handling with the IPFS HTTP API
  const needsDirectIpfsAccess = isCIDv1 && (!knownCidConfig || knownCidConfig.needsSpecialHandling);
  
  try {
    let response: Response | null = null;
    let gatewayError: string | null = null;
    let attemptedUrls: string[] = [];
    
    // For CIDs that need special handling, try direct IPFS node access first
    if (needsDirectIpfsAccess) {
      
      // Try direct IPFS node access if available
      try {
        // Try Pinata API first if credentials are available
        const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
        const pinataSecretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;
        const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
        
        if (pinataJwt || (pinataApiKey && pinataSecretApiKey)) {
          
          // Set up headers based on available credentials
          const headers: HeadersInit = {};
          if (pinataJwt) {
            headers['Authorization'] = `Bearer ${pinataJwt}`;
          } else {
            headers['pinata_api_key'] = pinataApiKey!;
            headers['pinata_secret_api_key'] = pinataSecretApiKey!;
          }
          
          try {
            // First check if the CID is pinned on Pinata
            const pinStatusResponse = await fetchWithTimeout(`https://api.pinata.cloud/pinning/pinJobs?ipfs_pin_hash=${cid}`, {
              method: 'GET',
              headers: {
                ...headers,
                'Accept': 'application/json'
              }
            }, 10000);
            
            if (pinStatusResponse.ok) {
              const pinStatusData = await pinStatusResponse.json();
              
              if (pinStatusData.rows && pinStatusData.rows.length > 0) {
                
                // Try to get the content directly from Pinata gateway with different formats
                const pinataGatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
                const formats = isCIDv1 ? ['dag-json', 'raw', 'dag-cbor', ''] : [''];
                
                for (const format of formats) {
                  const formatParam = format ? `?format=${format}` : '';
                  const url = `${pinataGatewayUrl}/${cid}${formatParam}`;
                  
                  try {
                    const gatewayResponse = await fetchWithTimeout(url, {
                      headers: {
                        'Accept': '*/*'
                      }
                    }, 10000);
                    
                    if (gatewayResponse.ok) {
                      response = gatewayResponse;
                      break;
                    }
                  } catch (formatError) {
                    console.warn(`Error with Pinata gateway format ${format}:`, formatError);
                  }
                }
              }
            }
          } catch (pinataError) {
            console.warn('Error accessing Pinata API:', pinataError);
          }
        }
        
        // If Pinata didn't work, try Infura as fallback
        if (!response || !response.ok) {
          const ipfsNodeUrl = process.env.NEXT_PUBLIC_IPFS_NODE_URL;
          const infuraProjectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID;
          const infuraProjectSecret = process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET;
          
          // Try Infura IPFS API directly if credentials are available
          if (infuraProjectId && infuraProjectSecret) {
            
            const auth = 'Basic ' + Buffer.from(infuraProjectId + ':' + infuraProjectSecret).toString('base64');
            const infuraApiUrl = 'https://ipfs.infura.io:5001/api/v0';
            
            // For CIDv1, try dag/get first, then cat as fallback
            const endpoints = ['dag/get', 'cat', 'block/get'];
            
            for (const endpoint of endpoints) {
              try {
                
                const infuraResponse = await fetchWithTimeout(`${infuraApiUrl}/${endpoint}?arg=${cid}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': auth,
                    'Accept': '*/*'
                  }
                }, 15000);
                
                if (infuraResponse.ok) {
                  response = infuraResponse;
                  break;
                } else {
                  console.warn(`Infura IPFS API with endpoint ${endpoint} failed with status: ${infuraResponse.status}`);
                }
              } catch (endpointError) {
                console.warn(`Error with Infura IPFS API endpoint ${endpoint}:`, endpointError);
              }
            }
          }
        }
      } catch (directAccessError) {
        console.warn('Error with direct IPFS node access:', directAccessError);
      }
    }
    
    // If direct access didn't work or wasn't needed, try public gateways
    if (!response || !response.ok) {
      
      // Define a list of IPFS gateways to try
      const publicGateways = [
        'https://ipfs.io/ipfs',
        'https://dweb.link/ipfs',
        'https://cloudflare-ipfs.com/ipfs',
        'https://gateway.pinata.cloud/ipfs'
      ];
      
      // If this is a known CID with preferred gateways, use those first
      const gatewaysToTry = knownCidConfig?.preferredGateways || publicGateways;
      
      // For CIDv1, we might need to try different formats
      const formatsToTry = knownCidConfig?.preferredFormats || 
                          (isCIDv1 ? ['dag-json', 'raw', 'dag-cbor', ''] : ['']);
      
      // Try each gateway with each format
      for (const gateway of gatewaysToTry) {
        for (const format of formatsToTry) {
          const formatParam = format ? `?format=${format}` : '';
          const url = `${gateway}/${cid}${formatParam}`;
          attemptedUrls.push(url);
          
          try {
            const gatewayResponse = await fetchWithTimeout(url, {
              headers: {
                'Accept': '*/*'
              }
            }, 15000);
            
            if (gatewayResponse.ok) {
              response = gatewayResponse;
              break;
            } else {
              console.warn(`Gateway ${gateway} with format ${format} failed with status: ${gatewayResponse.status}`);
              gatewayError = `Gateway ${gateway} returned status ${gatewayResponse.status}`;
            }
          } catch (gatewayError) {
            console.warn(`Error with gateway ${gateway} format ${format}:`, gatewayError);
          }
        }
        
        if (response && response.ok) break;
      }
    }
    
    // If we have a successful response, return the content
    if (response && response.ok) {
      // Determine content type based on response headers or requested type
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Set content type header
      res.setHeader('Content-Type', contentType);
      
      // If the response type is JSON or the content type indicates JSON, parse and return as JSON
      if (responseType === 'json' || contentType.includes('json')) {
        try {
          const jsonData = await response.json();
          return res.status(200).json(jsonData);
        } catch (jsonError) {
          console.warn('Failed to parse response as JSON:', jsonError);
          // Fall back to text/binary if JSON parsing fails
        }
      }
      
      // For text content types, return as text
      if (contentType.includes('text') || responseType === 'text') {
        const textData = await response.text();
        return res.status(200).send(textData);
      }
      
      // For other content types, return as binary
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return res.status(200).send(buffer);
    }
    
    // If we get here, all attempts failed
    console.error(`All IPFS gateway attempts failed for CID: ${cid}`);
    return res.status(404).json({
      error: 'IPFS content not found',
      message: gatewayError || 'Failed to retrieve content from IPFS',
      cid,
      attemptedUrls
    });
  } catch (error: any) {
    console.error('Error in IPFS proxy:', error);
    return res.status(500).json({
      error: 'IPFS proxy error',
      message: error.message || 'An unexpected error occurred',
      cid
    });
  }
}
