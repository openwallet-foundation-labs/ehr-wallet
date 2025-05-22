// pages/api/reports/patient-stats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  try {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const totalPatients = await prisma.patient.count();

    const newPatients = await prisma.patient.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const genderDistribution = await prisma.patient.groupBy({
      by: ['gender'],
      _count: {
        gender: true,
      },
      where: {
        createdAt: { // Also filter gender distribution by date range if needed
          gte: start,
          lte: end,
        }
      }
    });

    const formattedGenderDistribution = genderDistribution.reduce((acc, curr) => {
      acc[curr.gender] = curr._count.gender;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      totalPatients,
      newPatientsInDateRange: newPatients,
      genderDistribution: formattedGenderDistribution,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}
