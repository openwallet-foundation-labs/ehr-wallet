'use client';

// Import CID statically (no native dependencies)
import { CID } from 'multiformats/cid';
import { base58btc } from 'multiformats/bases/base58';

// Create a Helia instance
let heliaInstance: any = null;

// Dynamic imports for Helia modules to avoid loading native modules during build
const getHeliaModules = async () => {
  const { createHelia } = await import('helia');
  const { json } = await import('@helia/json');
  return { createHelia, json };
};

// Fallback to HTTP API if Helia fails
const uploadViaHttpApi = async (data: any): Promise<string> => {
  const gatewayUrl = process.env.NEXT_PUBLIC_IPFS_NODE_URL || 'https://ipfs.infura.io:5001/api/v0';
  const projectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID;
  const projectSecret = process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET;
  
  // Prepare the data
  const formData = new FormData();
  const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data)], { type: 'application/json' });
  formData.append('file', blob);
  
  // Set up headers
  const headers: HeadersInit = {};
  if (projectId && projectSecret) {
    headers['Authorization'] = 'Basic ' + btoa(`${projectId}:${projectSecret}`);
  }
  
  try {
    const response = await fetch(`${gatewayUrl}/add`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.Hash;
  } catch (error) {
    console.error('Error uploading to IPFS via HTTP API:', error);
    throw error;
  }
};

const createHeliaClient = async () => {
  if (heliaInstance) {
    return heliaInstance;
  }

  try {
    // Dynamically import to avoid loading during build
    const { createHelia } = await getHeliaModules();

    // Create Helia with minimal configuration to avoid delegated routing issues
    // Using a basic configuration to avoid TypeScript errors and delegated routing issues
    heliaInstance = await createHelia({
      // Using a simpler configuration to avoid the delegated-ipfs.dev 404 error
      start: true,
      datastore: undefined // Use default in-memory datastore
    });
    return heliaInstance;
  } catch (error) {
    console.error('Error creating Helia instance:', error);
    throw new Error('Failed to initialize Helia');
  }
};

// Import the Pinata service
import { pinataService } from './pinata';

// Upload data to IPFS using Pinata with fallback to Helia and HTTP API
export const uploadToIpfs = async (data: any): Promise<string> => {
  try {
    // First attempt: Use Pinata if configured
    if (pinataService.isConfigured()) {
      try {
        console.log('Uploading to IPFS via Pinata...');
        const jsonData = typeof data === 'object' ? data : JSON.parse(data);
        const cid = await pinataService.uploadJSON(jsonData);
        console.log('Successfully uploaded to Pinata with CID:', cid);
        return cid;
      } catch (pinataError) {
        console.warn('Pinata upload failed, falling back to Helia:', pinataError);
      }
    }
    
    try {
      // Second attempt: Use Helia
      console.log('Uploading to IPFS via Helia...');
      const helia = await createHeliaClient();
      const { json } = await getHeliaModules();
      const jsonStorage = json(helia);

      // Add content to IPFS
      const cid = await jsonStorage.add(data);
      console.log('Successfully uploaded to Helia with CID:', cid.toString());

      // Return the CID (Content Identifier) as a string
      return cid.toString();
    } catch (heliaError) {
      console.warn('Helia upload failed, falling back to HTTP API:', heliaError);
      
      // Third attempt: Use HTTP API
      console.log('Uploading to IPFS via HTTP API...');
      const cid = await uploadViaHttpApi(data);
      console.log('Successfully uploaded to HTTP API with CID:', cid);
      return cid;
    }
  } catch (error) {
    console.error('All IPFS upload methods failed:', error);
    throw new Error('Failed to upload to IPFS: ' + (error instanceof Error ? error.message : String(error)));
  }
};

