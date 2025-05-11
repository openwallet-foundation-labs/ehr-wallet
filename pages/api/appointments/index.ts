import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await getAppointments(req, res);
    case 'POST':
      return await createAppointment(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get appointments with filtering options
async function getAppointments(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      patientId, 
      providerId, 
      appointmentTypeId, 
      startDate, 
      endDate, 
      status 
    } = req.query;
    
    // Build the query filter
    const filter: any = {};
    
    // Filter by associations
    if (patientId && typeof patientId === 'string') {
      filter.patientId = patientId;
    }
    
    if (providerId && typeof providerId === 'string') {
      filter.providerId = providerId;
    }
    
    if (appointmentTypeId && typeof appointmentTypeId === 'string') {
      filter.appointmentTypeId = appointmentTypeId;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filter.startTime = {};
      
      if (startDate && typeof startDate === 'string') {
        filter.startTime.gte = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        filter.startTime.lte = new Date(endDate);
      }
    }
    
    // Filter by status
    if (status && typeof status === 'string') {
      if (status === 'ACTIVE') {
        // Special case for active appointments (scheduled or confirmed)
        filter.status = { in: ['SCHEDULED', 'CONFIRMED'] };
      } else {
        filter.status = status;
      }
    }
    
    const appointments = await prisma.appointment.findMany({
      where: filter,
      include: {
        patient: true,
        provider: true,
        appointmentType: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}

// Create a new appointment
async function createAppointment(req: NextApiRequest, res: NextApiResponse) {
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
    
    // Validate required fields
    if (!title || !patientId || !providerId || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Title, patient ID, provider ID, start time, and end time are required' 
      });
    }
    
    // Validate patient and provider exist
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Validate appointment type if provided
    if (appointmentTypeId) {
      const appointmentType = await prisma.appointmentType.findUnique({
        where: { id: appointmentTypeId },
      });
      
      if (!appointmentType) {
        return res.status(404).json({ error: 'Appointment type not found' });
      }
    }
    
    // Validate times
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    
    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Check for overlapping appointments for the provider
    const overlappingProviderAppointments = await prisma.appointment.findMany({
      where: {
        providerId,
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
    
    // Check for overlapping appointments for the patient
    const overlappingPatientAppointments = await prisma.appointment.findMany({
      where: {
        patientId,
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
    
    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        title,
        patientId,
        providerId,
        appointmentTypeId: appointmentTypeId || null,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        notes: notes || null,
        status: status || 'SCHEDULED',
      },
      include: {
        patient: true,
        provider: true,
        appointmentType: true,
      },
    });
    
    // If there's a time slot that corresponds to this appointment, mark it as unavailable
    // This is a simplification - in a real system, you might want to handle this differently
    // or even have a direct relation between appointments and time slots
    await prisma.timeSlot.updateMany({
      where: {
        providerId,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        isAvailable: true,
      },
      data: {
        isAvailable: false,
      },
    });
    
    return res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ error: 'Failed to create appointment' });
  }
}
