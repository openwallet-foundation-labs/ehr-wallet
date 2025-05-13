import { v4 as uuidv4 } from 'uuid';
import { db, PatientType, PendingChangeType } from '@/lib/db';

// Function to register a patient locally
export async function registerPatient(patientData: Omit<PatientType, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>) {
  try {
    // Check if we're online
    const isOnline = navigator.onLine;
    
    // Generate a patient ID (e.g., PAT-XXXX)
    let newPatientId: string;
    
    // Get the latest patient ID from the local database
    const latestPatient = await db.patients
      .orderBy('patientId')
      .filter(patient => patient.patientId.startsWith('PAT-'))
      .last();
    
    if (latestPatient) {
      const lastNumber = parseInt(latestPatient.patientId.split('-')[1]);
      newPatientId = `PAT-${lastNumber + 1}`;
    } else {
      newPatientId = 'PAT-1000'; // Initial patient ID
    }
    
    // Create new patient object
    const newPatient: PatientType = {
      id: uuidv4(),
      patientId: newPatientId,
      name: patientData.name,
      dob: patientData.dob,
      gender: patientData.gender,
      phone: patientData.phone || null,
      email: patientData.email || null,
      address: patientData.address || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store in local database
    await db.patients.add(newPatient);
    
    // If online, try to sync with server immediately
    if (isOnline) {
      try {
        const response = await fetch('/api/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newPatient.name,
            dob: newPatient.dob,
            gender: newPatient.gender,
            phone: newPatient.phone,
            email: newPatient.email,
            address: newPatient.address
          })
        });
        
        if (response.ok) {
          console.log('Patient synced with server successfully');
          return newPatient;
        } else {
          throw new Error('Failed to sync with server');
        }
      } catch (error) {
        console.error('Error syncing with server:', error);
        // Store as pending change to sync later
        await addToPendingChanges(newPatient);
      }
    } else {
      // Store as pending change to sync later
      await addToPendingChanges(newPatient);
    }
    
    return newPatient;
  } catch (error) {
    console.error('Error registering patient:', error);
    throw error;
  }
}

// Helper function to add pending changes
async function addToPendingChanges(patient: PatientType) {
  const pendingChange: PendingChangeType = {
    id: uuidv4(),
    entityType: 'patients',
    action: 'create',
    data: patient,
    timestamp: new Date()
  };
  
  await db.pendingChanges.add(pendingChange);
}

// Function to get all patients (combining local and server data)
export async function getAllPatients() {
  try {
    // Get all patients from local database
    const localPatients = await db.patients.toArray();
    
    // If online, try to sync with server
    if (navigator.onLine) {
      try {
        const response = await fetch('/api/patients');
        if (response.ok) {
          const serverPatients = await response.json();
          
          // Merge local and server data (this is a simplified approach)
          // In a real app, you'd need more complex merging logic
          const mergedPatients = [...localPatients];
          
          // Handle syncing logic here...
          
          return mergedPatients;
        }
      } catch (error) {
        console.error('Error syncing with server:', error);
      }
    }
    
    return localPatients;
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
}

// Function to sync pending changes with the server
export async function syncPendingChanges() {
  if (!navigator.onLine) return;
  
  try {
    const pendingChanges = await db.pendingChanges
      .where('entityType')
      .equals('patients')
      .toArray();
    
    for (const change of pendingChanges) {
      if (change.action === 'create') {
        try {
          const patient = change.data as PatientType;
          const response = await fetch('/api/patients', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: patient.name,
              dob: patient.dob,
              gender: patient.gender,
              phone: patient.phone,
              email: patient.email,
              address: patient.address
            })
          });
          
          if (response.ok) {
            // Remove from pending changes
            await db.pendingChanges.delete(change.id);
          }
        } catch (error) {
          console.error('Error syncing pending change:', error);
        }
      }
      // Add handlers for 'update' and 'delete' actions as needed
    }
  } catch (error) {
    console.error('Error syncing pending changes:', error);
  }
}
