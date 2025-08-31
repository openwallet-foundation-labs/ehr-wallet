'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { Calendar, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
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
        status: 'scheduled' as const,
        notes: notes.trim() || undefined,
        reason: reason.trim() || undefined
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
    setSelectedDate(undefined);
    setSelectedTimeSlot('');
    setNotes('');
    setReason('');
    setAvailableSlots([]);
  };

  const isFormValid = selectedProvider && selectedAppointmentType && selectedTimeSlot && selectedDate;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Book New Appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Book New Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Healthcare Provider *</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{provider.name}</span>
                      <span className="text-sm text-gray-500">{provider.specialty}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Appointment Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="appointmentType">Appointment Type *</Label>
            <Select value={selectedAppointmentType} onValueChange={setSelectedAppointmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.name}</span>
                      <span className="text-sm text-gray-500">
                        {type.duration} minutes - ${type.price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Preferred Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => 
                    isBefore(date, startOfDay(new Date())) || 
                    isAfter(date, addDays(new Date(), 90))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slot Selection */}
          {selectedProvider && selectedDate && (
            <div className="space-y-2">
              <Label>Available Time Slots *</Label>
              {loadingSlots ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSlots.map(slot => (
                    <Button
                      key={slot.id}
                      type="button"
                      variant={selectedTimeSlot === slot.id ? 'default' : 'outline'}
                      className="h-auto p-3 flex flex-col items-center"
                      onClick={() => setSelectedTimeSlot(slot.id)}
                    >
                      <Clock className="h-4 w-4 mb-1" />
                      <span className="text-sm font-medium">
                        {format(slot.startTime, 'h:mm a')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(slot.endTime, 'h:mm a')}
                      </span>
                    </Button>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No available time slots for the selected date and provider.
                    Please try a different date.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Reason for Visit */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief description of your visit reason"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information or special requests"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Book Appointment
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AppointmentBooking;