import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await getTimeSlots(req, res);
    case 'POST':
      return await createTimeSlot(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get time slots with filtering options
async function getTimeSlots(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { providerId, startDate, endDate, isAvailable } = req.query;
    
    // Build the query filter
    const filter: any = {};
    
    if (providerId && typeof providerId === 'string') {
      filter.providerId = providerId;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filter.startTime = {};
      
      if (startDate && typeof startDate === 'string') {
        filter.startTime.gte = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        filter.startTime.lte = new Date(endDate);
      }
    }
    
    // Filter by availability
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }
    
    const timeSlots = await prisma.timeSlot.findMany({
      where: filter,
      include: {
        provider: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    return res.status(200).json(timeSlots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return res.status(500).json({ error: 'Failed to fetch time slots' });
  }
}

// Create a new time slot
async function createTimeSlot(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { providerId, startTime, endTime, isAvailable } = req.body;
    
    // Validate required fields
    if (!providerId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Provider ID, start time, and end time are required' });
    }
    
    // Validate provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Validate times
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    
    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Check for overlapping time slots
    const overlappingSlots = await prisma.timeSlot.findMany({
      where: {
        providerId,
        OR: [
          {
            // New start time is within an existing slot
            AND: [
              { startTime: { lte: parsedStartTime } },
              { endTime: { gt: parsedStartTime } },
            ],
          },
          {
            // New end time is within an existing slot
            AND: [
              { startTime: { lt: parsedEndTime } },
              { endTime: { gte: parsedEndTime } },
            ],
          },
          {
            // New slot completely contains an existing slot
            AND: [
              { startTime: { gte: parsedStartTime } },
              { endTime: { lte: parsedEndTime } },
            ],
          },
        ],
      },
    });
    
    if (overlappingSlots.length > 0) {
      return res.status(400).json({ error: 'Time slot overlaps with an existing slot' });
    }
    
    // Create the time slot
    const timeSlot = await prisma.timeSlot.create({
      data: {
        providerId,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        isAvailable: isAvailable !== false,
      },
    });
    
    return res.status(201).json(timeSlot);
  } catch (error) {
    console.error('Error creating time slot:', error);
    return res.status(500).json({ error: 'Failed to create time slot' });
  }
}

// Bulk create time slots for a provider
export async function bulkCreateTimeSlots(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { providerId, startDate, endDate, dailyStartTime, dailyEndTime, slotDuration, weekdays } = req.body;
    
    // Validate required fields
    if (!providerId || !startDate || !endDate || !dailyStartTime || !dailyEndTime || !slotDuration) {
      return res.status(400).json({ 
        error: 'Provider ID, date range, daily times, and slot duration are required'
      });
    }
    
    // Validate provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Parse dates and validate
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ error: 'Invalid date range' });
    }
    
    const slotDurationMinutes = parseInt(slotDuration);
    if (isNaN(slotDurationMinutes) || slotDurationMinutes <= 0) {
      return res.status(400).json({ error: 'Slot duration must be a positive number' });
    }
    
    // Parse daily time range
    const [startHour, startMinute] = dailyStartTime.split(':').map(Number);
    const [endHour, endMinute] = dailyEndTime.split(':').map(Number);
    
    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      return res.status(400).json({ error: 'Invalid time format' });
    }
    
    // Create time slots
    const timeSlots = [];
    const currentDate = new Date(start);
    const validWeekdays = weekdays || [0, 1, 2, 3, 4, 5, 6]; // Default to all days if not specified
    
    while (currentDate <= end) {
      // Check if the current day is included in the weekdays filter
      if (validWeekdays.includes(currentDate.getDay())) {
        // Set the current slot start time
        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);
        
        // Set the end time limit for the day
        const dailyEndTimeLimit = new Date(currentDate);
        dailyEndTimeLimit.setHours(endHour, endMinute, 0, 0);
        
        // Create slots until reaching the daily end time
        while (slotStart < dailyEndTimeLimit) {
          // Calculate slot end time
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + slotDurationMinutes);
          
          // Ensure the slot doesn't go past the daily end time
          if (slotEnd <= dailyEndTimeLimit) {
            // Create the time slot
            timeSlots.push({
              providerId,
              startTime: new Date(slotStart),
              endTime: new Date(slotEnd),
              isAvailable: true,
            });
          }
          
          // Move to the next slot start time
          slotStart = new Date(slotEnd);
        }
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Bulk create the time slots using a transaction (SQLite doesn't support createMany)
    let createdCount = 0;
    
    await prisma.$transaction(async (tx) => {
      for (const slot of timeSlots) {
        // Check if a slot already exists at this time to avoid duplicates
        const existing = await tx.timeSlot.findFirst({
          where: {
            providerId: slot.providerId,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }
        });
        
        if (!existing) {
          await tx.timeSlot.create({ data: slot });
          createdCount++;
        }
      }
    });
    
    return res.status(201).json({
      message: `${createdCount} time slots created successfully`,
      count: createdCount,
    });
  } catch (error) {
    console.error('Error bulk creating time slots:', error);
    return res.status(500).json({ error: 'Failed to create time slots' });
  }
}
