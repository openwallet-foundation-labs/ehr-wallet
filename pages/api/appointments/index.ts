import { NextApiRequest, NextApiResponse } from 'next';
import { getAllAppointments, createAppointment, getPatientById, getProviderById, getAppointmentTypeById } from '@/lib/db-utils';
import { initDatabase, db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the database is initialized
  await initDatabase();
  
  switch (req.method) {
    case 'GET':
      return await getAppointments(req, res);
    case 'POST':
      return await createNewAppointment(req, res);
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
    
    // Get all appointments and filter in memory
    let appointments = await getAllAppointments();
    
    // Apply filters
    if (patientId && typeof patientId === 'string') {
      appointments = appointments.filter(a => a.patientId === patientId);
    }
    
    if (providerId && typeof providerId === 'string') {
      appointments = appointments.filter(a => a.providerId === providerId);
    }
    
    if (appointmentTypeId && typeof appointmentTypeId === 'string') {
      appointments = appointments.filter(a => a.appointmentTypeId === appointmentTypeId);
    }
    
    // Filter by date range
    if (startDate && typeof startDate === 'string') {
      const startDateObj = new Date(startDate);
      appointments = appointments.filter(a => new Date(a.startTime) >= startDateObj);
    }
    
    if (endDate && typeof endDate === 'string') {
      const endDateObj = new Date(endDate);
      appointments = appointments.filter(a => new Date(a.startTime) <= endDateObj);
    }
    
    // Filter by status
    if (status && typeof status === 'string') {
      if (status === 'ACTIVE') {
        // Special case for active appointments (scheduled or confirmed)
        appointments = appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');
      } else {
        appointments = appointments.filter(a => a.status === status);
      }
    }
    
    // Sort by start time ascending
    appointments.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    
    // Include related data - get patients, providers, and appointment types
    const patientIds = [...new Set(appointments.map(a => a.patientId))];
    const providerIds = [...new Set(appointments.map(a => a.providerId))];
    const appointmentTypeIds = [...new Set(appointments.map(a => a.appointmentTypeId).filter(Boolean))];
    
    const patients = await db.patients.where('id').anyOf(patientIds).toArray();
    const providers = await db.providers.where('id').anyOf(providerIds).toArray();
    const appointmentTypes = appointmentTypeIds.length > 0 
      ? await db.appointmentTypes.where('id').anyOf(appointmentTypeIds).toArray() 
      : [];
    
    // Create a lookup map for each related entity
    const patientsMap = patients.reduce((acc, patient) => {
      acc[patient.id] = patient;
      return acc;
    }, {} as Record<string, any>);
    
    const providersMap = providers.reduce((acc, provider) => {
      acc[provider.id] = provider;
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
        provider: providersMap[appointment.providerId],
        appointmentType: appointment.appointmentTypeId ? appointmentTypesMap[appointment.appointmentTypeId] : null
      };
    });
    
    return res.status(200).json(enrichedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}

// Create a new appointment
async function createNewAppointment(req: NextApiRequest, res: NextApiResponse) {
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
    const patient = await getPatientById(patientId);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const provider = await getProviderById(providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Validate appointment type if provided
    if (appointmentTypeId) {
      const appointmentType = await getAppointmentTypeById(appointmentTypeId);
      
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
    
    // Get all active appointments
    const appointments = await db.appointments.toArray();
    const activeAppointments = appointments.filter(a => 
      (a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
    );
    
    // Check for overlapping appointments for the provider
    const overlappingProviderAppointments = activeAppointments.filter(a => {
      if (a.providerId !== providerId) return false;
      
      // Check for any overlap
      const existingStart = new Date(a.startTime);
      const existingEnd = new Date(a.endTime);
      
      return (
        // New start time is within an existing appointment
        (existingStart <= parsedStartTime && existingEnd > parsedStartTime) ||
        // New end time is within an existing appointment
        (existingStart < parsedEndTime && existingEnd >= parsedEndTime) ||
        // New appointment completely contains an existing appointment
        (parsedStartTime <= existingStart && parsedEndTime >= existingEnd)
      );
    });
    
    if (overlappingProviderAppointments.length > 0) {
      return res.status(400).json({ 
        error: 'This time slot overlaps with another appointment for this provider' 
      });
    }
    
    // Check for overlapping appointments for the patient
    const overlappingPatientAppointments = activeAppointments.filter(a => {
      if (a.patientId !== patientId) return false;
      
      // Check for any overlap
      const existingStart = new Date(a.startTime);
      const existingEnd = new Date(a.endTime);
      
      return (
        // New start time is within an existing appointment
        (existingStart <= parsedStartTime && existingEnd > parsedStartTime) ||
        // New end time is within an existing appointment
        (existingStart < parsedEndTime && existingEnd >= parsedEndTime) ||
        // New appointment completely contains an existing appointment
        (parsedStartTime <= existingStart && parsedEndTime >= existingEnd)
      );
    });
    
    if (overlappingPatientAppointments.length > 0) {
      return res.status(400).json({ 
        error: 'This time slot overlaps with another appointment for this patient' 
      });
    }
    
    // Create the appointment using the utility function
    const appointmentData = {
      title,
      patientId,
      providerId,
      appointmentTypeId: appointmentTypeId || null,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      notes: notes || null,
      status: status || 'SCHEDULED',
    };
    
    const appointment = await createAppointment(appointmentData);
    
    // Get related entities to include in response
    const enrichedAppointment = {
      ...appointment,
      patient,
      provider,
      appointmentType: appointmentTypeId ? await getAppointmentTypeById(appointmentTypeId) : null
    };
    
    return res.status(201).json(enrichedAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ error: 'Failed to create appointment' });
  }
}
