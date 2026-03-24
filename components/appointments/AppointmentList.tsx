'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Phone, MapPin } from 'lucide-react';
import { Paper, Text } from '@mantine/core';
import { Badge } from '@mantine/core';
import { Button } from '@mantine/core';
import { Skeleton } from '@mantine/core';
import { AppointmentType, ProviderType, AppointmentTypeType } from '@/lib/db';
import { getAllAppointments, getAllProviders, getAllAppointmentTypes } from '@/lib/db-utils';

interface AppointmentWithDetails extends AppointmentType {
  provider?: ProviderType;
  appointmentType?: AppointmentTypeType;
}

interface AppointmentListProps {
  patientId?: string;
  appointments?: AppointmentWithDetails[];
  loading?: boolean;
  onAppointmentSelect?: (appointment: AppointmentWithDetails) => void;
  onRefresh?: () => void;
  showActions?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
    case 'confirmed':
      return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
    case 'cancelled':
      return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
    case 'completed':
      return { bg: '#f3f4f6', text: '#1f2937', border: '#e5e7eb' };
    case 'no_show':
      return { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' };
    default:
      return { bg: '#f3f4f6', text: '#1f2937', border: '#e5e7eb' };
  }
};

const getStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'Scheduled';
    case 'confirmed':
      return 'Confirmed';
    case 'cancelled':
      return 'Cancelled';
    case 'completed':
      return 'Completed';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
};

const AppointmentList: React.FC<AppointmentListProps> = ({
  patientId,
  appointments: propAppointments,
  loading: propLoading,
  onAppointmentSelect,
  showActions = true
}) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propAppointments !== undefined) {
      setAppointments(propAppointments);
    }
    if (propLoading !== undefined) {
      setLoading(propLoading);
    }
  }, [propAppointments, propLoading]);

  useEffect(() => {
    if (!propAppointments) {
      loadAppointments();
    }
  }, [patientId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const [appointmentsData, providersData, appointmentTypesData] = await Promise.all([
        getAllAppointments(),
        getAllProviders(),
        getAllAppointmentTypes()
      ]);

      // Filter appointments by patient if patientId is provided
      let filteredAppointments = appointmentsData;
      if (patientId) {
        filteredAppointments = appointmentsData.filter(apt => apt.patientId === patientId);
      }

      // Enrich appointments with provider and appointment type details
      const enrichedAppointments = filteredAppointments.map(appointment => {
        const provider = providersData.find(p => p.id === appointment.providerId);
        const appointmentType = appointmentTypesData.find(at => at.id === appointment.appointmentTypeId);
        return {
          ...appointment,
          provider,
          appointmentType
        };
      });

      // Sort by date (newest first)
      enrichedAppointments.sort((a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      setAppointments(enrichedAppointments);
    } catch {
      // Ignore errors - component will show empty state
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <Skeleton height={40} style={{ flex: 1 }} />
          <Skeleton height={40} width={128} />
          <Skeleton height={40} width={128} />
          <Skeleton height={40} width={128} />
        </div>
        {[...Array(3)].map((_, i) => (
          <Paper key={i} p="md" withBorder>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Skeleton height={16} width="75%" />
              <Skeleton height={16} width="50%" />
              <Skeleton height={16} width="66%" />
            </div>
          </Paper>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
          <Calendar size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
          <Text size="lg" fw={500} mb={8}>
            No appointments found
          </Text>
          <Text c="dimmed">
            You don't have any appointments yet.
          </Text>
        </Paper>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {appointments.map((appointment) => {
            const statusStyles = getStatusColor(appointment.status);
            return (
              <Paper
                key={appointment.id}
                p="md"
                withBorder
                style={{
                  transition: 'all 200ms',
                  cursor: onAppointmentSelect ? 'pointer' : 'default',
                }}
                onClick={() => onAppointmentSelect?.(appointment)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <Text fw={600} size="lg">
                      {appointment.appointmentType?.name || 'Appointment'}
                    </Text>
                    <Badge
                      style={{
                        backgroundColor: statusStyles.bg,
                        color: statusStyles.text,
                        borderColor: statusStyles.border,
                      }}
                    >
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '14px', color: '#4b5563' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} />
                      <span>{appointment.provider?.name || 'Unknown Provider'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} />
                      <span>
                        {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime())
                          ? format(new Date(appointment.startTime), 'MMM dd, yyyy')
                          : 'Invalid Date'
                        }
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} />
                      <span>
                        {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime()) &&
                          appointment.endTime && !isNaN(new Date(appointment.endTime).getTime())
                          ? `${format(new Date(appointment.startTime), 'h:mm a')} - ${format(new Date(appointment.endTime), 'h:mm a')}`
                          : 'Invalid Time'
                        }
                      </span>
                    </div>

                    {appointment.provider?.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} />
                        <span>{appointment.provider.phone}</span>
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <Text size="sm" c="dimmed" style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px' }}>
                      {appointment.notes}
                    </Text>
                  )}

                  {showActions && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentSelect?.(appointment);
                        }}
                      >
                        View Details
                      </Button>
                      {appointment.status === 'SCHEDULED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement reschedule functionality
                          }}
                        >
                          Reschedule
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Paper>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
