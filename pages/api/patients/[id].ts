import { NextApiRequest, NextApiResponse } from 'next';
import { getPatientById, updatePatient as updatePatientDB, deletePatient as deletePatientDB } from '@/lib/db-utils';
import { initDatabase, db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the database is initialized
  await initDatabase();
  
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      // Get a single patient by ID
      return await getPatient(id, res);
    
    case 'PUT':
      // Update a patient
      return await updatePatient(id, req, res);
    
    case 'DELETE':
      // Delete a patient
      return await deletePatient(id, res);
    
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get a single patient by ID
async function getPatient(id: string, res: NextApiResponse) {
  try {
    const patient = await getPatientById(id);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get visits for this patient
    const visits = await db.visits
      .where('patientId')
      .equals(patient.id)
      .toArray();
    
    // Sort visits by date (newest first)
    visits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Format the response to match the expected data structure
    const formattedPatient = {
      id: patient.patientId,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      visits: visits.map(visit => ({
        id: visit.id,
        date: new Date(visit.date).toISOString(),
        notes: visit.notes || '',
      })),
    };

    return res.status(200).json(formattedPatient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return res.status(500).json({ error: 'Failed to fetch patient' });
  }
}

// Update a patient
async function updatePatient(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, dob, gender, phone, email, address } = req.body;

    // Validate required fields
    if (!name || !dob || !gender) {
      return res.status(400).json({ error: 'Name, date of birth, and gender are required' });
    }

    // Check if the patient exists
    const existingPatient = await getPatientById(id);

    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update the patient using the utility function
    const patient = await updatePatientDB(id, {
      name,
      dob,
      gender,
      phone: phone || null,
      email: email || null,
      address: address || null,
    });

    return res.status(200).json({
      id: patient.patientId,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    return res.status(500).json({ error: 'Failed to update patient' });
  }
}

// Delete a patient
async function deletePatient(id: string, res: NextApiResponse) {
  try {
    // Check if the patient exists
    const existingPatient = await getPatientById(id);

    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete the patient using the utility function
    await deletePatientDB(id);

    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting patient:', error);
    return res.status(500).json({ error: 'Failed to delete patient' });
  }
}
