import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid appointment type ID is required' });
  }
  
  switch (req.method) {
    case 'GET':
      return await getAppointmentType(req, res, id);
    case 'PUT':
      return await updateAppointmentType(req, res, id);
    case 'DELETE':
      return await deleteAppointmentType(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get appointment type by ID
async function getAppointmentType(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const appointmentType = await prisma.appointmentType.findUnique({
      where: { id },
    });
    
    if (!appointmentType) {
      return res.status(404).json({ error: 'Appointment type not found' });
    }
    
    return res.status(200).json(appointmentType);
  } catch (error) {
    console.error(`Error fetching appointment type ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch appointment type' });
  }
}

// Update appointment type
async function updateAppointmentType(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { name, description, duration, color } = req.body;
    
    // Validate required fields
    if (!name || !duration || isNaN(duration)) {
      return res.status(400).json({ error: 'Name and valid duration (in minutes) are required' });
    }
    
    // Update the appointment type
    const updatedAppointmentType = await prisma.appointmentType.update({
      where: { id },
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        color: color || null,
      },
    });
    
    return res.status(200).json(updatedAppointmentType);
  } catch (error) {
    console.error(`Error updating appointment type ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update appointment type' });
  }
}

// Delete appointment type
async function deleteAppointmentType(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if the appointment type exists
    const appointmentType = await prisma.appointmentType.findUnique({
      where: { id },
      include: { 
        appointments: { where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } } }
      },
    });
    
    if (!appointmentType) {
      return res.status(404).json({ error: 'Appointment type not found' });
    }
    
    // Check if the appointment type is being used in future appointments
    if (appointmentType.appointments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete appointment type that is used in scheduled or confirmed appointments' 
      });
    }
    
    // Delete the appointment type
    await prisma.appointmentType.delete({
      where: { id },
    });
    
    return res.status(200).json({ message: 'Appointment type deleted successfully' });
  } catch (error) {
    console.error(`Error deleting appointment type ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete appointment type' });
  }
}
