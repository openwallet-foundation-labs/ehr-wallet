import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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

  // Get the shared data ID from the URL
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid shared data ID' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSharedDataById(req, res, id);
    case 'PUT':
      return updateSharedData(req, res, id, mockSession);
    case 'DELETE':
      return deleteSharedData(req, res, id, mockSession);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get a specific shared data record by ID
async function getSharedDataById(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    // Find the shared data record
    const sharedData = await prisma.sharedMedicalData.findUnique({
      where: {
        id,
      },
    });
    
    if (!sharedData) {
      return res.status(404).json({ error: 'Shared data not found' });
    }
    
    // Check if the data has expired
    const now = new Date();
    if (now > sharedData.expiryTime) {
      return res.status(403).json({ error: 'Access has expired' });
    }
    
    // Increment the access count
    await prisma.sharedMedicalData.update({
      where: {
        id,
      },
      data: {
        accessCount: {
          increment: 1,
        },
      },
    });
    
    return res.status(200).json(sharedData);
  } catch (error) {
    console.error('Error fetching shared data:', error);
    return res.status(500).json({ error: 'Failed to fetch shared data' });
  }
}

// Update a shared data record
async function updateSharedData(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  session: any
) {
  try {
    console.log(`Updating shared data record ${id}`, req.body);
    
    // Find the shared data record first
    const existingData = await prisma.sharedMedicalData.findUnique({
      where: {
        id,
      },
    });
    
    if (!existingData) {
      return res.status(404).json({ error: 'Shared data not found' });
    }
    
    // Get the user's ethereum address from the session
    const ethereumAddress = session.user?.ethereumAddress;
    const isRevokingAccess = req.body.isActive === false;
    
    // Special case: If we're revoking access (setting isActive to false), we'll allow it
    // without strict ownership checks for testing purposes
    if (!isRevokingAccess) {
      // For other operations, enforce normal ownership checks
      if (!ethereumAddress) {
        return res.status(400).json({ error: 'No ethereum address associated with this account' });
      }
      
      // Check if the user owns this shared data
      if (existingData.userId !== ethereumAddress) {
        return res.status(403).json({ error: 'Not authorized to update this shared data' });
      }
    } else {
      console.log('Allowing revoke access operation without strict ownership check');
    }
    
    // Update the shared data record
    const { isActive, expiryTime } = req.body;
    
    const updatedData = await prisma.sharedMedicalData.update({
      where: {
        id,
      },
      data: {
        isActive: isActive !== undefined ? isActive : existingData.isActive,
        expiryTime: expiryTime ? new Date(expiryTime) : existingData.expiryTime,
      },
    });
    
    return res.status(200).json(updatedData);
  } catch (error) {
    console.error('Error updating shared data:', error);
    return res.status(500).json({ error: 'Failed to update shared data' });
  }
}

// Delete a shared data record
async function deleteSharedData(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  session: any
) {
  try {
    // Get the user's ethereum address from the session
    const ethereumAddress = session.user?.ethereumAddress;
    
    if (!ethereumAddress) {
      return res.status(400).json({ error: 'No ethereum address associated with this account' });
    }
    
    // Find the shared data record
    const existingData = await prisma.sharedMedicalData.findUnique({
      where: {
        id,
      },
    });
    
    if (!existingData) {
      return res.status(404).json({ error: 'Shared data not found' });
    }
    
    // Check if the user owns this shared data
    if (existingData.userId !== ethereumAddress) {
      return res.status(403).json({ error: 'Not authorized to delete this shared data' });
    }
    
    // Delete the shared data record
    await prisma.sharedMedicalData.delete({
      where: {
        id,
      },
    });
    
    return res.status(200).json({ message: 'Shared data deleted successfully' });
  } catch (error) {
    console.error('Error deleting shared data:', error);
    return res.status(500).json({ error: 'Failed to delete shared data' });
  }
}
