import { NextApiRequest, NextApiResponse } from 'next';
import { getAllTimeSlots, createTimeSlot, getProviderById } from '@/lib/db-utils';
import { initDatabase, db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the database is initialized
  await initDatabase();
  
  switch (req.method) {
    case 'GET':
      return await getTimeSlots(req, res);
    case 'POST':
      return await createNewTimeSlot(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get time slots with filtering options
async function getTimeSlots(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { providerId, startDate, endDate, isAvailable } = req.query;
    
    // Get all time slots and filter in memory
    let timeSlots = await getAllTimeSlots();
    
    // Apply filters
    if (providerId && typeof providerId === 'string') {
      timeSlots = timeSlots.filter(slot => slot.providerId === providerId);
    }
    
    // Filter by date range
    if (startDate && typeof startDate === 'string') {
      const startDateObj = new Date(startDate);
      timeSlots = timeSlots.filter(slot => new Date(slot.startTime) >= startDateObj);
    }
    
    if (endDate && typeof endDate === 'string') {
      const endDateObj = new Date(endDate);
      timeSlots = timeSlots.filter(slot => new Date(slot.startTime) <= endDateObj);
    }
    
    // Filter by availability
    if (isAvailable !== undefined) {
      const isAvailableBool = isAvailable === 'true';
      timeSlots = timeSlots.filter(slot => slot.isAvailable === isAvailableBool);
    }
    
    // Sort by start time
    timeSlots.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    
    // Include related provider data
    const providerIds = [...new Set(timeSlots.map(slot => slot.providerId))];
    const providers = await db.providers.where('id').anyOf(providerIds).toArray();
    
    // Create a lookup map for providers
    const providersMap = providers.reduce((acc, provider) => {
      acc[provider.id] = provider;
      return acc;
    }, {} as Record<string, any>);
    
    // Enrich time slots with provider data
    const enrichedTimeSlots = timeSlots.map(slot => {
      return {
        ...slot,
        provider: providersMap[slot.providerId]
      };
    });
    
    return res.status(200).json(enrichedTimeSlots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return res.status(500).json({ error: 'Failed to fetch time slots' });
  }
}

// Create a new time slot
async function createNewTimeSlot(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { providerId, startTime, endTime, isAvailable } = req.body;
    
    // Validate required fields
    if (!providerId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Provider ID, start time, and end time are required' });
    }
    
    // Validate provider exists
    const provider = await getProviderById(providerId);
    
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
    
    // Get all time slots for the provider
    const allTimeSlots = await db.timeSlots.where('providerId').equals(providerId).toArray();
    
    // Check for overlapping time slots
    const overlappingSlots = allTimeSlots.filter(slot => {
      const existingStart = new Date(slot.startTime);
      const existingEnd = new Date(slot.endTime);
      
      return (
        // New start time is within an existing slot
        (existingStart <= parsedStartTime && existingEnd > parsedStartTime) ||
        // New end time is within an existing slot
        (existingStart < parsedEndTime && existingEnd >= parsedEndTime) ||
        // New slot completely contains an existing slot
        (parsedStartTime <= existingStart && parsedEndTime >= existingEnd)
      );
    });
    
    if (overlappingSlots.length > 0) {
      return res.status(400).json({ error: 'Time slot overlaps with an existing slot' });
    }
    
    // Create the time slot using the utility function
    const timeSlotData = {
      providerId,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      isAvailable: isAvailable !== false,
    };
    
    const timeSlot = await createTimeSlot(timeSlotData);
    
    // Include the provider in the response
    const enrichedTimeSlot = {
      ...timeSlot,
      provider
    };
    
    return res.status(201).json(enrichedTimeSlot);
  } catch (error) {
    console.error('Error creating time slot:', error);
    return res.status(500).json({ error: 'Failed to create time slot' });
  }
}

// Bulk create time slots for a provider
export async function bulkCreateTimeSlots(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure the database is initialized
    await initDatabase();
    
    const { providerId, startDate, endDate, dailyStartTime, dailyEndTime, slotDuration, weekdays } = req.body;
    
    // Validate required fields
    if (!providerId || !startDate || !endDate || !dailyStartTime || !dailyEndTime || !slotDuration) {
      return res.status(400).json({ 
        error: 'Provider ID, date range, daily times, and slot duration are required'
      });
    }
    
    // Validate provider exists
    const provider = await getProviderById(providerId);
    
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
    
    // Get existing time slots for the provider to check for conflicts
    const existingTimeSlots = await db.timeSlots.where('providerId').equals(providerId).toArray();
    
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
          
          // Make sure the slot doesn't extend past the daily end time
          if (slotEnd > dailyEndTimeLimit) {
            break;
          }
          
          // Check for overlapping existing slots
          const overlappingSlots = existingTimeSlots.filter(slot => {
            const existingStart = new Date(slot.startTime);
            const existingEnd = new Date(slot.endTime);
            
            return (
              // New start time is within an existing slot
              (existingStart <= slotStart && existingEnd > slotStart) ||
              // New end time is within an existing slot
              (existingStart < slotEnd && existingEnd >= slotEnd) ||
              // New slot completely contains an existing slot
              (slotStart <= existingStart && slotEnd >= existingEnd)
            );
          });
          
          if (overlappingSlots.length === 0) {
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
      currentDate.setHours(0, 0, 0, 0);
    }
    
    // Bulk create the time slots using Dexie
    const createdSlots = [];
    let createdCount = 0;
    
    // Use a transaction
    await db.transaction('rw', db.timeSlots, async () => {
      for (const slot of timeSlots) {
        // Check if a slot already exists at exactly this time to avoid duplicates
        const existingSlot = existingTimeSlots.find(existing => 
          existing.providerId === slot.providerId &&
          new Date(existing.startTime).getTime() === new Date(slot.startTime).getTime() &&
          new Date(existing.endTime).getTime() === new Date(slot.endTime).getTime()
        );
        
        if (!existingSlot) {
          const createdSlot = await createTimeSlot(slot);
          createdSlots.push(createdSlot);
          createdCount++;
        }
      }
    });
    
    return res.status(201).json({
      message: `${createdCount} time slots created successfully`,
      count: createdCount,
      slots: createdSlots
    });
  } catch (error) {
    console.error('Error bulk creating time slots:', error);
    return res.status(500).json({ error: 'Failed to create time slots' });
  }
}
