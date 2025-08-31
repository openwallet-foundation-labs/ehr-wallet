import { db } from './db';
import { setupOfflineAuth } from './offline-auth';
import { v4 as uuidv4 } from 'uuid';

// Helper function to seed appointments
async function seedAppointments() {
  const providers = await db.providers.toArray();
  const appointmentTypes = await db.appointmentTypes.toArray();
  
  if (providers.length > 0 && appointmentTypes.length > 0) {
    // Seed sample appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    // Create proper Date objects for startTime and endTime
    const todayStart = new Date(today);
    todayStart.setHours(9, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setMinutes(todayEnd.getMinutes() + appointmentTypes[0].duration);
    
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(14, 30, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + appointmentTypes[2].duration);
    
    const nextWeekStart = new Date(nextWeek);
    nextWeekStart.setHours(11, 0, 0, 0);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setMinutes(nextWeekEnd.getMinutes() + appointmentTypes[1].duration);

    await db.appointments.bulkAdd([
      {
        id: uuidv4(),
        title: 'X-Ray Appointment',
        patientId: 'patient-1',
        providerId: providers[0].id,
        appointmentTypeId: appointmentTypes[0].id,
        startTime: todayStart,
        endTime: todayEnd,
        status: 'SCHEDULED',
        notes: 'Routine X-Ray examination',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Ultrasound Appointment',
        patientId: 'patient-2',
        providerId: providers[1].id,
        appointmentTypeId: appointmentTypes[2].id,
        startTime: tomorrowStart,
        endTime: tomorrowEnd,
        status: 'SCHEDULED',
        notes: 'Abdominal ultrasound',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'MRI Appointment',
        patientId: 'patient-3',
        providerId: providers[0].id,
        appointmentTypeId: appointmentTypes[1].id,
        startTime: nextWeekStart,
        endTime: nextWeekEnd,
        status: 'SCHEDULED',
        notes: 'Brain MRI scan',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    console.log('Sample appointments seeded successfully!');
  }
}

// Seed the offline database with initial data
export async function seedOfflineDatabase() {
  try {
    // Check if already seeded by checking if any users exist
    const userCount = await db.users.count();
    const appointmentCount = await db.appointments.count();
    
    // Clear existing appointments to fix schema mismatch
    if (appointmentCount > 0) {
      console.log('Clearing existing appointments to fix schema...');
      await db.appointments.clear();
    }
    
    if (userCount > 0) {
      console.log('Seeding appointments with correct schema...');
      await seedAppointments();
      return;
    }
    
    console.log('Seeding offline database...');
    
    // Seed users for authentication
    await setupOfflineAuth([
      { email: 'admin@example.com', password: 'password', role: 'ADMIN', name: 'Admin User' },
      { email: 'doctor@example.com', password: 'password', role: 'DOCTOR', name: 'Doctor User' },
      { email: 'staff@example.com', password: 'password', role: 'STAFF', name: 'Staff User' },
      { email: 'patient@example.com', password: 'password', role: 'PATIENT', name: 'Patient User' }
    ]);
    
    // Seed sample providers
    await db.providers.bulkAdd([
      {
        id: uuidv4(),
        name: 'Dr. Jane Smith',
        specialty: 'Radiology',
        email: 'jsmith@example.com',
        phone: '555-123-4567',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Dr. Robert Chen',
        specialty: 'Ultrasound',
        email: 'rchen@example.com',
        phone: '555-987-6543',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // Seed appointment types
    await db.appointmentTypes.bulkAdd([
      {
        id: uuidv4(),
        name: 'X-Ray',
        description: 'Standard X-Ray imaging',
        duration: 30,
        color: '#4299e1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'MRI',
        description: 'Magnetic Resonance Imaging',
        duration: 60,
        color: '#48bb78',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Ultrasound',
        description: 'Ultrasound imaging',
        duration: 45,
        color: '#805ad5',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Seed sample appointments
    await seedAppointments();

    console.log('Database seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}
