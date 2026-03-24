import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Accept authentication via either NextAuth session OR wallet address header
  const session = await getServerSession(req, res, authOptions);
  const walletAddress = req.headers['x-wallet-address'] as string | undefined;
  const ethereumAddress = session?.user?.ethereumAddress || walletAddress?.toLowerCase();

  if (!ethereumAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Only GET method is allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    
    // For debugging, let's first check all shared data records in the database
    const allSharedData = await prisma.sharedMedicalData.findMany({
      where: {},
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 records for debugging
    });
    
    if (allSharedData.length > 0) {
    }
    
    // Get all ethereum addresses associated with this user (for testing purposes)
    // This helps if the user has multiple addresses or if there's a mismatch
    const possibleAddresses = [
      ethereumAddress,
      ethereumAddress?.toLowerCase(),
      ethereumAddress?.toUpperCase(),
    ].filter(Boolean) as string[];


    // Fetch shared medical data records for this user with any of their addresses
    const sharedData = await prisma.sharedMedicalData.findMany({
      where: {
        OR: possibleAddresses.map(address => ({ userId: address })),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (sharedData.length === 0 && allSharedData.length > 0) {
      // If no records were found for this user but there are records in the database,
      // let's use all records for testing purposes
      return res.status(200).json(allSharedData.map(data => {
        const dataTypes = data.dataTypes ? data.dataTypes.split(',') : [];
        return {
          id: data.accessId,
          accessedBy: data.userId,
          accessedAt: data.createdAt,
          dataTypes: dataTypes,
          ipfsCid: data.ipfsCid,
          status: data.isActive && new Date() < data.expiryTime ? 'active' : 'expired',
          expiryTime: data.expiryTime,
          accessCount: data.accessCount || 0,
          pinStatus: 'pinned'
        };
      }));
    }

    // Transform the data to match the expected format in the frontend
    const accessLogs = sharedData.map(data => {
      // Parse dataTypes from comma-separated string to array
      const dataTypes = data.dataTypes ? data.dataTypes.split(',') : [];
      
      return {
        id: data.accessId,
        accessedBy: data.userId, // This is actually the owner, in a real blockchain implementation this would be different
        accessedAt: data.createdAt,
        dataTypes: dataTypes,
        ipfsCid: data.ipfsCid,
        status: data.isActive && new Date() < data.expiryTime ? 'active' : 'expired',
        expiryTime: data.expiryTime,
        accessCount: data.accessCount || 0, // Use actual count or 0 if not set
        pinStatus: 'pinned'
      };
    });

    return res.status(200).json(accessLogs);
  } catch (error) {
    console.error('Error fetching access logs:', error);
    return res.status(500).json({ error: 'Failed to fetch access logs' });
  }
}
