import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Authentication disabled for development - allow all access
  console.log('API: Authentication checks disabled for development');
  
  // Create a mock session for development
  const mockSession = {
    user: {
      email: 'dev@example.com',
      ethereumAddress: '0x123456789abcdef123456789abcdef123456789a'
    }
  };

  // Only GET method is allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use mock user data for development
    const user = {
      ethereumAddress: mockSession.user.ethereumAddress
    };

    console.log('Using mock user for development:', user);

    console.log(`Fetching access logs for user with ethereum address: ${user.ethereumAddress}`);
    
    // For debugging, let's first check all shared data records in the database
    const allSharedData = await prisma.sharedMedicalData.findMany({
      where: {},
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 records for debugging
    });
    
    console.log(`Total shared data records in database: ${allSharedData.length}`);
    if (allSharedData.length > 0) {
      console.log('Sample record:', JSON.stringify(allSharedData[0]));
    }
    
    // Get all ethereum addresses associated with this user (for testing purposes)
    // This helps if the user has multiple addresses or if there's a mismatch
    const possibleAddresses = [
      user.ethereumAddress,
      user.ethereumAddress?.toLowerCase(),
      user.ethereumAddress?.toUpperCase(),
    ].filter(Boolean) as string[];
    
    console.log(`Found ${possibleAddresses.length} possible addresses for this user`);
    
    // Fetch shared medical data records for this user with any of their addresses
    const sharedData = await prisma.sharedMedicalData.findMany({
      where: {
        OR: possibleAddresses.map(address => ({ userId: address })),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`Found ${sharedData.length} records for address ${user.ethereumAddress}`);
    if (sharedData.length === 0 && allSharedData.length > 0) {
      // If no records were found for this user but there are records in the database,
      // let's use all records for testing purposes
      console.log('Using all records for testing purposes');
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
