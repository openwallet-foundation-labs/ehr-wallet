import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint to find an accessId based on an IPFS CID
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Only GET method is allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the CID from the query parameters
    const { cid } = req.query;
    
    if (!cid || typeof cid !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid CID parameter' });
    }
    
    // Find the shared data record with the matching CID
    const sharedData = await prisma.sharedMedicalData.findFirst({
      where: {
        ipfsCid: cid,
        isActive: true,
      },
      select: {
        accessId: true,
        expiryTime: true,
      },
    });
    
    if (!sharedData) {
      return res.status(404).json({ error: 'No shared data found for this CID' });
    }
    
    // Check if the data has expired
    const now = new Date();
    if (now > sharedData.expiryTime) {
      return res.status(403).json({ error: 'Access has expired', expired: true });
    }
    
    // Return the accessId
    return res.status(200).json({
      accessId: sharedData.accessId,
      expiryTime: sharedData.expiryTime,
    });
  } catch (error) {
    console.error('Error finding accessId by CID:', error);
    return res.status(500).json({ error: 'Failed to find accessId' });
  }
}
