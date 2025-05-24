import { NextApiRequest, NextApiResponse } from 'next';
import { getAllPatients, createNewPatient } from '@/lib/db-utils';
import { initDatabase } from '@/lib/db';

// Add a timeout promise helper
const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the database is initialized
  await initDatabase();
  
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      // Get all patients
      return await getPatients(req, res);
    
    case 'POST':
      // Create a new patient
      return await createPatient(req, res);
    
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get all patients
async function getPatients(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Add a small delay to ensure database is ready (helps with race conditions)
    await timeout(100);
    
    // Initialize database with retry logic
    let retries = 3;
    let db;
    
    while (retries > 0) {
      try {
        db = await initDatabase();
        break;
      } catch (err) {
        console.warn(`Database initialization attempt failed, ${retries - 1} retries left`);
        retries--;
        if (retries === 0) throw err;
        await timeout(300);
      }
    }
    
    const formattedPatients = await getAllPatients();
    return res.status(200).json(formattedPatients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Failed to fetch patients', 
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}

// Create a new patient
async function createPatient(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, dob, gender, phone, email, address } = req.body;

    // Validate required fields
    if (!name || !dob || !gender) {
      return res.status(400).json({ error: 'Name, date of birth, and gender are required' });
    }

    // Create the patient using the utility function
    const patient = await createNewPatient({
      patientId: '', // This will be generated in the utility function
      name,
      dob,
      gender,
      phone: phone || null,
      email: email || null,
      address: address || null,
    });

    return res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    return res.status(500).json({ error: 'Failed to create patient' });
  }
}
