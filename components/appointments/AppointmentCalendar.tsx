'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentWithDetails } from '@/hooks/useAppointments';
import AppointmentDetails from './AppointmentDetails';

interface AppointmentCalendarProps {
  patientId: string;
  onAppointmentSelect?: (appointmentId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-500';
    case 'confirmed':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    case 'completed':
      return 'bg-gray-500';
    case 'no_show':
      return 'bg-orange-500';
    default:
      return 'bg-gray-400';
  }
};

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  patientId,
  onAppointmentSelect
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Debug logging
  console.log('AppointmentCalendar currentDate:', currentDate);
  console.log('AppointmentCalendar currentDate string:', currentDate.toString());
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Get appointments for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const { appointments, loading, refreshAppointments } = useAppointments(patientId, {
    dateFrom: monthStart,
    dateTo: monthEnd
  });

  // Debug logging for calendar
  console.log('AppointmentCalendar - loading:', loading);
  console.log('AppointmentCalendar - appointments:', appointments);
  console.log('AppointmentCalendar - appointments length:', appointments.length);
  console.log('AppointmentCalendar - monthStart:', monthStart);
  console.log('AppointmentCalendar - monthEnd:', monthEnd);

  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const dateKey = appointment.startTime && !isNaN(new Date(appointment.startTime).getTime()) 
      ? format(new Date(appointment.startTime), 'yyyy-MM-dd')
      : 'invalid-date';
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, AppointmentWithDetails[]>);

  // Get appointments for selected date
  const selectedDateAppointments = selectedDate 
    ? appointmentsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setShowDetailsDialog(true);
    onAppointmentSelect?.(appointmentId);
  };

  const handleAppointmentUpdate = () => {
    refreshAppointments();
    setShowDetailsDialog(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map(date => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const dayAppointments = appointmentsByDate[dateKey] || [];
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isTodayDate = isToday(date);

                  return (
                    <div
                      key={dateKey}
                      className={`
                        min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors
                        ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-accent'}
                        ${isTodayDate ? 'bg-blue-50 border-blue-200' : 'border-border'}
                      `}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${isTodayDate ? 'text-blue-600' : 'text-foreground'}
                        ${isSelected ? 'text-primary' : ''}
                      `}>
                        {format(date, 'd')}
                      </div>
                      
                      {/* Appointment indicators */}
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map((appointment, index) => (
                          <div
                            key={appointment.id}
                            className={`
                              text-xs p-1 rounded text-white truncate cursor-pointer
                              ${getStatusColor(appointment.status)}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(appointment.id);
                            }}
                            title={`${appointment.startTime && !isNaN(new Date(appointment.startTime).getTime()) 
                ? format(new Date(appointment.startTime), 'h:mm a') 
                : 'Invalid Time'} - ${appointment.appointmentType?.name || 'Appointment'}`}
                          >
                            {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime()) 
                  ? format(new Date(appointment.startTime), 'h:mm a')
                  : 'Invalid Time'
                }
                          </div>
                        ))}
                        
                        {dayAppointments.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayAppointments.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM dd') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDateAppointments.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {selectedDateAppointments.map(appointment => (
                        <div
                          key={appointment.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => handleAppointmentClick(appointment.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getStatusColor(appointment.status).replace('bg-', 'bg-') + ' text-white'}>
                              {appointment.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime()) 
                      ? format(new Date(appointment.startTime), 'h:mm a')
                      : 'Invalid Time'
                    }
                            </span>
                          </div>
                          
                          <h4 className="font-medium mb-1">
                            {appointment.appointmentType?.name || 'Appointment'}
                          </h4>
                          
                          {appointment.provider && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {appointment.provider.name}
                            </p>
                          )}
                          
                          {appointment.reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {appointment.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No appointments on this date
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Click on a date to view appointments
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span className="text-sm">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-sm">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-500"></div>
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-sm">Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-500"></div>
                  <span className="text-sm">No Show</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAppointmentId && (
            <AppointmentDetails
              appointmentId={selectedAppointmentId}
              onClose={() => setShowDetailsDialog(false)}
              onUpdate={handleAppointmentUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentCalendar;