import { db } from './db';
import { setupOfflineAuth } from './offline-auth';
import { v4 as uuidv4 } from 'uuid';

// Seed the offline database with initial data
export async function seedOfflineDatabase() {
  try {
    // Check if already seeded by checking if any users exist
    const userCount = await db.users.count();
    
    if (userCount > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }
    
    console.log('Seeding offline database...');
    
    // Seed users for authentication
    await setupOfflineAuth([
      { email: 'admin@example.com', password: 'password', role: 'ADMIN', name: 'Admin User' },
      { email: 'doctor@example.com', password: 'password', role: 'DOCTOR', name: 'Doctor User' },
      { email: 'staff@example.com', password: 'password', role: 'STAFF', name: 'Staff User' }
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
    
    console.log('Database seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}
