'use client';

import { ethers } from 'ethers';

// ABI for the AccessControl smart contract
const accessControlAbi = [
  // Events
  "event AccessCreated(bytes32 indexed accessId, address indexed owner, string ipfsCid, uint256 expiryTime)",
  "event AccessVerified(bytes32 indexed accessId, address indexed viewer)",
  "event AccessDenied(bytes32 indexed accessId, address indexed viewer, string reason)",
  
  // Functions
  "function createAccess(string memory _ipfsCid, uint256 _durationSeconds, bytes32 _passwordHash) external returns (bytes32 accessId)",
  "function verifyAccess(bytes32 _accessId, string memory _passwordInput) external view returns (string memory ipfsCid)",
  "function getAccessGrantDetails(bytes32 _accessId) external view returns (address owner, string memory ipfsCid, uint256 expiryTime, bool hasPassword)"
];

// Get provider and contract instance
export const getAccessControlContract = async () => {
  // Check if window.ethereum is available
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  // Get the contract address from environment variables
  const contractAddress = process.env.NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('Contract address not configured');
  }
  
  // Create a provider
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // Get the signer
  const signer = await provider.getSigner();
  
  // Create a contract instance
  return new ethers.Contract(contractAddress, accessControlAbi, signer);
};

// Create a new access grant
export const createAccessGrant = async (
  ipfsCid: string,
  durationInSeconds: number,
  password?: string
): Promise<string> => {
  try {
    const contract = await getAccessControlContract();
    
    // Calculate password hash if provided, otherwise use bytes32(0)
    const passwordHash = password 
      ? ethers.keccak256(ethers.toUtf8Bytes(password))
      : ethers.ZeroHash;
    
    // Call the contract
    const tx = await contract.createAccess(ipfsCid, durationInSeconds, passwordHash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Extract the accessId from the event logs
    const event = receipt.logs
      .filter((log: any) => log.topics[0] === contract.interface.getEvent('AccessCreated').topicHash)
      .map((log: any) => contract.interface.parseLog(log))[0];
    
    // Return the accessId
    return event.args.accessId;
  } catch (error) {
    console.error('Error creating access grant:', error);
    throw error;
  }
};

// Verify access to a shared resource
export const verifyAccess = async (
  accessId: string,
  password?: string
): Promise<string> => {
  try {
    const contract = await getAccessControlContract();
    
    // Call the contract
    const ipfsCid = await contract.verifyAccess(
      accessId,
      password || ''
    );
    
    return ipfsCid;
  } catch (error) {
    console.error('Error verifying access:', error);
    throw error;
  }
};

// Get details about an access grant
export const getAccessGrantDetails = async (
  accessId: string
): Promise<{
  owner: string;
  ipfsCid: string;
  expiryTime: Date;
  hasPassword: boolean;
}> => {
  try {
    const contract = await getAccessControlContract();
    
    // Call the contract
    const [owner, ipfsCid, expiryTime, hasPassword] = await contract.getAccessGrantDetails(accessId);
    
    return {
      owner,
      ipfsCid,
      expiryTime: new Date(Number(expiryTime) * 1000), // Convert from Unix timestamp to JS Date
      hasPassword
    };
  } catch (error) {
    console.error('Error getting access grant details:', error);
    throw error;
  }
};

// Generate a shareable link for an access grant
export const generateShareableLink = (accessId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${accessId}`;
};
