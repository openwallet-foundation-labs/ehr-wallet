import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid provider ID is required' });
  }
  
  switch (req.method) {
    case 'GET':
      return await getProvider(req, res, id);
    case 'PUT':
      return await updateProvider(req, res, id);
    case 'DELETE':
      return await deleteProvider(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get provider by ID
async function getProvider(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            patient: true,
            appointmentType: true,
          },
          orderBy: { startTime: 'desc' },
        },
        timeSlots: {
          where: { isAvailable: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    return res.status(200).json(provider);
  } catch (error) {
    console.error(`Error fetching provider ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch provider' });
  }
}

// Update provider
async function updateProvider(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { name, specialty, email, phone } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Check if another provider with the same email exists
    if (email) {
      const existingProvider = await prisma.provider.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });
      
      if (existingProvider) {
        return res.status(400).json({ error: 'Another provider with this email already exists' });
      }
    }
    
    // Update the provider
    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        name,
        specialty: specialty || null,
        email,
        phone: phone || null,
      },
    });
    
    return res.status(200).json(updatedProvider);
  } catch (error) {
    console.error(`Error updating provider ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update provider' });
  }
}

// Delete provider
async function deleteProvider(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if the provider exists
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: { 
        appointments: { where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } } }
      },
    });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Check if the provider has future appointments
    if (provider.appointments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete provider with scheduled or confirmed appointments' 
      });
    }
    
    // Delete the provider (this will cascade delete their time slots)
    await prisma.provider.delete({
      where: { id },
    });
    
    return res.status(200).json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error(`Error deleting provider ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete provider' });
  }
}
