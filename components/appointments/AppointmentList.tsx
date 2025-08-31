'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentType, ProviderType, AppointmentTypeType } from '@/lib/db';
import { getAllAppointments, getAllProviders, getAllAppointmentTypes } from '@/lib/db-utils';

interface AppointmentWithDetails extends AppointmentType {
  provider?: ProviderType;
  appointmentType?: AppointmentTypeType;
}

interface AppointmentListProps {
  patientId?: string;
  onAppointmentSelect?: (appointment: AppointmentWithDetails) => void;
  showActions?: boolean;
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

const AppointmentList: React.FC<AppointmentListProps> = ({
  patientId,
  onAppointmentSelect,
  showActions = true
}) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadAppointments();
  }, [patientId]);

  // Debug logging to check appointment data
  useEffect(() => {
    console.log('AppointmentList - appointments:', appointments);
    console.log('AppointmentList - appointments length:', appointments.length);
    if (appointments.length > 0) {
      console.log('AppointmentList - first appointment:', appointments[0]);
      console.log('AppointmentList - first appointment startTime:', appointments[0].startTime);
      console.log('AppointmentList - first appointment startTime type:', typeof appointments[0].startTime);
      console.log('AppointmentList - startTime toString:', appointments[0].startTime?.toString());
      console.log('AppointmentList - startTime valueOf:', appointments[0].startTime?.valueOf());
      console.log('AppointmentList - new Date(startTime):', new Date(appointments[0].startTime));
      console.log('AppointmentList - isNaN check:', isNaN(new Date(appointments[0].startTime).getTime()));
    }
  }, [appointments]);

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
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">


      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-500">
              You don't have any appointments yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card 
              key={appointment.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                onAppointmentSelect ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={() => onAppointmentSelect?.(appointment)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg">
                        {appointment.appointmentType?.name || 'Appointment'}
                      </h3>
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{appointment.provider?.name || 'Unknown Provider'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime()) 
                            ? format(new Date(appointment.startTime), 'MMM dd, yyyy')
                            : 'Invalid Date'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {appointment.startTime && !isNaN(new Date(appointment.startTime).getTime()) && 
                           appointment.endTime && !isNaN(new Date(appointment.endTime).getTime())
                            ? `${format(new Date(appointment.startTime), 'h:mm a')} - ${format(new Date(appointment.endTime), 'h:mm a')}`
                            : 'Invalid Time'
                          }
                        </span>
                      </div>
                      
                      {appointment.provider?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{appointment.provider.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {appointment.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                  
                  {showActions && (
                    <div className="flex flex-col sm:flex-row gap-2">
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
                      {appointment.status === 'scheduled' && (
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;