'use client';

import React, { useState, useEffect } from 'react';
import { Plus, List, Filter, Search, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AppointmentList from './AppointmentList';
import AppointmentBooking from './AppointmentBooking';
import AppointmentDetails from './AppointmentDetails';
import { useAppointments, useAppointmentData } from '@/hooks/useAppointments';
import { format, isToday, isTomorrow, isThisWeek, isThisMonth } from 'date-fns';

interface AppointmentsDashboardProps {
  patientId: string;
}

const AppointmentsDashboard: React.FC<AppointmentsDashboardProps> = ({ patientId }) => {

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState<AppointmentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Custom hooks
  const { appointments, loading, refreshAppointments } = useAppointments(patientId, {
    ...filters,
    searchTerm: searchTerm || undefined
  });
  const { providers, appointmentTypes, loading: dataLoading } = useAppointmentData();

  // Filter appointments by status for quick stats
  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' || apt.status === 'confirmed'
  );
  const todayAppointments = appointments.filter(apt => 
    isToday(new Date(apt.startTime)) && (apt.status === 'scheduled' || apt.status === 'confirmed')
  );
  const pastAppointments = appointments.filter(apt => 
    apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no_show'
  );

  const handleAppointmentSelect = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setShowDetailsDialog(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingDialog(false);
    refreshAppointments();
  };

  const handleAppointmentUpdate = () => {
    refreshAppointments();
    setShowDetailsDialog(false);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getQuickFilterCount = (filterType: string) => {
    switch (filterType) {
      case 'today':
        return todayAppointments.length;
      case 'upcoming':
        return upcomingAppointments.length;
      case 'past':
        return pastAppointments.length;
      default:
        return 0;
    }
  };

  const applyQuickFilter = (filterType: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filterType) {
      case 'today':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFilters({ 
          dateFrom: today, 
          dateTo: tomorrow,
          status: undefined 
        });
        break;
      case 'upcoming':
        setFilters({ 
          dateFrom: today,
          status: undefined 
        });
        break;
      case 'past':
        setFilters({ 
          dateTo: today,
          status: undefined 
        });
        break;
      case 'all':
        clearFilters();
        break;
    }
  };

  if (loading && dataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Appointments</h2>
          <p className="text-muted-foreground">
            Manage your healthcare appointments
          </p>
        </div>
        
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
            </DialogHeader>
            <AppointmentBooking
              patientId={patientId}
              onSuccess={handleBookingSuccess}
              onCancel={() => setShowBookingDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => applyQuickFilter('today')}>          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{getQuickFilterCount('today')}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => applyQuickFilter('upcoming')}>          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{getQuickFilterCount('upcoming')}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => applyQuickFilter('past')}>          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Past</p>
                <p className="text-2xl font-bold">{getQuickFilterCount('past')}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => applyQuickFilter('all')}>          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{appointments.length}</p>
              </div>
              <List className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  status: value === 'all' ? undefined : value 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Provider Filter */}
            <Select
              value={filters.providerId || 'all'}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  providerId: value === 'all' ? undefined : value 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Appointment Type Filter */}
            <Select
              value={filters.appointmentTypeId || 'all'}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  appointmentTypeId: value === 'all' ? undefined : value 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Active Filters */}
          {(filters.status || filters.providerId || filters.appointmentTypeId || searchTerm) && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.status && (
                <Badge variant="secondary" className="capitalize">
                  {filters.status}
                </Badge>
              )}
              {filters.providerId && (
                <Badge variant="secondary">
                  {providers.find(p => p.id === filters.providerId)?.name}
                </Badge>
              )}
              {filters.appointmentTypeId && (
                <Badge variant="secondary">
                  {appointmentTypes.find(t => t.id === filters.appointmentTypeId)?.name}
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary">
                  Search: {searchTerm}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentList
            appointments={appointments}
            loading={loading}
            onAppointmentSelect={handleAppointmentSelect}
            onRefresh={refreshAppointments}
          />
        </CardContent>
      </Card>

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

export default AppointmentsDashboard;