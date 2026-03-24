'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { Calendar, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Paper, Title, Text } from '@mantine/core';
import { Button } from '@mantine/core';
import { TextInput } from '@mantine/core';
import { Textarea } from '@mantine/core';
import { Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Popover } from '@mantine/core';
import { Badge } from '@mantine/core';
import { Alert } from '@mantine/core';
import { Skeleton } from '@mantine/core';
import { toast } from 'sonner';
import { ProviderType, AppointmentTypeType, TimeSlotType } from '@/lib/db';
import {
  getAllProviders,
  getAllAppointmentTypes,
  getAllTimeSlots,
  createAppointment,
  updateTimeSlot
} from '@/lib/db-utils';

interface AppointmentBookingProps {
  patientId: string;
  onBookingComplete?: (appointmentId: string) => void;
  onCancel?: () => void;
}

interface AvailableSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  providerId: string;
  isAvailable: boolean;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  patientId,
  onBookingComplete,
  onCancel
}) => {
  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentTypeType[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  // Available slots for selected date and provider
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProvider && selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedTimeSlot('');
    }
  }, [selectedProvider, selectedDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [providersData, appointmentTypesData, timeSlotsData] = await Promise.all([
        getAllProviders(),
        getAllAppointmentTypes(),
        getAllTimeSlots()
      ]);

      setProviders(providersData);
      setAppointmentTypes(appointmentTypesData);
      setTimeSlots(timeSlotsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load appointment data');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedProvider || !selectedDate) return;

    try {
      setLoadingSlots(true);

      // Filter time slots for the selected provider and date
      const providerSlots = timeSlots.filter(slot => {
        const slotDate = new Date(slot.startTime);
        return slot.providerId === selectedProvider &&
               isSameDay(slotDate, selectedDate) &&
               slot.isAvailable &&
               isAfter(slotDate, new Date()); // Only future slots
      });

      // Convert to AvailableSlot format
      const slots: AvailableSlot[] = providerSlots.map(slot => ({
        id: slot.id,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
        providerId: slot.providerId,
        isAvailable: slot.isAvailable
      }));

      // Sort by start time
      slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      toast.error('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProvider || !selectedAppointmentType || !selectedTimeSlot || !selectedDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedSlot = availableSlots.find(slot => slot.id === selectedTimeSlot);
    if (!selectedSlot) {
      toast.error('Selected time slot is no longer available');
      return;
    }

    try {
      setSubmitting(true);

      // Create the appointment
      const appointmentData = {
        patientId,
        providerId: selectedProvider,
        appointmentTypeId: selectedAppointmentType,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        title: reason.trim() || 'Appointment',
        status: 'SCHEDULED' as const,
        notes: notes.trim() || undefined
      };

      const newAppointment = await createAppointment(appointmentData);

      // Mark the time slot as unavailable
      await updateTimeSlot(selectedTimeSlot, { isAvailable: false });

      toast.success('Appointment booked successfully!');
      onBookingComplete?.(newAppointment.id);

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProvider('');
    setSelectedAppointmentType('');
    setSelectedDate(null);
    setSelectedTimeSlot('');
    setNotes('');
    setReason('');
    setAvailableSlots([]);
  };

  const isFormValid = selectedProvider && selectedAppointmentType && selectedTimeSlot && selectedDate;

  if (loading) {
    return (
      <Paper p="md" withBorder>
        <Title order={5} mb="md">Book New Appointment</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton height={16} width={96} />
              <Skeleton height={40} width="100%" />
            </div>
          ))}
        </div>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Title order={5} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={20} />
        Book New Appointment
      </Title>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Provider Selection */}
        <Select
          label="Healthcare Provider *"
          placeholder="Select a provider"
          value={selectedProvider}
          onChange={(value) => setSelectedProvider(value || '')}
          data={providers.map(provider => ({
            value: provider.id,
            label: provider.name,
            description: provider.specialty
          }))}
          required
        />

        {/* Appointment Type Selection */}
        <Select
          label="Appointment Type *"
          placeholder="Select appointment type"
          value={selectedAppointmentType}
          onChange={(value) => setSelectedAppointmentType(value || '')}
          data={appointmentTypes.map(type => ({
            value: type.id,
            label: type.name,
            description: `${type.duration} minutes`
          }))}
          required
        />

        {/* Date Selection */}
        <div>
          <Text size="sm" fw={500} mb={4}>Preferred Date *</Text>
          <Popover position="bottom-start" withArrow>
            <Popover.Target>
              <Button
                variant="outline"
                fullWidth
                style={{ justifyContent: 'flex-start' }}
                leftSection={<Calendar size={16} />}
              >
                {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <DatePickerInput
                type="default"
                value={selectedDate}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={setSelectedDate as any}
                minDate={new Date()}
                maxDate={addDays(new Date(), 90)}
                placeholder="Select date"
              />
            </Popover.Dropdown>
          </Popover>
        </div>

        {/* Time Slot Selection */}
        {selectedProvider && selectedDate && (
          <div>
            <Text size="sm" fw={500} mb={4}>Available Time Slots *</Text>
            {loadingSlots ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} height={40} />
                ))}
              </div>
            ) : availableSlots.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {availableSlots.map(slot => (
                  <Button
                    key={slot.id}
                    type="button"
                    variant={selectedTimeSlot === slot.id ? 'filled' : 'outline'}
                    style={{ display: 'flex', flexDirection: 'column', padding: '12px', height: 'auto' }}
                    onClick={() => setSelectedTimeSlot(slot.id)}
                  >
                    <Clock size={16} style={{ marginBottom: '4px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>
                      {format(slot.startTime, 'h:mm a')}
                    </span>
                    <span style={{ fontSize: '12px', color: selectedTimeSlot === slot.id ? 'white' : '#6b7280' }}>
                      {format(slot.endTime, 'h:mm a')}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <Alert color="yellow" icon={<AlertCircle size={16} />}>
                No available time slots for the selected date and provider.
                Please try a different date.
              </Alert>
            )}
          </div>
        )}

        {/* Reason for Visit */}
        <TextInput
          label="Reason for Visit"
          placeholder="Brief description of your visit reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* Additional Notes */}
        <Textarea
          label="Additional Notes"
          placeholder="Any additional information or special requests"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          minRows={3}
        />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '16px' }}>
          <Button
            type="submit"
            disabled={!isFormValid || submitting}
            style={{ flex: 1 }}
            leftSection={!submitting ? <CheckCircle size={16} /> : undefined}
            loading={submitting}
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Paper>
  );
};

export default AppointmentBooking;
