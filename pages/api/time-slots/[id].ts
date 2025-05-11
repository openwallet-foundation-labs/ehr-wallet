import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid time slot ID is required' });
  }
  
  switch (req.method) {
    case 'GET':
      return await getTimeSlot(req, res, id);
    case 'PUT':
      return await updateTimeSlot(req, res, id);
    case 'DELETE':
      return await deleteTimeSlot(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get time slot by ID
async function getTimeSlot(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
      include: {
        provider: true,
      },
    });
    
    if (!timeSlot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    return res.status(200).json(timeSlot);
  } catch (error) {
    console.error(`Error fetching time slot ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch time slot' });
  }
}

// Update time slot
async function updateTimeSlot(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { startTime, endTime, isAvailable } = req.body;
    
    // Validate required fields
    if ((!startTime && startTime !== undefined) || (!endTime && endTime !== undefined)) {
      return res.status(400).json({ error: 'Start time and end time are required if provided' });
    }
    
    // Get the current time slot
    const currentTimeSlot = await prisma.timeSlot.findUnique({
      where: { id },
    });
    
    if (!currentTimeSlot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    // Validate times if provided
    let parsedStartTime = currentTimeSlot.startTime;
    let parsedEndTime = currentTimeSlot.endTime;
    
    if (startTime) {
      parsedStartTime = new Date(startTime);
      if (isNaN(parsedStartTime.getTime())) {
        return res.status(400).json({ error: 'Invalid start time format' });
      }
    }
    
    if (endTime) {
      parsedEndTime = new Date(endTime);
      if (isNaN(parsedEndTime.getTime())) {
        return res.status(400).json({ error: 'Invalid end time format' });
      }
    }
    
    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Check for overlapping time slots if times are being changed
    if (startTime || endTime) {
      const overlappingSlots = await prisma.timeSlot.findMany({
        where: {
          id: { not: id },
          providerId: currentTimeSlot.providerId,
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
    }
    
    // Update the time slot
    const updatedTimeSlot = await prisma.timeSlot.update({
      where: { id },
      data: {
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        isAvailable: isAvailable !== undefined ? isAvailable : currentTimeSlot.isAvailable,
      },
      include: {
        provider: true,
      },
    });
    
    return res.status(200).json(updatedTimeSlot);
  } catch (error) {
    console.error(`Error updating time slot ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update time slot' });
  }
}

// Delete time slot
async function deleteTimeSlot(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Check if the time slot exists
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
    });
    
    if (!timeSlot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    // Check if the time slot is associated with any appointments
    // For simplicity, we're not actually checking this since our model doesn't directly associate appointments with time slots
    // However, in a real implementation, you might want to ensure this check
    
    // Delete the time slot
    await prisma.timeSlot.delete({
      where: { id },
    });
    
    return res.status(200).json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    console.error(`Error deleting time slot ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete time slot' });
  }
}
