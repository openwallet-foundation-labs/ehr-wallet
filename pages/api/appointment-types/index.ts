import { NextApiRequest, NextApiResponse } from 'next';
import { getAllAppointmentTypes, createAppointmentType } from '@/lib/db-utils';
import { initDatabase } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the database is initialized
  await initDatabase();
  
  switch (req.method) {
    case 'GET':
      return await getAppointmentTypes(req, res);
    case 'POST':
      return await createNewAppointmentType(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get all appointment types
async function getAppointmentTypes(req: NextApiRequest, res: NextApiResponse) {
  try {
    const appointmentTypes = await getAllAppointmentTypes();
    return res.status(200).json(appointmentTypes);
  } catch (error) {
    console.error('Error fetching appointment types:', error);
    return res.status(500).json({ error: 'Failed to fetch appointment types' });
  }
}

// Create a new appointment type
async function createNewAppointmentType(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, duration, color } = req.body;
    
    // Validate required fields
    if (!name || !duration || isNaN(duration)) {
      return res.status(400).json({ error: 'Name and valid duration (in minutes) are required' });
    }
    
    // Create the appointment type using the utility function
    const appointmentType = await createAppointmentType({
      name,
      description: description || null,
      duration: parseInt(duration),
      color: color || null,
    });
    
    return res.status(201).json(appointmentType);
  } catch (error) {
    console.error('Error creating appointment type:', error);
    return res.status(500).json({ error: 'Failed to create appointment type' });
  }
}
