'use client';

import { create } from 'ipfs-http-client';

// Create an IPFS client instance
const createIpfsClient = () => {
  const projectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID;
  const projectSecret = process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET;
  const nodeUrl = process.env.NEXT_PUBLIC_IPFS_NODE_URL;
  
  // If using Infura or a service that requires authentication
  if (projectId && projectSecret) {
    const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
    return create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        authorization: auth,
      },
    });
  }
  
  // If using a public or self-hosted node
  if (nodeUrl) {
    const url = new URL(nodeUrl);
    return create({
      host: url.hostname,
      port: parseInt(url.port || '5001'),
      protocol: url.protocol.replace(':', ''),
    });
  }
  
  throw new Error('IPFS configuration missing');
};

// Upload data to IPFS
export const uploadToIpfs = async (data: any): Promise<string> => {
  try {
    const ipfs = createIpfsClient();
    
    // Convert data to JSON string if it's an object
    const content = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // Add content to IPFS
    const result = await ipfs.add(content);
    
    // Return the CID (Content Identifier)
    return result.path;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

// Retrieve data from IPFS
export const getFromIpfs = async (cid: string): Promise<any> => {
  try {
    const ipfs = createIpfsClient();
    
    // Get content from IPFS
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    
    // Combine chunks and convert to string
    const content = Buffer.concat(chunks).toString();
    
    // Try to parse as JSON, return as string if not valid JSON
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw error;
  }
};

// Get IPFS gateway URL for a CID
export const getIpfsGatewayUrl = (cid: string): string => {
  const gatewayUrl = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs';
  return `${gatewayUrl}/${cid}`;
};

// Encrypt data before uploading to IPFS
export const encryptData = async (data: any, password: string): Promise<string> => {
  // This is a simple encryption for demo purposes
  // In production, use a proper encryption library
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
