// pages/api/reports/appointment-volumes.ts
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

    const appointmentsInRange = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalAppointmentsInDateRange = appointmentsInRange.length;

    const statusDistribution = await prisma.appointment.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
      },
    });

    const formattedStatusDistribution = statusDistribution.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Placeholder for appointments per period (e.g., per day)
    // This would require more complex grouping and iteration
    const appointmentsPerPeriod = {
      message: "Appointments per period calculation not fully implemented yet. Requires grouping by day/week/month.",
      details: "For a daily breakdown, you would group appointments by date part of startTime."
    };

    res.status(200).json({
      totalAppointmentsInDateRange,
      statusDistribution: formattedStatusDistribution,
      appointmentsPerPeriod, // Basic placeholder for now
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Error fetching appointment volumes:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}
