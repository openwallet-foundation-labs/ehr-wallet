import { initDatabase, db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  // Initialize the database
  await initDatabase();
  
  // Clear existing data
  try {
    console.log('Clearing existing data...');
    // Delete in the correct order to respect referential integrity
    await db.appointments.clear();
    await db.timeSlots.clear();
    await db.visits.clear();
    await db.patients.clear();
    await db.appointmentTypes.clear();
    await db.providers.clear();
  } catch (error) {
    console.error('Error clearing data:', error);
    // Continue with the seed process even if clearing fails (tables might not exist yet)
  }
  
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
    const patientNow = new Date();
    await db.patients.add({
      id: uuidv4(),
      patientId: patient.patientId,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      createdAt: patientNow,
      updatedAt: patientNow
    });

    // Create visits for each patient
    const visitNow = new Date();
    await db.visits.add({
      id: uuidv4(),
      date: new Date(2025, 4, Math.floor(Math.random() * 10) + 1), // May 1-10, 2025
      notes: 'Routine checkup',
      patientId: patient.patientId,
      createdAt: visitNow,
      updatedAt: visitNow
    });
    
    if (Math.random() > 0.5) {
      // Add a second visit for some patients
      const secondVisitNow = new Date();
      await db.visits.add({
        id: uuidv4(),
        date: new Date(2025, 3, Math.floor(Math.random() * 15) + 1), // April 1-15, 2025
        notes: 'Follow-up visit',
        patientId: patient.patientId,
        createdAt: secondVisitNow,
        updatedAt: secondVisitNow
      });
    }

    console.log(`Created patient: ${patient.name} with ID: ${patient.patientId}`);
  }

  console.log(`Created ${patients.length} patients`);

  // Seed providers
  console.log('Creating providers...');
  const providers = [
    {
      name: 'Dr. Sarah Johnson',
      specialty: 'Radiology',
      email: 'sarah.johnson@globalrad.cloud',
      phone: '(555) 123-4567',
    },
    {
      name: 'Dr. Michael Chen',
      specialty: 'Neuroradiology',
      email: 'michael.chen@globalrad.cloud',
      phone: '(555) 234-5678',
    },
    {
      name: 'Dr. Rebecca Martinez',
      specialty: 'Interventional Radiology',
      email: 'rebecca.martinez@globalrad.cloud',
      phone: '(555) 345-6789',
    }
  ];
  
  for (const provider of providers) {
    const now = new Date();
    await db.providers.add({
      id: uuidv4(),
      ...provider,
      createdAt: now,
      updatedAt: now
    });
  }
  console.log(`Created ${providers.length} providers`);

  // Seed appointment types
  const appointmentTypeData = [
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

  for (const appointmentType of appointmentTypeData) {
    const now = new Date();
    await db.appointmentTypes.add({
      id: uuidv4(),
      ...appointmentType,
      createdAt: now,
      updatedAt: now
    });
  }
  console.log(`Created ${appointmentTypeData.length} appointment types`);

  // Create time slots for each provider
  const dbProviders = await db.providers.toArray();
  
  // Generate time slots for each provider
  const monday = new Date();
  // Set to next Monday
  monday.setDate(monday.getDate() + ((1 + 7 - monday.getDay()) % 7));
  monday.setHours(8, 0, 0, 0);

  let timeSlotCount = 0;
  for (const provider of dbProviders) {
    // Generate 2 weeks of time slots
    for (let day = 0; day < 10; day++) { // Weekdays for 2 weeks
      if (day % 7 === 5 || day % 7 === 6) continue; // Skip weekends
      
      const date = new Date(monday);
      date.setDate(monday.getDate() + day);

      // Morning slots
      for (let hour = 8; hour < 12; hour++) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(hour, 30, 0, 0);
        const now = new Date();

        await db.timeSlots.add({
          id: uuidv4(),
          providerId: provider.id,
          startTime,
          endTime,
          isAvailable: true,
          createdAt: now,
          updatedAt: now
        });
        timeSlotCount++;
      }

      // Afternoon slots
      for (let hour = 13; hour < 17; hour++) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(hour, 30, 0, 0);
        const now = new Date();

        await db.timeSlots.add({
          id: uuidv4(),
          providerId: provider.id,
          startTime,
          endTime,
          isAvailable: true,
          createdAt: now,
          updatedAt: now
        });
        timeSlotCount++;
      }
    }
  }
  
  console.log(`Created ${timeSlotCount} time slots`);

  // Create some appointments
  console.log('Creating appointments...');
  const dbPatients = await db.patients.toArray();
  const allTimeSlots = await db.timeSlots.filter(slot => slot.isAvailable === true).toArray();
  // Get the first 5 time slots
  const timeSlots = allTimeSlots.slice(0, 5);
  const appointmentTypes = await db.appointmentTypes.toArray();

  // Create 5 appointments
  for (let i = 0; i < Math.min(5, timeSlots.length); i++) {
    const slot = timeSlots[i];
    const patient = dbPatients[i % dbPatients.length];
    const appointmentType = appointmentTypes[i % appointmentTypes.length];
    const now = new Date();

    // Get provider for the slot
    const provider = await db.providers.get(slot.providerId);
    if (!provider) continue;

    await db.appointments.add({
      id: uuidv4(),
      title: `${appointmentType.name} for ${patient.name}`,
      patientId: patient.patientId,
      providerId: slot.providerId,
      appointmentTypeId: appointmentType.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      notes: `Test appointment ${i + 1}`,
      status: i < 3 ? 'SCHEDULED' : (i === 3 ? 'CONFIRMED' : 'COMPLETED'),
      createdAt: now,
      updatedAt: now
    });

    // Mark the time slot as unavailable
    await db.timeSlots.update(slot.id, { 
      isAvailable: false,
      updatedAt: now
    });
  }
  console.log('Created test appointments');

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed completed!');
  });
