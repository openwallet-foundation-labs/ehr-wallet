'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppointmentType, ProviderType, AppointmentTypeType, TimeSlotType } from '@/lib/db';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAllProviders,
  getAllAppointmentTypes,
  getAllTimeSlots,
  updateTimeSlot
} from '@/lib/db-utils';
import { toast } from 'sonner';

export interface AppointmentWithDetails extends AppointmentType {
  provider?: ProviderType;
  appointmentType?: AppointmentTypeType;
}

export interface AppointmentFilters {
  status?: string;
  providerId?: string;
  appointmentTypeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface CreateAppointmentData {
  patientId: string;
  providerId: string;
  appointmentTypeId: string;
  startTime: Date;
  endTime: Date;
  reason?: string;
  notes?: string;
}

export const useAppointments = (patientId?: string, filters?: AppointmentFilters) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all appointments from the database
      const allAppointments = await getAllAppointments();
      
      // Filter by patient if specified
      const filteredAppointments = patientId 
        ? allAppointments.filter(apt => apt.patientId === patientId)
        : allAppointments;

      const [providers, appointmentTypes] = await Promise.all([
        getAllProviders(),
        getAllAppointmentTypes()
      ]);
      
      // Create lookup maps for better performance
      const providerMap = new Map(providers.map(p => [p.id, p]));
      const appointmentTypeMap = new Map(appointmentTypes.map(at => [at.id, at]));

      // Enrich appointments with provider and type details
      const enrichedAppointments = filteredAppointments.map(appointment => ({
        ...appointment,
        provider: providerMap.get(appointment.providerId),
        appointmentType: appointment.appointmentTypeId ? appointmentTypeMap.get(appointment.appointmentTypeId) : undefined
      }));

      // Apply additional filters
      let finalAppointments = enrichedAppointments;

      if (filters) {
        if (filters.status) {
          finalAppointments = finalAppointments.filter(apt => 
            apt.status.toLowerCase() === filters.status!.toLowerCase()
          );
        }

        if (filters.providerId) {
          finalAppointments = finalAppointments.filter(apt => 
            apt.providerId === filters.providerId
          );
        }

        if (filters.appointmentTypeId) {
          finalAppointments = finalAppointments.filter(apt => 
            apt.appointmentTypeId === filters.appointmentTypeId
          );
        }

        if (filters.dateFrom) {
          finalAppointments = finalAppointments.filter(apt => 
            new Date(apt.startTime) >= filters.dateFrom!
          );
        }

        if (filters.dateTo) {
          finalAppointments = finalAppointments.filter(apt => 
            new Date(apt.startTime) <= filters.dateTo!
          );
        }

        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          finalAppointments = finalAppointments.filter(apt => 
            apt.reason?.toLowerCase().includes(searchLower) ||
            apt.notes?.toLowerCase().includes(searchLower) ||
            apt.provider?.name.toLowerCase().includes(searchLower) ||
            apt.appointmentType?.name.toLowerCase().includes(searchLower)
          );
        }
      }

      // Sort by start time (newest first)
      finalAppointments.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      setAppointments(finalAppointments);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments');
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [patientId, filters]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const refreshAppointments = useCallback(() => {
    loadAppointments();
  }, [loadAppointments]);

  return {
    appointments,
    loading,
    error,
    refreshAppointments
  };
};

