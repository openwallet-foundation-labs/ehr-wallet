import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await getProviders(req, res);
    case 'POST':
      return await createProvider(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get all providers
async function getProviders(req: NextApiRequest, res: NextApiResponse) {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { name: 'asc' },
    });
    
    return res.status(200).json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return res.status(500).json({ error: 'Failed to fetch providers' });
  }
}

// Create a new provider
async function createProvider(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, specialty, email, phone } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Check if a provider with this email already exists
    const existingProvider = await prisma.provider.findUnique({
      where: { email },
    });
    
    if (existingProvider) {
      return res.status(400).json({ error: 'A provider with this email already exists' });
    }
    
    // Create the provider
    const provider = await prisma.provider.create({
      data: {
        name,
        specialty: specialty || null,
        email,
        phone: phone || null,
      },
    });
    
    return res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating provider:', error);
    return res.status(500).json({ error: 'Failed to create provider' });
  }
}
