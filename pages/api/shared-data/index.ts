import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Initialize Prisma client directly in the API route
// Use type assertion to avoid TypeScript errors with model names
const prisma = new PrismaClient() as PrismaClient & {
  sharedMedicalData: any;
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Require authentication for all requests
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.ethereumAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSharedData(req, res, session);
    case 'POST':
      return createSharedData(req, res, session);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get shared data records for the current user
async function getSharedData(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    // Check if we should return all records (for access logs page)
    const returnAllRecords = req.query.all === 'true';
    
    // For debugging, get all shared data records
    const allRecords = await prisma.sharedMedicalData.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`Total shared data records in database: ${allRecords.length}`);
    if (allRecords.length > 0) {
      console.log('Sample record:', JSON.stringify(allRecords[0]));
    }
    
    // If all=true parameter is provided, return all records
    if (returnAllRecords) {
      console.log('Returning all shared data records for access logs');
      return res.status(200).json(allRecords);
    }
    
    // Otherwise, get user-specific records
    // Only allow access to the authenticated user's own records
    const ethereumAddress = session.user?.ethereumAddress;

    if (!ethereumAddress) {
      return res.status(400).json({ error: 'No ethereum address associated with this account' });
    }

    // Normalize the ethereum address to lowercase for consistency
    const normalizedAddress = ethereumAddress.toLowerCase();
    
    console.log(`Fetching shared data for address: ${normalizedAddress}`);
    
    // Query the database for shared data records for the authenticated user only
    const sharedData = await prisma.sharedMedicalData.findMany({
      where: {
        userId: normalizedAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`Found ${sharedData.length} records for address ${normalizedAddress}`);
    
    return res.status(200).json(sharedData);
  } catch (error) {
    console.error('Error fetching shared data:', error);
    return res.status(500).json({ error: 'Failed to fetch shared data' });
  }
}

// Create a new shared data record
async function createSharedData(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { 
      accessId, 
      ipfsCid, 
      expiryTime, 
      hasPassword, 
      dataTypes 
    } = req.body;
    
    console.log('Creating shared data record with:', { accessId, ipfsCid, expiryTime, hasPassword });
    
    // Validate required fields
    if (!accessId || !ipfsCid || !expiryTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get the user's ethereum address from the session
    const ethereumAddress = session.user?.ethereumAddress;

    if (!ethereumAddress) {
      return res.status(400).json({ error: 'No ethereum address associated with this account' });
    }

    // Normalize the address to lowercase
    const normalizedAddress = ethereumAddress.toLowerCase();
    
    // Create the shared data record
    const sharedData = await prisma.sharedMedicalData.create({
      data: {
        accessId,
        ipfsCid,
        userId: normalizedAddress, // Always use lowercase for consistency
        expiryTime: new Date(expiryTime),
        hasPassword: hasPassword || false,
        dataTypes: Array.isArray(dataTypes) ? dataTypes.join(',') : dataTypes,
        accessCount: 0,
        isActive: true,
      },
    });
    
    console.log('Successfully created shared data record:', sharedData.id);
    
    return res.status(201).json(sharedData);
  } catch (error) {
    console.error('Error creating shared data:', error);
    return res.status(500).json({ error: 'Failed to create shared data' });
  }
}
