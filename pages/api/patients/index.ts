import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        visits: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    // Format the response to match the expected data structure
    const formattedPatients = patients.map(patient => ({
      id: patient.patientId,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.phone || '',
      lastVisit: patient.visits[0]?.date.toISOString().split('T')[0] || '',
      email: patient.email || '',
      address: patient.address || '',
    }));

    return res.status(200).json(formattedPatients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ error: 'Failed to fetch patients' });
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

    // Generate a patient ID (e.g., PAT-XXXX)
    const latestPatient = await prisma.patient.findFirst({
      orderBy: { patientId: 'desc' },
      where: { patientId: { startsWith: 'PAT-' } },
    });

    let newPatientId: string;
    if (latestPatient) {
      const lastNumber = parseInt(latestPatient.patientId.split('-')[1]);
      newPatientId = `PAT-${lastNumber + 1}`;
    } else {
      newPatientId = 'PAT-1000'; // Initial patient ID
    }

    // Create the patient
    const patient = await prisma.patient.create({
      data: {
        patientId: newPatientId,
        name,
        dob,
        gender,
        phone: phone || null,
        email: email || null,
        address: address || null,
        visits: {
          create: {
            // Create an initial visit record for the registration date
            notes: 'Initial registration',
          },
        },
      },
    });

    return res.status(201).json({
      id: patient.patientId,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    return res.status(500).json({ error: 'Failed to create patient' });
  }
}
