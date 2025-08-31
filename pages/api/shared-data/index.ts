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
  // Authentication disabled for development - allow all access
  console.log('API: Authentication checks disabled for development');
  
  // Create a mock session for development
  const mockSession = {
    user: {
      ethereumAddress: '0x123456789abcdef123456789abcdef123456789a'
    }
  };

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSharedData(req, res, mockSession);
    case 'POST':
      return createSharedData(req, res, mockSession);
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
    // Get the user's ethereum address from the session or query parameter
    let ethereumAddress = session.user?.ethereumAddress;
    
    // If not in session, try to get from query parameter
    if (!ethereumAddress && req.query.address) {
      ethereumAddress = req.query.address as string;
    }
    
    if (!ethereumAddress) {
      return res.status(400).json({ error: 'No ethereum address associated with this account or provided in the request' });
    }
    
    // Normalize the ethereum address to lowercase for consistency
    const normalizedAddress = ethereumAddress.toLowerCase();
    
    console.log(`Fetching shared data for address: ${normalizedAddress}`);
    
    // Query the database for shared data records with more flexible matching
    const sharedData = await prisma.sharedMedicalData.findMany({
      where: {
        OR: [
          { userId: normalizedAddress },
          { userId: ethereumAddress }, // Try with original case too
          // If using a demo address for testing
          { userId: '0x123456789abcdef123456789abcdef123456789a' }
        ],
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
    let ethereumAddress = session.user?.ethereumAddress;
    
    if (!ethereumAddress) {
      // For development/testing, use a default address if none is available
      if (process.env.NODE_ENV === 'development') {
        ethereumAddress = '0x123456789abcdef123456789abcdef123456789a';
        console.log('Using default ethereum address for development:', ethereumAddress);
      } else {
        return res.status(400).json({ error: 'No ethereum address associated with this account' });
      }
    }
    
    // Normalize the address to lowercase
    const normalizedAddress = ethereumAddress.toLowerCase();
    console.log('Using normalized address:', normalizedAddress);
    
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
