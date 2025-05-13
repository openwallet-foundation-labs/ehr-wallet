import { NextApiRequest, NextApiResponse } from 'next';
import { getAppointmentById, updateAppointment as updateAppointmentDB, deleteAppointment as deleteAppointmentDB, getPatientById, getProviderById, getAppointmentTypeById, getTimeSlotById, updateTimeSlot } from '@/lib/db-utils';
import { initDatabase, db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the database is initialized
  await initDatabase();

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid appointment ID is required' });
  }
  
  switch (req.method) {
    case 'GET':
      return await getAppointment(req, res, id);
    case 'PUT':
      return await updateAppointment(req, res, id);
    case 'DELETE':
      return await deleteAppointment(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get appointment by ID
async function getAppointment(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const appointment = await getAppointmentById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Get related entities
    const patient = await getPatientById(appointment.patientId);
    const provider = await getProviderById(appointment.providerId);
    
    // Get appointment type if exists
    let appointmentType = null;
    if (appointment.appointmentTypeId) {
      appointmentType = await getAppointmentTypeById(appointment.appointmentTypeId);
    }
    
    // Create the response with related entities included
    const response = {
      ...appointment,
      patient,
      provider,
      appointmentType
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error(`Error fetching appointment ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch appointment' });
  }
}

// Update appointment
async function updateAppointment(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { 
      title, 
      patientId, 
      providerId, 
      appointmentTypeId, 
      startTime, 
      endTime, 
      notes, 
      status 
    } = req.body;
    
    // Validate the appointment exists
    const currentAppointment = await getAppointmentById(id);
    
    if (!currentAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Prepare the update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    
    // Check if patient is changed
    if (patientId !== undefined && patientId !== currentAppointment.patientId) {
      // Verify patient exists
      const patient = await getPatientById(patientId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      updateData.patientId = patientId;
    }
    
    // Check if provider is changed
    if (providerId !== undefined && providerId !== currentAppointment.providerId) {
      // Verify provider exists
      const provider = await getProviderById(providerId);
      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      updateData.providerId = providerId;
    }
    
    // Check if appointment type is changed
    if (appointmentTypeId !== undefined && appointmentTypeId !== currentAppointment.appointmentTypeId) {
      if (appointmentTypeId) {
        // Verify appointment type exists if it's not null
        const appointmentType = await getAppointmentTypeById(appointmentTypeId);
        if (!appointmentType) {
          return res.status(404).json({ error: 'Appointment type not found' });
        }
      }
      updateData.appointmentTypeId = appointmentTypeId;
    }
    
    // Process time changes
    let parsedStartTime = new Date(currentAppointment.startTime);
    let parsedEndTime = new Date(currentAppointment.endTime);
    
    if (startTime !== undefined) {
      parsedStartTime = new Date(startTime);
      if (isNaN(parsedStartTime.getTime())) {
        return res.status(400).json({ error: 'Invalid start time format' });
      }
      updateData.startTime = parsedStartTime;
    }
    
    if (endTime !== undefined) {
      parsedEndTime = new Date(endTime);
      if (isNaN(parsedEndTime.getTime())) {
        return res.status(400).json({ error: 'Invalid end time format' });
      }
      updateData.endTime = parsedEndTime;
    }
    
    // If the time is being changed or provider is being changed, check for conflicts
    if (startTime !== undefined || endTime !== undefined || providerId !== undefined) {
      // Make sure end time is after start time
      if (parsedEndTime <= parsedStartTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
      
      // Get the provider ID that will be used
      const checkProviderId = providerId !== undefined ? providerId : currentAppointment.providerId;
      
      // Get all active appointments for the provider
      const allProviderAppointments = await db.appointments
        .where('providerId')
        .equals(checkProviderId)
        .and(a => a.id !== id && (a.status === 'SCHEDULED' || a.status === 'CONFIRMED'))
        .toArray();
      
      // Check for overlapping appointments
      const overlappingProviderAppointments = allProviderAppointments.filter(a => {
        const apptStart = new Date(a.startTime);
        const apptEnd = new Date(a.endTime);
        
        return (
          // New start time is within an existing appointment
          (apptStart <= parsedStartTime && apptEnd > parsedStartTime) ||
          // New end time is within an existing appointment
          (apptStart < parsedEndTime && apptEnd >= parsedEndTime) ||
          // New appointment completely contains an existing appointment
          (parsedStartTime <= apptStart && parsedEndTime >= apptEnd)
        );
      });
      
      if (overlappingProviderAppointments.length > 0) {
        return res.status(400).json({ 
          error: 'This time slot overlaps with another appointment for this provider' 
        });
      }
      
      // Check for overlapping appointments for the patient if time changed or patient changed
      if (startTime !== undefined || endTime !== undefined || patientId !== undefined) {
        const checkPatientId = patientId !== undefined ? patientId : currentAppointment.patientId;
        
        // Get all active appointments for the patient
        const allPatientAppointments = await db.appointments
          .where('patientId')
          .equals(checkPatientId)
          .and(a => a.id !== id && (a.status === 'SCHEDULED' || a.status === 'CONFIRMED'))
          .toArray();
        
        // Check for overlapping appointments
        const overlappingPatientAppointments = allPatientAppointments.filter(a => {
          const apptStart = new Date(a.startTime);
          const apptEnd = new Date(a.endTime);
          
          return (
            // New start time is within an existing appointment
            (apptStart <= parsedStartTime && apptEnd > parsedStartTime) ||
            // New end time is within an existing appointment
            (apptStart < parsedEndTime && apptEnd >= parsedEndTime) ||
            // New appointment completely contains an existing appointment
            (parsedStartTime <= apptStart && parsedEndTime >= apptEnd)
          );
        });
        
        if (overlappingPatientAppointments.length > 0) {
          return res.status(400).json({ 
            error: 'This time slot overlaps with another appointment for this patient' 
          });
        }
      }
    }
    
    // Update the appointment using the utility function
    const updatedAppointment = await updateAppointmentDB(id, updateData);
    
    // If time or provider changed, update relevant time slots
    if ((startTime !== undefined || endTime !== undefined || providerId !== undefined) && 
        (new Date(currentAppointment.startTime).getTime() !== parsedStartTime.getTime() || 
         new Date(currentAppointment.endTime).getTime() !== parsedEndTime.getTime() || 
         (providerId !== undefined && providerId !== currentAppointment.providerId))) {
      
      // Try to find the old time slot that matches the appointment
      const oldTimeSlots = await db.timeSlots
        .where('providerId')
        .equals(currentAppointment.providerId)
        .and(slot => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          const apptStart = new Date(currentAppointment.startTime);
          const apptEnd = new Date(currentAppointment.endTime);
          
          return (
            slotStart.getTime() === apptStart.getTime() && 
            slotEnd.getTime() === apptEnd.getTime() && 
            !slot.isAvailable
          );
        })
        .toArray();
      
      // Mark old time slot as available if found
      for (const slot of oldTimeSlots) {
        await updateTimeSlot(slot.id, { isAvailable: true });
      }
      
      // Try to find the new time slot that matches the appointment
      const newTimeSlots = await db.timeSlots
        .where('providerId')
        .equals(updateData.providerId || currentAppointment.providerId)
        .and(slot => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          const apptStart = updateData.startTime || new Date(currentAppointment.startTime);
          const apptEnd = updateData.endTime || new Date(currentAppointment.endTime);
          
          return (
            slotStart.getTime() === apptStart.getTime() && 
            slotEnd.getTime() === apptEnd.getTime() && 
            slot.isAvailable
          );
        })
        .toArray();
      
      // Mark new time slot as unavailable if found
      for (const slot of newTimeSlots) {
        await updateTimeSlot(slot.id, { isAvailable: false });
      }
    }
    
    // Get related entities for the response
    const patient = await getPatientById(updatedAppointment.patientId);
    const provider = await getProviderById(updatedAppointment.providerId);
    
    // Get appointment type if exists
    let appointmentType = null;
    if (updatedAppointment.appointmentTypeId) {
      appointmentType = await getAppointmentTypeById(updatedAppointment.appointmentTypeId);
    }
    
    // Create the response with related entities included
    const response = {
      ...updatedAppointment,
      patient,
      provider,
      appointmentType
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error(`Error updating appointment ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update appointment' });
  }
}

// Delete appointment
async function deleteAppointment(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if the appointment exists
    const appointment = await getAppointmentById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Delete the appointment using the utility function
    await deleteAppointmentDB(id);
    
    // If there's a time slot that corresponds to this appointment, mark it as available
    const matchingTimeSlots = await db.timeSlots
      .where('providerId')
      .equals(appointment.providerId)
      .and(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const apptStart = new Date(appointment.startTime);
        const apptEnd = new Date(appointment.endTime);
        
        return (
          slotStart.getTime() === apptStart.getTime() && 
          slotEnd.getTime() === apptEnd.getTime() && 
          !slot.isAvailable
        );
      })
      .toArray();
    
    // Update all matching time slots
    for (const slot of matchingTimeSlots) {
      await updateTimeSlot(slot.id, { isAvailable: true });
    }
    
    return res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error(`Error deleting appointment ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete appointment' });
  }
}
