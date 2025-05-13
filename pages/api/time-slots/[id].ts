import { NextApiRequest, NextApiResponse } from 'next';
import { getTimeSlotById, updateTimeSlot as updateTimeSlotDB, deleteTimeSlot as deleteTimeSlotDB, getProviderById } from '@/lib/db-utils';
import { initDatabase, db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the database is initialized
  await initDatabase();

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid time slot ID is required' });
  }
  
  switch (req.method) {
    case 'GET':
      return await getTimeSlot(req, res, id);
    case 'PUT':
      return await updateTimeSlot(req, res, id);
    case 'DELETE':
      return await deleteTimeSlot(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get time slot by ID
async function getTimeSlot(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const timeSlot = await getTimeSlotById(id);
    
    if (!timeSlot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    // Get the provider data
    const provider = await getProviderById(timeSlot.providerId);
    
    // Create the response with the provider included
    const response = {
      ...timeSlot,
      provider
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error(`Error fetching time slot ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch time slot' });
  }
}

// Update time slot
async function updateTimeSlot(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { startTime, endTime, isAvailable } = req.body;
    
    // Validate required fields
    if ((!startTime && startTime !== undefined) || (!endTime && endTime !== undefined)) {
      return res.status(400).json({ error: 'Start time and end time are required if provided' });
    }
    
    // Get the current time slot
    const currentTimeSlot = await getTimeSlotById(id);
    
    if (!currentTimeSlot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    // Validate times if provided
    let parsedStartTime = new Date(currentTimeSlot.startTime);
    let parsedEndTime = new Date(currentTimeSlot.endTime);
    
    if (startTime) {
      parsedStartTime = new Date(startTime);
      if (isNaN(parsedStartTime.getTime())) {
        return res.status(400).json({ error: 'Invalid start time format' });
      }
    }
    
    if (endTime) {
      parsedEndTime = new Date(endTime);
      if (isNaN(parsedEndTime.getTime())) {
        return res.status(400).json({ error: 'Invalid end time format' });
      }
    }
    
    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Check for overlapping time slots if times are being changed
    if (startTime || endTime) {
      // Get all time slots for this provider
      const providerTimeSlots = await db.timeSlots
        .where('providerId')
        .equals(currentTimeSlot.providerId)
        .toArray();
      
      // Filter out the current time slot and check for overlaps
      const overlappingSlots = providerTimeSlots.filter(slot => {
        // Skip the current time slot
        if (slot.id === id) return false;
        
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        
        return (
          // New start time is within an existing slot
          (slotStart <= parsedStartTime && slotEnd > parsedStartTime) ||
          // New end time is within an existing slot
          (slotStart < parsedEndTime && slotEnd >= parsedEndTime) ||
          // New slot completely contains an existing slot
          (parsedStartTime <= slotStart && parsedEndTime >= slotEnd)
        );
      });
      
      if (overlappingSlots.length > 0) {
        return res.status(400).json({ error: 'Time slot overlaps with an existing slot' });
      }
    }
    
    // Update the time slot using the utility function
    const updatedData = {
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      isAvailable: isAvailable !== undefined ? isAvailable : currentTimeSlot.isAvailable,
    };
    
    const updatedTimeSlot = await updateTimeSlotDB(id, updatedData);
    
    // Get the provider data
    const provider = await getProviderById(updatedTimeSlot.providerId);
    
    // Create the response with the provider included
    const response = {
      ...updatedTimeSlot,
      provider
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error(`Error updating time slot ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update time slot' });
  }
}

// Delete time slot
async function deleteTimeSlot(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if the time slot exists
    const timeSlot = await getTimeSlotById(id);
    
    if (!timeSlot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    // Check for appointments that might be scheduled in this time slot
    // While we don't have a direct relation, we can check for overlapping appointments
    const appointments = await db.appointments
      .where('providerId')
      .equals(timeSlot.providerId)
      .and(appointment => {
        const apptStart = new Date(appointment.startTime);
        const apptEnd = new Date(appointment.endTime);
        const slotStart = new Date(timeSlot.startTime);
        const slotEnd = new Date(timeSlot.endTime);
        
        // Check if the appointment overlaps with this time slot
        const overlaps = (
          (apptStart <= slotEnd && apptEnd >= slotStart) &&
          (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED')
        );
        
        return overlaps;
      })
      .toArray();
    
    if (appointments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete time slot with scheduled or confirmed appointments' 
      });
    }
    
    // Delete the time slot using the utility function
    await deleteTimeSlotDB(id);
    
    return res.status(200).json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    console.error(`Error deleting time slot ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete time slot' });
  }
}
