import { NextApiRequest, NextApiResponse } from 'next';
import { getProviderById, updateProvider as updateProviderDB, deleteProvider as deleteProviderDB } from '@/lib/db-utils';
import { initDatabase, db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the database is initialized
  await initDatabase();

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
    const provider = await getProviderById(id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Get provider's appointments
    const appointments = await db.appointments
      .where('providerId')
      .equals(id)
      .toArray();
    
    // Sort appointments by start time (descending)
    appointments.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    // Get provider's available time slots
    const timeSlots = await db.timeSlots
      .where('providerId')
      .equals(id)
      .and(slot => slot.isAvailable)
      .toArray();
      
    // Sort time slots by start time (ascending)
    timeSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Get all patients and appointment types for enriching the appointments
    const patientIds = [...new Set(appointments.map(a => a.patientId))];
    const appointmentTypeIds = [...new Set(appointments.map(a => a.appointmentTypeId).filter(Boolean))];
    
    const patients = await db.patients.where('id').anyOf(patientIds).toArray();
    const appointmentTypes = appointmentTypeIds.length > 0 
      ? await db.appointmentTypes.where('id').anyOf(appointmentTypeIds).toArray() 
      : [];
    
    // Create lookup maps
    const patientsMap = patients.reduce((acc, patient) => {
      acc[patient.id] = patient;
      return acc;
    }, {} as Record<string, any>);
    
    const appointmentTypesMap = appointmentTypes.reduce((acc, type) => {
      acc[type.id] = type;
      return acc;
    }, {} as Record<string, any>);
    
    // Enrich appointments with related entities
    const enrichedAppointments = appointments.map(appointment => {
      return {
        ...appointment,
        patient: patientsMap[appointment.patientId],
        appointmentType: appointment.appointmentTypeId ? appointmentTypesMap[appointment.appointmentTypeId] : null
      };
    });
    
    // Create the complete provider object
    const enrichedProvider = {
      ...provider,
      appointments: enrichedAppointments,
      timeSlots: timeSlots
    };
    
    return res.status(200).json(enrichedProvider);
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
    
    // Get current provider
    const provider = await getProviderById(id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Check if another provider with the same email exists
    if (email) {
      const providers = await db.providers.toArray();
      const existingProvider = providers.find(p => p.email === email && p.id !== id);
      
      if (existingProvider) {
        return res.status(400).json({ error: 'Another provider with this email already exists' });
      }
    }
    
    // Update the provider using the utility function
    const updatedProvider = await updateProviderDB(id, {
      name,
      specialty: specialty || null,
      email,
      phone: phone || null,
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
    const provider = await getProviderById(id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Get the provider's appointments
    const appointments = await db.appointments
      .where('providerId')
      .equals(id)
      .toArray();
    
    // Check for active appointments (scheduled or confirmed)
    const activeAppointments = appointments.filter(
      a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
    );
    
    // Check if the provider has future appointments
    if (activeAppointments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete provider with scheduled or confirmed appointments' 
      });
    }
    
    // Delete the provider using the utility function
    await deleteProviderDB(id);
    
    return res.status(200).json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error(`Error deleting provider ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete provider' });
  }
}