export const useAppointmentBooking = () => {
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookAppointment = useCallback(async (appointmentData: CreateAppointmentData) => {
    try {
      setBooking(true);
      setError(null);

      // Create the appointment
      const newAppointment = await createAppointment({
        ...appointmentData,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Find and mark the corresponding time slot as unavailable
      const timeSlots = await getAllTimeSlots();
      const matchingSlot = timeSlots.find(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const apptStart = new Date(appointmentData.startTime);
        const apptEnd = new Date(appointmentData.endTime);
        
        return (
          slot.providerId === appointmentData.providerId &&
          slotStart.getTime() === apptStart.getTime() && 
          slotEnd.getTime() === apptEnd.getTime() &&
          slot.isAvailable
        );
      });

      if (matchingSlot) {
        await updateTimeSlot(matchingSlot.id, { isAvailable: false });
      }

      toast.success('Appointment booked successfully!');
      return newAppointment;
    } catch (err) {
      console.error('Error booking appointment:', err);
      const errorMessage = 'Failed to book appointment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setBooking(false);
    }
  }, []);

  return {
    bookAppointment,
    booking,
    error
  };
};

export const useAppointmentActions = () => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAppointmentStatus = useCallback(async (appointmentId: string, status: string) => {
    try {
      setUpdating(true);
      setError(null);

      await updateAppointment(appointmentId, { 
        status,
        updatedAt: new Date()
      });

      toast.success(`Appointment ${status.toLowerCase()} successfully`);
      return true;
    } catch (err) {
      console.error('Error updating appointment:', err);
      const errorMessage = 'Failed to update appointment';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setUpdating(false);
    }
  }, []);

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    try {
      setUpdating(true);
      setError(null);

      // Get appointment details first
      const appointment = await getAppointmentById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Update appointment status
      await updateAppointment(appointmentId, { 
        status: 'cancelled',
        updatedAt: new Date()
      });

      // Find and free up the time slot
      const timeSlots = await getAllTimeSlots();
      const matchingSlot = timeSlots.find(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const apptStart = new Date(appointment.startTime);
        const apptEnd = new Date(appointment.endTime);
        
        return (
          slot.providerId === appointment.providerId &&
          slotStart.getTime() === apptStart.getTime() && 
          slotEnd.getTime() === apptEnd.getTime()
        );
      });

      if (matchingSlot) {
        await updateTimeSlot(matchingSlot.id, { isAvailable: true });
      }

      toast.success('Appointment cancelled successfully');
      return true;
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      const errorMessage = 'Failed to cancel appointment';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setUpdating(false);
    }
  }, []);

  const rescheduleAppointment = useCallback(async (
    appointmentId: string, 
    newStartTime: Date, 
    newEndTime: Date
  ) => {
    try {
      setUpdating(true);
      setError(null);

      // Get current appointment
      const appointment = await getAppointmentById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Free up the old time slot
      const timeSlots = await getAllTimeSlots();
      const oldSlot = timeSlots.find(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const apptStart = new Date(appointment.startTime);
        const apptEnd = new Date(appointment.endTime);
        
        return (
          slot.providerId === appointment.providerId &&
          slotStart.getTime() === apptStart.getTime() && 
          slotEnd.getTime() === apptEnd.getTime()
        );
      });

      if (oldSlot) {
        await updateTimeSlot(oldSlot.id, { isAvailable: true });
      }

      // Find and reserve the new time slot
      const newSlot = timeSlots.find(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        
        return (
          slot.providerId === appointment.providerId &&
          slotStart.getTime() === newStartTime.getTime() && 
          slotEnd.getTime() === newEndTime.getTime() &&
          slot.isAvailable
        );
      });

      if (!newSlot) {
        throw new Error('Selected time slot is not available');
      }

      await updateTimeSlot(newSlot.id, { isAvailable: false });

      // Update appointment with new times
      await updateAppointment(appointmentId, {
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: new Date()
      });

      toast.success('Appointment rescheduled successfully');
      return true;
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reschedule appointment';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updateAppointmentStatus,
    cancelAppointment,
    rescheduleAppointment,
    updating,
    error
  };
};

export const useAppointmentData = () => {
  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentTypeType[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [providersData, appointmentTypesData, timeSlotsData] = await Promise.all([
        getAllProviders(),
        getAllAppointmentTypes(),
        getAllTimeSlots()
      ]);

      setProviders(providersData);
      setAppointmentTypes(appointmentTypesData);
      setTimeSlots(timeSlotsData);
    } catch (err) {
      console.error('Error loading appointment data:', err);
      setError('Failed to load appointment data');
      toast.error('Failed to load appointment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getAvailableTimeSlots = useCallback((providerId: string, date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return timeSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return (
        slot.providerId === providerId &&
        slot.isAvailable &&
        slotDate >= startOfDay &&
        slotDate <= endOfDay
      );
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [timeSlots]);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    providers,
    appointmentTypes,
    timeSlots,
    loading,
    error,
    getAvailableTimeSlots,
    refreshData
  };
};