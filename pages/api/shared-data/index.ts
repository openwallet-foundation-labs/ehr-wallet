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
  // Accept authentication via either NextAuth session OR wallet address header
  const session = await getServerSession(req, res, authOptions);

  // Get wallet address from header (sent by Web3 clients)
  const walletAddress = req.headers['x-wallet-address'] as string | undefined;

  // Accept either session or wallet
  const ethereumAddress = session?.user?.ethereumAddress || walletAddress?.toLowerCase();

  if (!ethereumAddress) {
    return res.status(401).json({ error: 'Authentication required. Please login or connect wallet.' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSharedData(req, res, ethereumAddress);
    case 'POST':
      return createSharedData(req, res, ethereumAddress);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get shared data records for the current user
async function getSharedData(
  req: NextApiRequest,
  res: NextApiResponse,
  ethereumAddress: string
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

    if (allRecords.length > 0) {
    }

    // If all=true parameter is provided, return all records
    if (returnAllRecords) {
      return res.status(200).json(allRecords);
    }

    // Otherwise, get user-specific records
    // Normalize the ethereum address to lowercase for consistency
    const normalizedAddress = ethereumAddress.toLowerCase();


    // Query the database for shared data records for the authenticated user only
    const sharedData = await prisma.sharedMedicalData.findMany({
      where: {
        userId: normalizedAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });


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
  ethereumAddress: string
) {
  try {
    const {
      accessId,
      ipfsCid,
      expiryTime,
      hasPassword,
      dataTypes
    } = req.body;


    // Validate required fields
    if (!accessId || !ipfsCid || !expiryTime) {
      return res.status(400).json({ error: 'Missing required fields' });
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


    return res.status(201).json(sharedData);
  } catch (error) {
    console.error('Error creating shared data:', error);
    return res.status(500).json({ error: 'Failed to create shared data' });
  }
}
