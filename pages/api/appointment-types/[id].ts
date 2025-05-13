import { NextApiRequest, NextApiResponse } from 'next';
import { getAppointmentTypeById, updateAppointmentType as updateAppointmentTypeDB, deleteAppointmentType as deleteAppointmentTypeDB } from '@/lib/db-utils';
import { initDatabase, db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the database is initialized
  await initDatabase();
  
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
    const appointmentType = await getAppointmentTypeById(id);
    
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
    
    // Check if the appointment type exists
    const appointmentType = await getAppointmentTypeById(id);
    
    if (!appointmentType) {
      return res.status(404).json({ error: 'Appointment type not found' });
    }
    
    // Update the appointment type using the utility function
    const updatedAppointmentType = await updateAppointmentTypeDB(id, {
      name,
      description: description || null,
      duration: parseInt(duration),
      color: color || null,
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
    const appointmentType = await getAppointmentTypeById(id);
    
    if (!appointmentType) {
      return res.status(404).json({ error: 'Appointment type not found' });
    }
    
    // Get all appointments with this appointment type
    const appointments = await db.appointments
      .where('appointmentTypeId')
      .equals(id)
      .toArray();
    
    // Check if the appointment type is being used in future appointments
    const activeAppointments = appointments.filter(
      a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
    );
    
    if (activeAppointments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete appointment type that is used in scheduled or confirmed appointments' 
      });
    }
    
    // Delete the appointment type using the utility function
    await deleteAppointmentTypeDB(id);
    
    return res.status(200).json({ message: 'Appointment type deleted successfully' });
  } catch (error) {
    console.error(`Error deleting appointment type ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete appointment type' });
  }
}
