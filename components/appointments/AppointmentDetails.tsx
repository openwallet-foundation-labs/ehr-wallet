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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
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
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'no_show':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleStatusUpdate = async (newStatus: string) => {
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
      await updateAppointment(appointment.id, { status: 'cancelled' });
      
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

      setAppointment(prev => prev ? { ...prev, status: 'cancelled' } : null);
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!appointment) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Appointment Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            The requested appointment could not be found.
          </p>
          {onClose && (
            <Button onClick={onClose}>Go Back</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const canCancel = appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const canConfirm = appointment.status === 'scheduled';
  const canComplete = appointment.status === 'confirmed';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Appointment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status and Type */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-semibold">
              {appointment.appointmentType?.name || 'Appointment'}
            </h2>
            <p className="text-gray-600">
              {appointment.reason && `Reason: ${appointment.reason}`}
            </p>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {getStatusText(appointment.status)}
          </Badge>
        </div>

        <Separator />

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-gray-600">
                {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime()) 
                ? format(new Date(appointment.startTime), 'EEEE, MMMM dd, yyyy')
                : 'Invalid Date'
              }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Time</p>
              <p className="text-gray-600">
                {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime()) 
                 ? format(new Date(appointment.startTime), 'h:mm a')
                 : 'Invalid Time'
               } - 
                 {appointment.endTime && !isNaN(new Date(appointment.endTime).getTime()) 
                 ? format(new Date(appointment.endTime), 'h:mm a')
                 : 'Invalid Time'
               }
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Provider Information */}
        {appointment.provider && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Healthcare Provider
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="font-medium">{appointment.provider.name}</p>
              <p className="text-gray-600">{appointment.provider.specialty}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {appointment.provider.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{appointment.provider.phone}</span>
                  </div>
                )}
                
                {appointment.provider.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{appointment.provider.email}</span>
                  </div>
                )}
              </div>
              
              {appointment.provider.address && (
                <div className="flex items-start gap-2 text-sm mt-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span>{appointment.provider.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patient Information (if showPatientInfo is true) */}
        {showPatientInfo && appointment.patient && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="font-medium">{appointment.patient.name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-sm">
                  <span className="text-gray-500">DOB: </span>
                  <span>{format(new Date(appointment.patient.dob), 'MMM dd, yyyy')}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Gender: </span>
                  <span className="capitalize">{appointment.patient.gender}</span>
                </div>
              </div>
              
              {appointment.patient.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{appointment.patient.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointment Type Details */}
        {appointment.appointmentType && (
          <div>
            <h3 className="font-semibold mb-3">Appointment Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-sm">
                  <span className="text-gray-500">Duration: </span>
                  <span>{appointment.appointmentType.duration} minutes</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Cost: </span>
                  <span>${appointment.appointmentType.price}</span>
                </div>
              </div>
              
              {appointment.appointmentType.description && (
                <p className="text-sm text-gray-600 mt-2">
                  {appointment.appointmentType.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {appointment.notes && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{appointment.notes}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {canConfirm && (
            <Button
              onClick={() => handleStatusUpdate('confirmed')}
              disabled={updating}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Appointment
            </Button>
          )}
          
          {canComplete && (
            <Button
              onClick={() => handleStatusUpdate('completed')}
              disabled={updating}
              variant="outline"
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          
          {canCancel && (
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={updating}
                  className="flex-1 sm:flex-none"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Are you sure you want to cancel this appointment? This action cannot be undone.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleCancelAppointment}
                      disabled={updating}
                      className="flex-1"
                    >
                      {updating ? 'Cancelling...' : 'Yes, Cancel'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(false)}
                      disabled={updating}
                      className="flex-1"
                    >
                      Keep Appointment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentDetails;