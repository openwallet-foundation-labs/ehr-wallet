'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Paper, Title, Text, Divider } from '@mantine/core';
import { Badge } from '@mantine/core';
import { Button } from '@mantine/core';
import { Modal } from '@mantine/core';
import { Alert } from '@mantine/core';
import { Skeleton } from '@mantine/core';
import { toast } from 'sonner';
import { AppointmentType, ProviderType, AppointmentTypeType, PatientType } from '@/lib/db';
import {
  getAppointmentById,
  getProviderById,
  getAllAppointmentTypes,
  getPatientById,
  updateAppointment,
  deleteAppointment,
  updateTimeSlot,
  getAllTimeSlots
} from '@/lib/db-utils';

interface AppointmentDetailsProps {
  appointmentId: string;
  onClose?: () => void;
  onUpdate?: () => void;
  showPatientInfo?: boolean;
}

interface AppointmentWithDetails extends AppointmentType {
  provider?: ProviderType;
  appointmentType?: AppointmentTypeType;
  patient?: PatientType;
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

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointmentId,
  onClose,
  onUpdate,
  showPatientInfo = false
}) => {
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    loadAppointmentDetails();
  }, [appointmentId]);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);

      const appointmentData = await getAppointmentById(appointmentId);
      if (!appointmentData) {
        toast.error('Appointment not found');
        return;
      }

      // Load related data
      const [provider, appointmentTypes, patient] = await Promise.all([
        getProviderById(appointmentData.providerId),
        getAllAppointmentTypes(),
        showPatientInfo ? getPatientById(appointmentData.patientId) : null
      ]);

      const appointmentType = appointmentTypes.find(at => at.id === appointmentData.appointmentTypeId);

      setAppointment({
        ...appointmentData,
        provider,
        appointmentType,
        patient: patient || undefined
      });
    } catch (error) {
      console.error('Error loading appointment details:', error);
      toast.error('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW') => {
    if (!appointment) return;

    try {
      setUpdating(true);
      await updateAppointment(appointment.id, { status: newStatus });

      setAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Appointment ${newStatus.toLowerCase()} successfully`);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;

    try {
      setUpdating(true);

      // Update appointment status to cancelled
      await updateAppointment(appointment.id, { status: 'CANCELLED' });

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

      setAppointment(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      toast.success('Appointment cancelled successfully');
      setShowCancelDialog(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Paper p="md" withBorder>
        <Skeleton height={24} width={192} mb="md" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton height={16} width={96} />
              <Skeleton height={16} width="100%" />
            </div>
          ))}
        </div>
      </Paper>
    );
  }

  if (!appointment) {
    return (
      <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
        <Title order={3} mb={8}>
          Appointment Not Found
        </Title>
        <Text c="dimmed" mb={16}>
          The requested appointment could not be found.
        </Text>
        {onClose && (
          <Button onClick={onClose}>Go Back</Button>
        )}
      </Paper>
    );
  }

  const canCancel = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED';
  const canConfirm = appointment.status === 'SCHEDULED';
  const canComplete = appointment.status === 'CONFIRMED';
  const statusStyles = getStatusColor(appointment.status);

  return (
    <Paper p="md" withBorder>
      <Title order={5} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={20} />
        Appointment Details
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Status and Type */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <Title order={4}>
              {appointment.appointmentType?.name || 'Appointment'}
            </Title>
            <Text c="dimmed">
              {appointment.notes && `Reason: ${appointment.notes}`}
            </Text>
          </div>
          <Badge
            size="lg"
            style={{
              backgroundColor: statusStyles.bg,
              color: statusStyles.text,
              borderColor: statusStyles.border,
            }}
          >
            {getStatusText(appointment.status)}
          </Badge>
        </div>

        <Divider />

        {/* Date and Time */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={20} color="#6b7280" />
            <div>
              <Text fw={500}>Date</Text>
              <Text c="dimmed">
                {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime())
                  ? format(new Date(appointment.startTime), 'EEEE, MMMM dd, yyyy')
                  : 'Invalid Date'
                }
              </Text>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="#6b7280" />
            <div>
              <Text fw={500}>Time</Text>
              <Text c="dimmed">
                {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime())
                  ? format(new Date(appointment.startTime), 'h:mm a')
                  : 'Invalid Time'
                } -
                {appointment.endTime && !isNaN(new Date(appointment.endTime).getTime())
                  ? format(new Date(appointment.endTime), 'h:mm a')
                  : 'Invalid Time'
                }
              </Text>
            </div>
          </div>
        </div>

        <Divider />

        {/* Provider Information */}
        {appointment.provider && (
          <div>
            <Title order={6} mb="sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} />
              Healthcare Provider
            </Title>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text fw={500}>{appointment.provider.name}</Text>
              <Text c="dimmed">{appointment.provider.specialty}</Text>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginTop: '12px' }}>
                {appointment.provider.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <Phone size={16} color="#6b7280" />
                    <span>{appointment.provider.phone}</span>
                  </div>
                )}

                {appointment.provider.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <Mail size={16} color="#6b7280" />
                    <span>{appointment.provider.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patient Information (if showPatientInfo is true) */}
        {showPatientInfo && appointment.patient && (
          <div>
            <Title order={6} mb="sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} />
              Patient Information
            </Title>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text fw={500}>{appointment.patient.name}</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                <div style={{ fontSize: '14px' }}>
                  <Text component="span" c="dimmed">DOB: </Text>
                  <Text component="span">{format(new Date(appointment.patient.dob), 'MMM dd, yyyy')}</Text>
                </div>
                <div style={{ fontSize: '14px' }}>
                  <Text component="span" c="dimmed">Gender: </Text>
                  <Text component="span" style={{ textTransform: 'capitalize' }}>{appointment.patient.gender}</Text>
                </div>
              </div>

              {appointment.patient.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <Phone size={16} color="#6b7280" />
                  <span>{appointment.patient.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointment Type Details */}
        {appointment.appointmentType && (
          <div>
            <Title order={6} mb="sm">Appointment Details</Title>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                <div style={{ fontSize: '14px' }}>
                  <Text component="span" c="dimmed">Duration: </Text>
                  <Text component="span">{appointment.appointmentType.duration} minutes</Text>
                </div>
                <div style={{ fontSize: '14px' }}>
                  <Text component="span" c="dimmed">Cost: </Text>
                  <Text component="span">Contact for pricing</Text>
                </div>
              </div>

              {appointment.appointmentType.description && (
                <Text size="sm" c="dimmed" mt={8}>
                  {appointment.appointmentType.description}
                </Text>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {appointment.notes && (
          <div>
            <Title order={6} mb="sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} />
              Notes
            </Title>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
              <Text c="dimmed">{appointment.notes}</Text>
            </div>
          </div>
        )}

        <Divider />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canConfirm && (
            <Button
              onClick={() => handleStatusUpdate('CONFIRMED')}
              disabled={updating}
              style={{ flex: 1 }}
              leftSection={<CheckCircle size={16} />}
            >
              Confirm Appointment
            </Button>
          )}

          {canComplete && (
            <Button
              onClick={() => handleStatusUpdate('COMPLETED')}
              disabled={updating}
              variant="outline"
              style={{ flex: 1 }}
              leftSection={<CheckCircle size={16} />}
            >
              Mark Complete
            </Button>
          )}

          {canCancel && (
            <>
              <Button
                color="red"
                disabled={updating}
                style={{ flex: 1 }}
                leftSection={<X size={16} />}
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel
              </Button>

              <Modal
                opened={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                title="Cancel Appointment"
              >
                <Alert color="red" mb="md">
                  <AlertTriangle size={16} style={{ marginRight: '8px' }} />
                  Are you sure you want to cancel this appointment? This action cannot be undone.
                </Alert>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    color="red"
                    onClick={handleCancelAppointment}
                    disabled={updating}
                    style={{ flex: 1 }}
                  >
                    {updating ? 'Cancelling...' : 'Yes, Cancel'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(false)}
                    disabled={updating}
                    style={{ flex: 1 }}
                  >
                    Keep Appointment
                  </Button>
                </div>
              </Modal>
            </>
          )}
        </div>
      </div>
    </Paper>
  );
};

export default AppointmentDetails;
