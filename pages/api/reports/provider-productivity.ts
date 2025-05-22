// pages/api/reports/provider-productivity.ts
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

    const appointmentsByProvider = await prisma.appointment.groupBy({
      by: ['providerId'],
      _count: {
        id: true, // Count of appointments
      },
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
        // Optionally, filter by appointment status, e.g., only 'COMPLETED'
        // status: 'COMPLETED', 
      },
      orderBy: {
        _count: {
          id: 'desc', // Order by productivity
        },
      },
    });

    // Fetch provider details to enrich the report
    const providerIds = appointmentsByProvider.map(p => p.providerId);
    const providers = await prisma.provider.findMany({
      where: {
        id: {
          in: providerIds,
        },
      },
      select: {
        id: true,
        name: true,
        specialty: true,
      },
    });

    const providerMap = providers.reduce((acc, provider) => {
      acc[provider.id] = provider;
      return acc;
    }, {} as Record<string, { id: string; name: string; specialty: string | null }>);

    const productivityReport = appointmentsByProvider.map(item => ({
      providerId: item.providerId,
      providerName: providerMap[item.providerId]?.name || 'Unknown Provider',
      providerSpecialty: providerMap[item.providerId]?.specialty || 'N/A',
      appointmentCount: item._count.id,
      // As 'procedures' isn't explicitly defined, appointmentCount serves as a proxy
      proceduresPerformed: item._count.id, 
    }));

    res.status(200).json({
      providerProductivity: productivityReport,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Error fetching provider productivity:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}
