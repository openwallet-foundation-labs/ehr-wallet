// Import the prisma client from our custom implementation
import { prisma } from '../lib/prisma';

async function main() {
  // Clear existing data
  try {
    console.log('Clearing existing data...');
    // Delete in the correct order to respect referential integrity
    await prisma.appointment.deleteMany({});
    await prisma.timeSlot.deleteMany({});
    await prisma.visit.deleteMany({});
    await prisma.patient.deleteMany({});
    await prisma.appointmentType.deleteMany({});
    await prisma.provider.deleteMany({});
  } catch (error) {
    console.error('Error clearing data:', error);
    // Continue with the seed process even if clearing fails (tables might not exist yet)
  }
  
  console.log('Database cleared. Starting seed...');

  // Seed patients
  const patientData = [
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

  for (const patient of patientData) {
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

  // Seed providers
  console.log('Creating providers...');
  const providers = [
    {
      name: 'Dr. Alexandra Rivera',
      specialty: 'Radiologist',
      email: 'alexandra.rivera@radianthub.com',
      phone: '(555) 111-2222',
    },
    {
      name: 'Dr. Marcus Chen',
      specialty: 'Radiologist',
      email: 'marcus.chen@radianthub.com',
      phone: '(555) 222-3333',
    },
    {
      name: 'Dr. Sarah Johnson',
      specialty: 'Technician',
      email: 'sarah.johnson@radianthub.com',
      phone: '(555) 333-4444',
    },
  ];

  const createdProviders = [];
  for (const provider of providers) {
    const createdProvider = await prisma.provider.create({
      data: provider
    });
    createdProviders.push(createdProvider);
    console.log(`Created provider: ${provider.name}`);
  }

  // Seed appointment types
  console.log('Creating appointment types...');
  const appointmentTypes = [
    {
      name: 'X-Ray',
      description: 'Standard X-Ray imaging',
      duration: 30, // minutes
      color: '#4299E1', // blue
    },
    {
      name: 'MRI',
      description: 'Magnetic Resonance Imaging',
      duration: 60, // minutes
      color: '#48BB78', // green
    },
    {
      name: 'CT Scan',
      description: 'Computed Tomography Scan',
      duration: 45, // minutes
      color: '#ED8936', // orange
    },
    {
      name: 'Ultrasound',
      description: 'Ultrasound imaging',
      duration: 30, // minutes
      color: '#9F7AEA', // purple
    },
    {
      name: 'Consultation',
      description: 'Initial or follow-up consultation',
      duration: 20, // minutes
      color: '#F56565', // red
    },
  ];

  const createdAppointmentTypes = [];
  for (const type of appointmentTypes) {
    const createdType = await prisma.appointmentType.create({
      data: type
    });
    createdAppointmentTypes.push(createdType);
    console.log(`Created appointment type: ${type.name}`);
  }

  // Create time slots for each provider (next 7 days, 9 AM - 5 PM)
  console.log('Creating time slots...');
  for (const provider of createdProviders) {
    // Create time slots for the next 7 days
    for (let day = 0; day < 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      
      // Create slots from 9 AM to 5 PM in 30-minute increments
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = new Date(date);
          startTime.setHours(hour, minute, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 30);
          
          await prisma.timeSlot.create({
            data: {
              providerId: provider.id,
              startTime,
              endTime,
              isAvailable: Math.random() > 0.3, // 70% of slots are available
            },
          });
        }
      }
    }
    console.log(`Created time slots for provider: ${provider.name}`);
  }
  
  // Create some appointments
  console.log('Creating appointments...');
  const existingPatients = await prisma.patient.findMany();
  const timeSlots = await prisma.timeSlot.findMany({
    where: { isAvailable: true },
    take: 10, // Just use 10 slots for appointments
  });
  
  for (let i = 0; i < Math.min(10, timeSlots.length); i++) {
    const slot = timeSlots[i];
    const patientIndex = Math.floor(Math.random() * existingPatients.length);
    const appointmentTypeIndex = Math.floor(Math.random() * createdAppointmentTypes.length);
    
    const startTime = slot.startTime;
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + createdAppointmentTypes[appointmentTypeIndex].duration);
    
    await prisma.appointment.create({
      data: {
        title: `${createdAppointmentTypes[appointmentTypeIndex].name} Appointment`,
        patientId: existingPatients[patientIndex].id,
        providerId: slot.providerId,
        appointmentTypeId: createdAppointmentTypes[appointmentTypeIndex].id,
        startTime,
        endTime,
        status: 'SCHEDULED',
        notes: 'Created during seeding',
      },
    });
    
    // Mark the slot as unavailable
    await prisma.timeSlot.update({
      where: { id: slot.id },
      data: { isAvailable: false },
    });
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
