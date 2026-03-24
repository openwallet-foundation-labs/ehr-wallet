import { NextApiRequest, NextApiResponse } from 'next';

// List of allowed IPFS gateways to prevent SSRF
const ALLOWED_IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://ipfs.io/ipfs',
  'https://dweb.link/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
];

/**
 * Validate that a URL is from an allowed IPFS gateway
 */
function isAllowedGateway(url: string): boolean {
  return ALLOWED_IPFS_GATEWAYS.some(gateway => url.startsWith(gateway));
}

/**
 * Validate that a string is a valid IPFS CID
 */
function isValidCID(cid: string): boolean {
  // Basic validation: CIDs start with 'Qm' (v0) or 'b' (v1)
  return /^Qm[a-zA-Z0-9]{44}$/.test(cid) || /^b[a-zA-Z0-9]{58}$/.test(cid);
}

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
 * API route to run diagnostics on a CID in Pinata and IPFS
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the CID from the query parameters
  const { cid } = req.query;
  
  // Validate the CID
  if (!cid || Array.isArray(cid)) {
    return res.status(400).json({ error: 'Missing IPFS CID parameter' });
  }

  const cidString = Array.isArray(cid) ? cid[0] : cid;

  // Validate the CID to prevent SSRF
  if (!isValidCID(cidString)) {
    return res.status(400).json({ error: 'Invalid IPFS CID format' });
  }

  try {
    const results: any = {
      status: 'success',
      cid,
      timestamp: new Date().toISOString(),
      pinata: {
        status: 'unknown',
        details: null
      },
      ipfs: {
        status: 'unknown',
        gateways: {}
      }
    };
    
    // Check Pinata status
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;
    const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
    
    if (pinataJwt || (pinataApiKey && pinataSecretApiKey)) {
      try {
        // Set up headers based on available credentials
        const headers: HeadersInit = {};
        if (pinataJwt) {
          headers['Authorization'] = `Bearer ${pinataJwt}`;
        } else {
          headers['pinata_api_key'] = pinataApiKey!;
          headers['pinata_secret_api_key'] = pinataSecretApiKey!;
        }
        
        // Check if the CID is pinned on Pinata
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
            results.pinata.status = 'pinned';
            results.pinata.details = pinStatusData.rows[0];
          } else {
            // If not found in pinJobs, check in pins
            const pinsResponse = await fetchWithTimeout(`https://api.pinata.cloud/data/pinList?hashContains=${cid}`, {
              method: 'GET',
              headers: {
                ...headers,
                'Accept': 'application/json'
              }
            }, 10000);
            
            if (pinsResponse.ok) {
              const pinsData = await pinsResponse.json();
              
              if (pinsData.rows && pinsData.rows.length > 0) {
                results.pinata.status = 'pinned';
                results.pinata.details = pinsData.rows[0];
              } else {
                results.pinata.status = 'not_pinned';
              }
            } else {
              results.pinata.status = 'error';
              results.pinata.details = {
                error: `Failed to check pin list: ${pinsResponse.status}`,
                message: await pinsResponse.text()
              };
            }
          }
        } else {
          results.pinata.status = 'error';
          results.pinata.details = {
            error: `Failed to check pin jobs: ${pinStatusResponse.status}`,
            message: await pinStatusResponse.text()
          };
        }
      } catch (pinataError: any) {
        results.pinata.status = 'error';
        results.pinata.details = {
          error: pinataError.message || 'Unknown error checking Pinata status'
        };
      }
    } else {
      results.pinata.status = 'no_credentials';
    }
    
    // Check IPFS gateway status
    const gateways = [
      'https://ipfs.io/ipfs',
      'https://dweb.link/ipfs',
      'https://cloudflare-ipfs.com/ipfs',
      'https://gateway.pinata.cloud/ipfs'
    ];
    
    let anyGatewayWorking = false;
    
    // Check each gateway
    for (const gateway of gateways) {
      const gatewayName = new URL(gateway).hostname;
      results.ipfs.gateways[gatewayName] = { status: 'unknown' };
      
      try {
        const url = `${gateway}/${cid}`;
        const gatewayResponse = await fetchWithTimeout(url, {
          method: 'HEAD'  // Use HEAD to just check availability without downloading content
        }, 10000);
        
        if (gatewayResponse.ok) {
          results.ipfs.gateways[gatewayName] = {
            status: 'available',
            statusCode: gatewayResponse.status,
            contentType: gatewayResponse.headers.get('content-type'),
            contentLength: gatewayResponse.headers.get('content-length')
          };
          anyGatewayWorking = true;
        } else {
          results.ipfs.gateways[gatewayName] = {
            status: 'error',
            statusCode: gatewayResponse.status
          };
        }
      } catch (gatewayError: any) {
        results.ipfs.gateways[gatewayName] = {
          status: 'error',
          error: gatewayError.message || 'Unknown error checking gateway'
        };
      }
    }
    
    // Update overall IPFS status
    results.ipfs.status = anyGatewayWorking ? 'available' : 'not_found';
    
    // Return the diagnostic results
    return res.status(200).json(results);
  } catch (error: any) {
    console.error('Error in IPFS diagnostic:', error);
    return res.status(500).json({
      status: 'error',
      error: 'IPFS diagnostic error',
      message: error.message || 'An unexpected error occurred',
      cid
    });
  }
}
