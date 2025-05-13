import { db, PatientType, ProviderType, AppointmentTypeType, TimeSlotType, AppointmentType, VisitType, UserType } from './db';
import { v4 as uuidv4 } from 'uuid';

// Patient operations
export async function getAllPatients() {
  try {
    const patients = await db.patients.toArray();
    
    // Get the latest visit for each patient
    const patientIds = patients.map(p => p.id);
    const visits = await db.visits
      .where('patientId')
      .anyOf(patientIds)
      .toArray();
    
    // Group visits by patientId
    const visitsByPatient = visits.reduce((acc, visit) => {
      if (!acc[visit.patientId]) {
        acc[visit.patientId] = [];
      }
      acc[visit.patientId].push(visit);
      return acc;
    }, {} as Record<string, VisitType[]>);
    
    // Format the response
    return patients.map(patient => {
      const patientVisits = visitsByPatient[patient.id] || [];
      // Sort visits by date (newest first)
      patientVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return {
        id: patient.patientId,
        name: patient.name,
        dob: patient.dob,
        gender: patient.gender,
        phone: patient.phone || '',
        lastVisit: patientVisits[0]?.date.toISOString().split('T')[0] || '',
        email: patient.email || '',
        address: patient.address || '',
      };
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
}

export async function getPatientById(patientId: string) {
  return db.patients.where('patientId').equals(patientId).first();
}

export async function createNewPatient(data: Omit<PatientType, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Generate a patient ID (e.g., PAT-XXXX)
    const patients = await db.patients
      .where('patientId')
      .startsWith('PAT-')
      .toArray();
    
    patients.sort((a, b) => {
      const numA = parseInt(a.patientId.split('-')[1] || '0');
      const numB = parseInt(b.patientId.split('-')[1] || '0');
      return numB - numA; // Sort in descending order
    });
    
    let newPatientId: string;
    if (patients.length > 0) {
      const lastNumber = parseInt(patients[0].patientId.split('-')[1]);
      newPatientId = `PAT-${lastNumber + 1}`;
    } else {
      newPatientId = 'PAT-1000'; // Initial patient ID
    }
    
    const now = new Date();
    
    // Create the patient
    const patient: PatientType = {
      id: uuidv4(),
      patientId: newPatientId,
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    await db.patients.add(patient);
    
    // Create an initial visit record
    const visit: VisitType = {
      id: uuidv4(),
      patientId: patient.id,
      date: now,
      notes: 'Initial registration',
      createdAt: now,
      updatedAt: now
    };
    
    await db.visits.add(visit);
    
    return {
      id: patient.patientId,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
    };
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
}

export async function updatePatient(patientId: string, data: Partial<PatientType>) {
  const patient = await db.patients.where('patientId').equals(patientId).first();
  
  if (!patient) {
    throw new Error('Patient not found');
  }
  
  const updatedPatient = {
    ...patient,
    ...data,
    updatedAt: new Date()
  };
  
  await db.patients.update(patient.id, updatedPatient);
  return updatedPatient;
}

export async function deletePatient(patientId: string) {
  const patient = await db.patients.where('patientId').equals(patientId).first();
  
  if (!patient) {
    throw new Error('Patient not found');
  }
  
  // Delete the patient's visits first (to maintain referential integrity)
  await db.visits.where('patientId').equals(patient.id).delete();
  
  // Delete the patient's appointments
  await db.appointments.where('patientId').equals(patient.id).delete();
  
  // Delete the patient
  await db.patients.delete(patient.id);
  
  return { message: 'Patient deleted successfully' };
}

// Provider operations
export async function getAllProviders() {
  try {
    return await db.providers.toArray();
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
}

export async function getProviderById(id: string) {
  return db.providers.get(id);
}

export async function getProviderByEmail(email: string) {
  return db.providers.where('email').equals(email).first();
}

export async function createProvider(data: Omit<ProviderType, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date();
    
    const provider: ProviderType = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    await db.providers.add(provider);
    return provider;
  } catch (error) {
    console.error('Error creating provider:', error);
    throw error;
  }
}

export async function updateProvider(id: string, data: Partial<ProviderType>) {
  try {
    const provider = await db.providers.get(id);
    
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    const updatedProvider = {
      ...provider,
      ...data,
      updatedAt: new Date()
    };
    
    await db.providers.update(id, updatedProvider);
    return updatedProvider;
  } catch (error) {
    console.error('Error updating provider:', error);
    throw error;
  }
}

export async function deleteProvider(id: string) {
  try {
    const provider = await db.providers.get(id);
    
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    // Delete the provider's time slots and appointments
    await db.timeSlots.where('providerId').equals(id).delete();
    await db.appointments.where('providerId').equals(id).delete();
    
    // Delete the provider
    await db.providers.delete(id);
    
    return { message: 'Provider deleted successfully' };
  } catch (error) {
    console.error('Error deleting provider:', error);
    throw error;
  }
}

// Appointment type operations
export async function getAllAppointmentTypes() {
  try {
    return await db.appointmentTypes.toArray();
  } catch (error) {
    console.error('Error fetching appointment types:', error);
    throw error;
  }
}

export async function getAppointmentTypeById(id: string) {
  return db.appointmentTypes.get(id);
}

export async function createAppointmentType(data: Omit<AppointmentTypeType, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date();
    
    const appointmentType: AppointmentTypeType = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    await db.appointmentTypes.add(appointmentType);
    return appointmentType;
  } catch (error) {
    console.error('Error creating appointment type:', error);
    throw error;
  }
}

export async function updateAppointmentType(id: string, data: Partial<AppointmentTypeType>) {
  try {
    const appointmentType = await db.appointmentTypes.get(id);
    
    if (!appointmentType) {
      throw new Error('Appointment type not found');
    }
    
    const updatedAppointmentType = {
      ...appointmentType,
      ...data,
      updatedAt: new Date()
    };
    
    await db.appointmentTypes.update(id, updatedAppointmentType);
    return updatedAppointmentType;
  } catch (error) {
    console.error('Error updating appointment type:', error);
    throw error;
  }
}

export async function deleteAppointmentType(id: string) {
  try {
    const appointmentType = await db.appointmentTypes.get(id);
    
    if (!appointmentType) {
      throw new Error('Appointment type not found');
    }
    
    // Update appointments that use this type (set appointmentTypeId to null)
    const appointments = await db.appointments.where('appointmentTypeId').equals(id).toArray();
    for (const appointment of appointments) {
      await db.appointments.update(appointment.id, {
        ...appointment,
        appointmentTypeId: null,
        updatedAt: new Date()
      });
    }
    
    // Delete the appointment type
    await db.appointmentTypes.delete(id);
    
    return { message: 'Appointment type deleted successfully' };
  } catch (error) {
    console.error('Error deleting appointment type:', error);
    throw error;
  }
}

export async function deleteAppointment(id: string) {
  try {
    const appointment = await db.appointments.where('id').equals(id).first();
    if (!appointment) {
      throw new Error(`Appointment with ID ${id} not found`);
    }
    
    // Check if there's a time slot associated with this appointment and update it
    const timeSlots = await db.timeSlots
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
    
    // Update any matching time slots
    for (const slot of timeSlots) {
      await db.timeSlots.update(slot.id, { isAvailable: true });
    }
    
    await db.appointments.delete(id);
    return true;
  } catch (error) {
    console.error(`Error deleting appointment: ${error}`);
    throw error;
  }
}

// User operations
export async function getAllUsers() {
  try {
    const users = await db.users.toArray();
    // Don't return passwords
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const user = await db.users.where('id').equals(id).first();
    if (!user) return null;
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await db.users.where('email').equals(email).first();
  } catch (error) {
    console.error(`Error fetching user by email ${email}:`, error);
    throw error;
  }
}

export async function createUser(data: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      throw new Error(`User with email ${data.email} already exists`);
    }
    
    const now = new Date();
    const userId = uuidv4();
    const user = {
      id: userId,
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    await db.users.add(user);
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error(`Error creating user:`, error);
    throw error;
  }
}

export async function updateUser(id: string, data: Partial<UserType>) {
  try {
    const user = await db.users.where('id').equals(id).first();
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // If updating email, check it's not already used
    if (data.email && data.email !== user.email) {
      const existingUser = await getUserByEmail(data.email);
      if (existingUser) {
        throw new Error(`User with email ${data.email} already exists`);
      }
    }
    
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    await db.users.update(id, updateData);
    
    // Get the updated user
    const updatedUser = await db.users.where('id').equals(id).first();
    if (!updatedUser) {
      throw new Error(`Failed to retrieve updated user with ID ${id}`);
    }
    
    // Don't return password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    const user = await db.users.where('id').equals(id).first();
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    await db.users.delete(id);
    return true;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
}

// Time slot operations
export async function getAllTimeSlots() {
  try {
    return await db.timeSlots.toArray();
  } catch (error) {
    console.error('Error fetching time slots:', error);
    throw error;
  }
}

export async function getTimeSlotById(id: string) {
  return db.timeSlots.get(id);
}

export async function createTimeSlot(data: Omit<TimeSlotType, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date();
    
    const timeSlot: TimeSlotType = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    await db.timeSlots.add(timeSlot);
    return timeSlot;
  } catch (error) {
    console.error('Error creating time slot:', error);
    throw error;
  }
}

export async function updateTimeSlot(id: string, data: Partial<TimeSlotType>) {
  try {
    const timeSlot = await db.timeSlots.get(id);
    
    if (!timeSlot) {
      throw new Error('Time slot not found');
    }
    
    const updatedTimeSlot = {
      ...timeSlot,
      ...data,
      updatedAt: new Date()
    };
    
    await db.timeSlots.update(id, updatedTimeSlot);
    return updatedTimeSlot;
  } catch (error) {
    console.error('Error updating time slot:', error);
    throw error;
  }
}

export async function deleteTimeSlot(id: string) {
  try {
    const timeSlot = await db.timeSlots.get(id);
    
    if (!timeSlot) {
      throw new Error('Time slot not found');
    }
    
    // Delete the time slot
    await db.timeSlots.delete(id);
    
    return { message: 'Time slot deleted successfully' };
  } catch (error) {
    console.error('Error deleting time slot:', error);
    throw error;
  }
}

// Appointment operations
export async function getAllAppointments() {
  try {
    return await db.appointments.toArray();
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

export async function getAppointmentById(id: string) {
  return db.appointments.get(id);
}

export async function createAppointment(data: Omit<AppointmentType, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date();
    
    const appointment: AppointmentType = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    await db.appointments.add(appointment);
    return appointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

export async function updateAppointment(id: string, data: Partial<AppointmentType>) {
  try {
    const appointment = await db.appointments.get(id);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    const updatedAppointment = {
      ...appointment,
      ...data,
      updatedAt: new Date()
    };
    
    await db.appointments.update(id, updatedAppointment);
    return updatedAppointment;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
}

// End of file