// Retrieve data from IPFS using Pinata with fallback to Helia and gateway
export const getFromIpfs = async (cidString: string): Promise<any> => {
  try {
    // First attempt: Use Pinata if configured
    if (pinataService.isConfigured()) {
      try {
        console.log('Retrieving from IPFS via Pinata...', cidString);
        const content = await pinataService.getContent(cidString);
        console.log('Successfully retrieved from Pinata');
        return content;
      } catch (pinataError) {
        console.warn('Pinata retrieval failed, falling back to Helia:', pinataError);
      }
    }
    
    try {
      // Second attempt: Use Helia
      console.log('Retrieving from IPFS via Helia...', cidString);
      const helia = await createHeliaClient();
      const { json } = await getHeliaModules();
      const jsonStorage = json(helia);

      // Parse the CID string
      const cid = CID.parse(cidString);

      // Get content from IPFS
      const content = await jsonStorage.get(cid);
      console.log('Successfully retrieved from Helia');
      return content;
    } catch (heliaError) {
      console.warn('Helia retrieval failed, falling back to proxy API:', heliaError);
      
      // Third attempt: Use our Next.js API proxy to avoid CORS issues
      console.log('Retrieving from IPFS via API proxy...', cidString);
      const gatewayUrl = getIpfsGatewayUrl(cidString);
      
      try {
        const response = await fetch(gatewayUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const content = await response.json();
        console.log('Successfully retrieved from API proxy');
        return content;
      } catch (proxyError) {
        console.warn('Proxy API failed, attempting direct gateway as last resort:', proxyError);
        
        // Last resort: Try direct gateway (may fail due to CORS in browser)
        console.log('Retrieving from IPFS via direct gateway...', cidString);
        
        // Try Pinata gateway first
        const pinataGatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
        const pinataUrl = `${pinataGatewayUrl}/${cidString}`;
        
        try {
          const pinataResponse = await fetch(pinataUrl);
          
          if (pinataResponse.ok) {
            const pinataContent = await pinataResponse.json();
            console.log('Successfully retrieved from Pinata gateway');
            return pinataContent;
          }
        } catch (pinataGatewayError) {
          console.warn('Pinata gateway failed:', pinataGatewayError);
        }
        
        // Fall back to default gateway
        const directGatewayUrl = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs';
        const directUrl = `${directGatewayUrl}/${cidString}`;
        
        const directResponse = await fetch(directUrl);
        
        if (!directResponse.ok) {
          throw new Error(`HTTP error! status: ${directResponse.status}`);
        }
        
        const directContent = await directResponse.json();
        console.log('Successfully retrieved from direct gateway');
        return directContent;
      }
    }
  } catch (error) {
    console.error('All IPFS retrieval methods failed:', error);
    throw new Error('Failed to retrieve from IPFS: ' + (error instanceof Error ? error.message : String(error)));
  }
};

// Helper function to get the IPFS gateway URL for a CID
export const getIpfsGatewayUrl = (cid: string): string => {
  // Check if we're in a browser environment and should use the API route
  if (typeof window !== 'undefined') {
    // When running in the browser, use our API proxy
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/ipfs?cid=${encodeURIComponent(cid)}&format=raw`;
  }
  
  // For server-side, we can try to access the gateway directly
  // Prioritize Pinata gateway if available
  const pinataGatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
  if (pinataService.isConfigured()) {
    return `${pinataGatewayUrl}/${cid}`;
  }
  
  // Fall back to default gateway
  const gatewayUrl = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs';
  return `${gatewayUrl}/${cid}`;
};

// Check if IPFS is available
export const checkIpfsAvailability = async (): Promise<boolean> => {
  try {
    // Try to create a Helia client
    await createHeliaClient();
    return true;
  } catch (error) {
    console.warn('IPFS not available via Helia:', error);
    
    // Try to access a public gateway as fallback
    try {
      const response = await fetch('https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme');
      return response.ok;
    } catch (gatewayError) {
      console.error('IPFS gateway not available:', gatewayError);
      return false;
    }
  }
};

// Encrypt data before uploading to IPFS
export const encryptData = async (data: any, password: string): Promise<string> => {
  // This is a simple encryption for demo purposes
  // In production, use a proper encryption library
  
  // Convert data to JSON string
  const jsonData = typeof data === 'object' ? JSON.stringify(data) : data;
  
  // Convert password to key using subtle crypto
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(password)
  );
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Create initialization vector
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(jsonData)
  );
  
  // Combine IV and encrypted data
  const encryptedArray = new Uint8Array(iv.length + encryptedData.byteLength);
  encryptedArray.set(iv, 0);
  encryptedArray.set(new Uint8Array(encryptedData), iv.length);
  
  // Convert to base64 for storage
  return btoa(String.fromCharCode(...encryptedArray));
};

// Decrypt data retrieved from IPFS
export const decryptData = async (encryptedData: string, password: string): Promise<any> => {
  // Convert from base64
  const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  // Extract IV and data
  const iv = encryptedArray.slice(0, 12);
  const data = encryptedArray.slice(12);
  
  // Convert password to key
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(password)
  );
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Decrypt the data
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  );
  
  // Convert to string
  const decryptedString = new TextDecoder().decode(decryptedData);
  
  // Try to parse as JSON, return as string if not valid JSON
  try {
    return JSON.parse(decryptedString);
  } catch {
    return decryptedString;
  }
};
