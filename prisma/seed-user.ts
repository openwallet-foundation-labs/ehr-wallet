import bcrypt from 'bcryptjs';
import { initDatabase } from '@/lib/db';
import { getUserByEmail, createUser } from '@/lib/db-utils';

// Initialize the Dexie database
console.log('Initializing Dexie database...');

async function main() {
  try {
    // Initialize the database
    await initDatabase();
    
    // Check if admin user already exists
    const adminExists = await getUserByEmail('admin@globalrad.cloud');

    if (!adminExists) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await createUser({
        name: 'System Administrator',
        email: 'admin@globalrad.cloud',
        password: hashedPassword,
        role: 'ADMIN',
      });
      console.log('Default admin user created');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('Seed process completed');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
