import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';

// Regenerate Prisma client to ensure it includes the User model
try {
  console.log('Regenerating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client regenerated successfully');
} catch (error) {
  console.error('Error regenerating Prisma client:', error);
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if admin user already exists
    const adminExists = await prisma.user.findUnique({
      where: {
        email: 'admin@globalrad.cloud',
      },
    });

    if (!adminExists) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: 'admin@globalrad.cloud',
          password: hashedPassword,
          role: 'ADMIN',
        },
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
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
