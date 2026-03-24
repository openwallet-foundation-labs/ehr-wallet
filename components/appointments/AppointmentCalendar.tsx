'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { Paper, Title, Text, Card } from '@mantine/core';
import { Button } from '@mantine/core';
import { Badge } from '@mantine/core';
import { Skeleton } from '@mantine/core';
import { Modal } from '@mantine/core';
import { ScrollArea } from '@mantine/core';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentWithDetails } from '@/hooks/useAppointments';
import AppointmentDetails from './AppointmentDetails';

interface AppointmentCalendarProps {
  patientId?: string;
  onAppointmentSelect?: (appointmentId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'blue';
    case 'confirmed':
      return 'green';
    case 'cancelled':
      return 'red';
    case 'completed':
      return 'gray';
    case 'no_show':
      return 'orange';
    default:
      return 'gray';
  }
};

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  patientId,
  onAppointmentSelect
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Get appointments for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { appointments, loading, refreshAppointments } = useAppointments(patientId, {
    dateFrom: monthStart,
    dateTo: monthEnd
  });

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Skeleton height={32} width={192} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton height={32} width={32} />
            <Skeleton height={32} width={32} />
          </div>
        </div>
        <Skeleton height={384} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title order={3} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={20} />
          {format(currentDate, 'MMMM yyyy')}
        </Title>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
            leftSection={<ChevronLeft size={16} />}
          >
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            leftSection={<ChevronRight size={16} />}
          >
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Calendar Grid */}
        <Paper p="md" withBorder>
          {/* Days of week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--mantine-color-dimmed)' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {daysInMonth.map(date => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDate[dateKey] || [];
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={dateKey}
                  style={{
                    minHeight: '80px',
                    padding: '4px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--mantine-color-blue-6)' : '1px solid var(--mantine-color-gray-3)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : isTodayDate ? '#eff6ff' : 'transparent',
                  }}
                  onClick={() => handleDateClick(date)}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '4px',
                    color: isTodayDate ? '#2563eb' : isSelected ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-9)'
                  }}>
                    {format(date, 'd')}
                  </div>

                  {/* Appointment indicators */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayAppointments.slice(0, 2).map((appointment) => (
                      <div
                        key={appointment.id}
                        style={{
                          fontSize: '10px',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          color: 'white',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                          backgroundColor: getStatusColor(appointment.status) === 'blue' ? '#3b82f6' :
                            getStatusColor(appointment.status) === 'green' ? '#22c55e' :
                            getStatusColor(appointment.status) === 'red' ? '#ef4444' :
                            getStatusColor(appointment.status) === 'orange' ? '#f97316' : '#6b7280'
                        }}
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
                      <div style={{ fontSize: '10px', color: 'var(--mantine-color-dimmed)', textAlign: 'center' }}>
                        +{dayAppointments.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Paper>

        {/* Selected Date Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Paper p="md" withBorder>
            <Title order={5} mb="md">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM dd') : 'Select a date'}
            </Title>
            {selectedDate ? (
              selectedDateAppointments.length > 0 ? (
                <ScrollArea h={400}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedDateAppointments.map(appointment => (
                      <div
                        key={appointment.id}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid var(--mantine-color-gray-3)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleAppointmentClick(appointment.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <Badge color={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime())
                      ? format(new Date(appointment.startTime), 'h:mm a')
                      : 'Invalid Time'
                    }
                          </Text>
                        </div>

                        <Text fw={500} mb={4}>
                          {appointment.appointmentType?.name || 'Appointment'}
                        </Text>

                        {appointment.provider && (
                          <Text size="sm" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} />
                            {appointment.provider.name}
                          </Text>
                        )}

                        {appointment.notes && (
                          <Text size="sm" c="dimmed" mt={4}>
                            {appointment.notes}
                          </Text>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <CalendarIcon size={48} style={{ margin: '0 auto 16px', color: 'var(--mantine-color-dimmed)' }} />
                  <Text c="dimmed">
                    No appointments on this date
                  </Text>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <CalendarIcon size={48} style={{ margin: '0 auto 16px', color: 'var(--mantine-color-dimmed)' }} />
                <Text c="dimmed">
                  Click on a date to view appointments
                </Text>
              </div>
            )}
          </Paper>

          {/* Legend */}
          <Paper p="md" withBorder>
            <Title order={6} mb="sm">Status Legend</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                <Text size="sm">Scheduled</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                <Text size="sm">Confirmed</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6b7280' }}></div>
                <Text size="sm">Completed</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                <Text size="sm">Cancelled</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
                <Text size="sm">No Show</Text>
              </div>
            </div>
          </Paper>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <Modal
        opened={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        title="Appointment Details"
        size="lg"
        styles={{ body: { maxHeight: '90vh', overflowY: 'auto' } }}
      >
        {selectedAppointmentId && (
          <AppointmentDetails
            appointmentId={selectedAppointmentId}
            onClose={() => setShowDetailsDialog(false)}
            onUpdate={handleAppointmentUpdate}
          />
        )}
      </Modal>
    </div>
  );
};

export default AppointmentCalendar;
