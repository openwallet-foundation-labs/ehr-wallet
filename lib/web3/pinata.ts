'use client';

import axios from 'axios';
import FormData from 'form-data';

/**
 * Validate that a string is a valid IPFS CID
 */
function isValidCID(cid: string): boolean {
  // Basic validation: CIDs start with 'Qm' (v0) or 'b' (v1)
  return /^Qm[a-zA-Z0-9]{44}$/.test(cid) || /^b[a-zA-Z0-9]{58}$/.test(cid);
}

/**
 * Pinata IPFS service for uploading, pinning, and retrieving content
 */
export class PinataService {
  private apiKey: string | null;
  private secretApiKey: string | null;
  private jwt: string | null;
  private apiUrl: string;
  private gatewayUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || null;
    this.secretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY || null;
    this.jwt = process.env.NEXT_PUBLIC_PINATA_JWT || null;
    this.apiUrl = 'https://api.pinata.cloud';
    this.gatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
  }

  /**
   * Check if Pinata credentials are configured
   */
  public isConfigured(): boolean {
    return (this.apiKey !== null && this.secretApiKey !== null) || this.jwt !== null;
  }

  /**
   * Get authorization headers for Pinata API requests
   */
  private getAuthHeaders() {
    if (this.jwt) {
      return {
        Authorization: `Bearer ${this.jwt}`
      };
    }
    
    return {
      pinata_api_key: this.apiKey,
      pinata_secret_api_key: this.secretApiKey
    };
  }

  /**
   * Upload JSON data to IPFS via Pinata
   * @param jsonData - The JSON data to upload
   * @param name - Optional name for the file
   * @returns The CID of the uploaded content
   */
  public async uploadJSON(jsonData: any, name?: string): Promise<string> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Pinata credentials not configured');
      }

      const data = JSON.stringify({
        pinataOptions: {
          cidVersion: 1
        },
        pinataMetadata: {
          name: name || `Upload-${Date.now()}`,
          keyvalues: {
            timestamp: Date.now().toString(),
            type: 'json'
          }
        },
        pinataContent: jsonData
      });

      const config = {
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        data: data
      };

      const response = await axios(config);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading JSON to Pinata:', error);
      throw new Error(`Failed to upload to Pinata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload a file to IPFS via Pinata
   * @param file - The file to upload
   * @param name - Optional name for the file
   * @returns The CID of the uploaded content
   */
  public async uploadFile(file: File, name?: string): Promise<string> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Pinata credentials not configured');
      }

      const formData = new FormData();
      
      // Append the file to the form data
      formData.append('file', file);
      
      // Add pinata metadata
      const metadata = JSON.stringify({
        name: name || file.name,
        keyvalues: {
          timestamp: Date.now().toString(),
          type: file.type,
          size: file.size.toString()
        }
      });
      formData.append('pinataMetadata', metadata);
      
      // Add pinata options
      const options = JSON.stringify({
        cidVersion: 1
      });
      formData.append('pinataOptions', options);

      const config = {
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': `multipart/form-data; boundary=${(formData as any)._boundary}`
        },
        data: formData
      };

      const response = await axios(config);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading file to Pinata:', error);
      throw new Error(`Failed to upload to Pinata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get content from IPFS via Pinata gateway
   * @param cid - The CID of the content to retrieve
   * @returns The content
   */
  public async getContent(cid: string): Promise<any> {
    try {
      // Validate CID to prevent SSRF
      if (!isValidCID(cid)) {
        throw new Error('Invalid IPFS CID');
      }

      // First try to get directly from Pinata gateway
      const response = await axios.get(`${this.gatewayUrl}/${cid}`);
      return response.data;
    } catch (error) {
      console.warn('Error retrieving from Pinata gateway, trying API:', error);
      
      // If direct gateway access fails, try the API
      try {
        if (!this.isConfigured()) {
          throw new Error('Pinata credentials not configured');
        }
        
        const config = {
          method: 'get',
          url: `https://api.pinata.cloud/pinning/pinJobs?ipfs_pin_hash=${cid}`,
          headers: this.getAuthHeaders()
        };
        
        const pinStatusResponse = await axios(config);
        
        // If we can confirm it's pinned, try the gateway again with a different approach
        if (pinStatusResponse.data.rows && pinStatusResponse.data.rows.length > 0) {
          try {
            // Try with dag-json format for CIDv1
            const dagResponse = await axios.get(`${this.gatewayUrl}/${cid}?format=dag-json`);
            return dagResponse.data;
          } catch (formatError) {
            console.warn('Error retrieving with dag-json format:', formatError);
            
            // Try with raw format
            const rawResponse = await axios.get(`${this.gatewayUrl}/${cid}?format=raw`);
            return rawResponse.data;
          }
        }
        
        throw new Error(`Content with CID ${cid} not found in Pinata`);
      } catch (apiError) {
        console.error('Error retrieving from Pinata API:', apiError);
        throw new Error(`Failed to retrieve content from Pinata: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    }
  }

  /**
   * Check if a CID is pinned on Pinata
   * @param cid - The CID to check
   * @returns Whether the CID is pinned
   */
  public async isPinned(cid: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Pinata credentials not configured');
      }

      if (!isValidCID(cid)) {
        throw new Error('Invalid IPFS CID');
      }
      
      const config = {
        method: 'get',
        url: `https://api.pinata.cloud/pinning/pinJobs?ipfs_pin_hash=${cid}`,
        headers: this.getAuthHeaders()
      };
      
      const response = await axios(config);
      return response.data.rows && response.data.rows.length > 0;
    } catch (error) {
      console.error('Error checking pin status:', error);
      return false;
    }
  }

  /**
   * Unpin content from Pinata
   * @param cid - The CID to unpin
   * @returns Whether the operation was successful
   */
  public async unpin(cid: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Pinata credentials not configured');
      }

      if (!isValidCID(cid)) {
        throw new Error('Invalid IPFS CID');
      }
      
      const config = {
        method: 'delete',
        url: `https://api.pinata.cloud/pinning/unpin/${cid}`,
        headers: this.getAuthHeaders()
      };
      
      await axios(config);
      return true;
    } catch (error) {
      console.error('Error unpinning content:', error);
      return false;
    }
  }

  /**
   * Get the gateway URL for a CID
   * @param cid - The CID
   * @returns The gateway URL
   */
  public getGatewayUrl(cid: string): string {
    return `${this.gatewayUrl}/${cid}`;
  }

  /**
   * Get pin list with metadata for all pins or filtered by CID
   * @param cid - Optional CID to filter by
   * @returns Pin list data
   */
  public async getPinList(cid?: string): Promise<any> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Pinata credentials not configured');
      }
      
      let url = `${this.apiUrl}/pinning/pinList`;
      
      // If CID is provided, filter by it
      if (cid) {
        url += `?hashContains=${cid}`;
      }
      
      const config = {
        method: 'get',
        url,
        headers: this.getAuthHeaders()
      };
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Error getting pin list:', error);
      throw new Error(`Failed to get pin list: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get access statistics for a CID
   * This uses Pinata's pin by CID endpoint to get metadata about the pin
   * @param cid - The CID to get statistics for
   * @returns Access statistics for the CID
   */
  public async getCidStats(cid: string): Promise<any> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Pinata credentials not configured');
      }

      if (!isValidCID(cid)) {
        throw new Error('Invalid IPFS CID');
      }
      
      // First try to get the pin details
      const pinList = await this.getPinList(cid);
      
      if (!pinList.rows || pinList.rows.length === 0) {
        throw new Error(`CID ${cid} not found in Pinata`);
      }
      
      // Get the pin details
      const pin = pinList.rows.find((row: any) => row.ipfs_pin_hash === cid);
      
      if (!pin) {
        throw new Error(`CID ${cid} not found in Pinata`);
      }
      
      // Get the pin's metadata
      const metadata = {
        name: pin.metadata?.name || 'Unknown',
        keyvalues: pin.metadata?.keyvalues || {},
        pinSize: pin.size || 0,
        pinDate: pin.date_pinned,
        status: pin.status,
        regions: pin.regions || []
      };
      
      // For actual access statistics, we would need to use Pinata's Submarine API
      // which requires a paid plan. For now, we'll return the metadata we have.
      return {
        cid,
        ...metadata,
        // Estimate access count based on pin date (this is a placeholder)
        // In a real implementation with Submarine, we would get actual access counts
        estimatedAccessCount: Math.floor((Date.now() - new Date(pin.date_pinned).getTime()) / (1000 * 60 * 60 * 24)) + 1
      };
    } catch (error) {
      console.error('Error getting CID stats:', error);
      // Return a default object with zero stats if there's an error
      return {
        cid,
        name: 'Unknown',
        keyvalues: {},
        pinSize: 0,
        pinDate: new Date().toISOString(),
        status: 'unknown',
        regions: [],
        estimatedAccessCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get access logs for multiple CIDs
   * @param cids - Array of CIDs to get logs for
   * @returns Access logs for the CIDs
   */
  public async getAccessLogs(cids: string[]): Promise<any[]> {
    const logs = [];
    
    for (const cid of cids) {
      try {
        const stats = await this.getCidStats(cid);
        logs.push(stats);
      } catch (error) {
        console.error(`Error getting access logs for CID ${cid}:`, error);
        logs.push({
          cid,
          error: error instanceof Error ? error.message : String(error),
          estimatedAccessCount: 0
        });
      }
    }
    
    return logs;
  }
}

// Create a singleton instance
export const pinataService = new PinataService();
