import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.visit.deleteMany({});
  await prisma.patient.deleteMany({});
  
  console.log('Database cleared. Starting seed...');

  // Seed patients
  const patients = [
    {
      patientId: 'PAT-7890',
      name: 'John Smith',
      dob: '1975-05-15',
      gender: 'Male',
      phone: '(555) 123-4567',
      email: 'john.smith@example.com',
      address: '123 Main St, Anytown, CA 91234',
    },
    {
      patientId: 'PAT-7891',
      name: 'Emma Johnson',
      dob: '1982-09-23',
      gender: 'Female',
      phone: '(555) 234-5678',
      email: 'emma.johnson@example.com',
      address: '456 Oak Ave, Somewhere, CA 91235',
    },
    {
      patientId: 'PAT-7892',
      name: 'Robert Davis',
      dob: '1968-03-12',
      gender: 'Male',
      phone: '(555) 345-6789',
      email: 'robert.davis@example.com',
      address: '789 Pine Rd, Nowhere, CA 91236',
    },
    {
      patientId: 'PAT-7893',
      name: 'Sarah Wilson',
      dob: '1990-07-30',
      gender: 'Female',
      phone: '(555) 456-7890',
      email: 'sarah.wilson@example.com',
      address: '321 Elm St, Everywhere, CA 91237',
    },
    {
      patientId: 'PAT-7894',
      name: 'Michael Brown',
      dob: '1956-11-08',
      gender: 'Male',
      phone: '(555) 567-8901',
      email: 'michael.brown@example.com',
      address: '654 Maple Dr, Anywhere, CA 91238',
    },
  ];

  for (const patient of patients) {
    const createdPatient = await prisma.patient.create({
      data: {
        patientId: patient.patientId,
        name: patient.name,
        dob: patient.dob,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
      },
    });

    // Create visits for each patient
    await prisma.visit.create({
      data: {
        date: new Date(2025, 4, Math.floor(Math.random() * 10) + 1), // May 1-10, 2025
        notes: 'Routine checkup',
        patientId: createdPatient.id,
      },
    });
    
    if (Math.random() > 0.5) {
      // Add a second visit for some patients
      await prisma.visit.create({
        data: {
          date: new Date(2025, 3, Math.floor(Math.random() * 15) + 1), // April 1-15, 2025
          notes: 'Follow-up visit',
          patientId: createdPatient.id,
        },
      });
    }

    console.log(`Created patient: ${patient.name} with ID: ${patient.patientId}`);
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
