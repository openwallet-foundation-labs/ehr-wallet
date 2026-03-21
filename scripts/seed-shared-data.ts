import { PrismaClient } from '@prisma/client';
import { keccak256, toUtf8Bytes } from 'ethers';

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed shared medical data...');

  // Sample ethereum address - this should match a user in your system
  const ethereumAddress = '0x123456789abcdef123456789abcdef123456789a';
  
  // Create sample shared data records
  const sharedData = [
    {
      accessId: keccak256(toUtf8Bytes('sample-data-1')),
      ipfsCid: 'QmXyZ123456789abcdef',
      userId: ethereumAddress,
      expiryTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      hasPassword: true,
      accessCount: 2,
      dataTypes: 'medical-history,lab-results',
      isActive: true
    },
    {
      accessId: keccak256(toUtf8Bytes('sample-data-2')),
      ipfsCid: 'QmAbC987654321defghi',
      userId: ethereumAddress,
      expiryTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired 1 day ago
      hasPassword: false,
      accessCount: 5,
      dataTypes: 'imaging,prescriptions',
      isActive: true
    },
    {
      accessId: keccak256(toUtf8Bytes('sample-data-3')),
      ipfsCid: 'QmDef456789abcdef123',
      userId: ethereumAddress,
      expiryTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      hasPassword: true,
      accessCount: 0,
      dataTypes: 'visit-notes',
      isActive: true
    }
  ];

  // Insert the data
  for (const data of sharedData) {
    try {
      // Check if record with this accessId already exists
      const existing = await prisma.sharedMedicalData.findUnique({
        where: { accessId: data.accessId }
      });

      if (existing) {
        console.log(`Record with accessId ${data.accessId} already exists, skipping...`);
        continue;
      }

      // Create the record
      await prisma.sharedMedicalData.create({
        data
      });
      console.log(`Created shared data record with accessId: ${data.accessId}`);
    } catch (error) {
      console.error(`Error creating record with accessId ${data.accessId}:`, error);
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
