import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        provider: true,
        appointmentType: true,
      },
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    return res.status(200).json(appointment);
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
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
    });
    
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
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      updateData.patientId = patientId;
    }
    
    // Check if provider is changed
    if (providerId !== undefined && providerId !== currentAppointment.providerId) {
      // Verify provider exists
      const provider = await prisma.provider.findUnique({ where: { id: providerId } });
      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      updateData.providerId = providerId;
    }
    
    // Check if appointment type is changed
    if (appointmentTypeId !== undefined && appointmentTypeId !== currentAppointment.appointmentTypeId) {
      if (appointmentTypeId) {
        // Verify appointment type exists if it's not null
        const appointmentType = await prisma.appointmentType.findUnique({ where: { id: appointmentTypeId } });
        if (!appointmentType) {
          return res.status(404).json({ error: 'Appointment type not found' });
        }
      }
      updateData.appointmentTypeId = appointmentTypeId;
    }
    
    // Process time changes
    let parsedStartTime = currentAppointment.startTime;
    let parsedEndTime = currentAppointment.endTime;
    
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
      
      // Check for overlapping appointments for the provider
      const overlappingProviderAppointments = await prisma.appointment.findMany({
        where: {
          id: { not: id }, // Exclude the current appointment
          providerId: checkProviderId,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          OR: [
            {
              // New start time is within an existing appointment
              AND: [
                { startTime: { lte: parsedStartTime } },
                { endTime: { gt: parsedStartTime } },
              ],
            },
            {
              // New end time is within an existing appointment
              AND: [
                { startTime: { lt: parsedEndTime } },
                { endTime: { gte: parsedEndTime } },
              ],
            },
            {
              // New appointment completely contains an existing appointment
              AND: [
                { startTime: { gte: parsedStartTime } },
                { endTime: { lte: parsedEndTime } },
              ],
            },
          ],
        },
      });
      
      if (overlappingProviderAppointments.length > 0) {
        return res.status(400).json({ 
          error: 'This time slot overlaps with another appointment for this provider' 
        });
      }
      
      // Check for overlapping appointments for the patient if time changed or patient changed
      if (startTime !== undefined || endTime !== undefined || patientId !== undefined) {
        const checkPatientId = patientId !== undefined ? patientId : currentAppointment.patientId;
        
        const overlappingPatientAppointments = await prisma.appointment.findMany({
          where: {
            id: { not: id }, // Exclude the current appointment
            patientId: checkPatientId,
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
            OR: [
              {
                // New start time is within an existing appointment
                AND: [
                  { startTime: { lte: parsedStartTime } },
                  { endTime: { gt: parsedStartTime } },
                ],
              },
              {
                // New end time is within an existing appointment
                AND: [
                  { startTime: { lt: parsedEndTime } },
                  { endTime: { gte: parsedEndTime } },
                ],
              },
              {
                // New appointment completely contains an existing appointment
                AND: [
                  { startTime: { gte: parsedStartTime } },
                  { endTime: { lte: parsedEndTime } },
                ],
              },
            ],
          },
        });
        
        if (overlappingPatientAppointments.length > 0) {
          return res.status(400).json({ 
            error: 'This time slot overlaps with another appointment for this patient' 
          });
        }
      }
    }
    
    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        provider: true,
        appointmentType: true,
      },
    });
    
    // If time or provider changed, update relevant time slots
    if ((startTime !== undefined || endTime !== undefined || providerId !== undefined) && 
        (currentAppointment.startTime.getTime() !== parsedStartTime.getTime() || 
         currentAppointment.endTime.getTime() !== parsedEndTime.getTime() || 
         (providerId !== undefined && providerId !== currentAppointment.providerId))) {
      
      // Mark old time slot as available if it exists
      await prisma.timeSlot.updateMany({
        where: {
          providerId: currentAppointment.providerId,
          startTime: currentAppointment.startTime,
          endTime: currentAppointment.endTime,
          isAvailable: false,
        },
        data: {
          isAvailable: true,
        },
      });
      
      // Mark new time slot as unavailable if it exists
      await prisma.timeSlot.updateMany({
        where: {
          providerId: updateData.providerId || currentAppointment.providerId,
          startTime: updateData.startTime || currentAppointment.startTime,
          endTime: updateData.endTime || currentAppointment.endTime,
          isAvailable: true,
        },
        data: {
          isAvailable: false,
        },
      });
    }
    
    return res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error(`Error updating appointment ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update appointment' });
  }
}

// Delete appointment
async function deleteAppointment(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if the appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Delete the appointment
    await prisma.appointment.delete({
      where: { id },
    });
    
    // If there's a time slot that corresponds to this appointment, mark it as available
    await prisma.timeSlot.updateMany({
      where: {
        providerId: appointment.providerId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        isAvailable: false,
      },
      data: {
        isAvailable: true,
      },
    });
    
    return res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error(`Error deleting appointment ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete appointment' });
  }
}
