'use client';

import React, { useState, useEffect } from 'react';
import { Plus, List, Filter, Search, Calendar } from 'lucide-react';
import { Paper, Title, Text, Card } from '@mantine/core';
import { Button } from '@mantine/core';
import { TextInput } from '@mantine/core';
import { Select } from '@mantine/core';
import { Modal } from '@mantine/core';
import { Badge } from '@mantine/core';
import { Skeleton } from '@mantine/core';
import AppointmentList from './AppointmentList';
import AppointmentBooking from './AppointmentBooking';
import AppointmentDetails from './AppointmentDetails';
import { useAppointments, useAppointmentData, AppointmentFilters } from '@/hooks/useAppointments';
import { format, isToday } from 'date-fns';

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
    apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'
  );
  const todayAppointments = appointments.filter(apt =>
    isToday(new Date(apt.startTime)) && (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED')
  );
  const pastAppointments = appointments.filter(apt =>
    apt.status === 'COMPLETED' || apt.status === 'CANCELLED' || apt.status === 'NO_SHOW'
  );

  const handleAppointmentSelect = (appointment: any) => {
    setSelectedAppointmentId(appointment.id);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Skeleton height={32} width={192} />
          <Skeleton height={40} width={128} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[...Array(3)].map((_, i) => (
            <Paper key={i} p="md" withBorder>
              <Skeleton height={16} width={96} mb={8} />
              <Skeleton height={32} width={64} />
            </Paper>
          ))}
        </div>
        <Skeleton height={384} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <Title order={2}>Appointments</Title>
          <Text c="dimmed">
            Manage your healthcare appointments
          </Text>
        </div>

        <Button
          leftSection={<Plus size={16} />}
          onClick={() => setShowBookingDialog(true)}
        >
          Book Appointment
        </Button>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Paper
          p="md"
          withBorder
          style={{ cursor: 'pointer' }}
          onClick={() => applyQuickFilter('today')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text size="sm" fw={500} c="dimmed">Today</Text>
              <Text size="xl" fw={700}>{getQuickFilterCount('today')}</Text>
            </div>
            <Calendar size={32} color="#3b82f6" />
          </div>
        </Paper>

        <Paper
          p="md"
          withBorder
          style={{ cursor: 'pointer' }}
          onClick={() => applyQuickFilter('upcoming')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text size="sm" fw={500} c="dimmed">Upcoming</Text>
              <Text size="xl" fw={700}>{getQuickFilterCount('upcoming')}</Text>
            </div>
            <Calendar size={32} color="#22c55e" />
          </div>
        </Paper>

        <Paper
          p="md"
          withBorder
          style={{ cursor: 'pointer' }}
          onClick={() => applyQuickFilter('past')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text size="sm" fw={500} c="dimmed">Past</Text>
              <Text size="xl" fw={700}>{getQuickFilterCount('past')}</Text>
            </div>
            <Calendar size={32} color="#6b7280" />
          </div>
        </Paper>

        <Paper
          p="md"
          withBorder
          style={{ cursor: 'pointer' }}
          onClick={() => applyQuickFilter('all')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text size="sm" fw={500} c="dimmed">Total</Text>
              <Text size="xl" fw={700}>{appointments.length}</Text>
            </div>
            <List size={32} color="#a855f7" />
          </div>
        </Paper>
      </div>

      {/* Filters and Search */}
      <Paper p="md" withBorder>
        <Title order={5} mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={20} />
          Filters
        </Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Search */}
          <TextInput
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftSection={<Search size={16} />}
          />

          {/* Status Filter */}
          <Select
            value={filters.status || 'all'}
            onChange={(value) =>
              setFilters(prev => ({
                ...prev,
                status: value === 'all' ? undefined : value as string
              }))
            }
            data={[
              { value: 'all', label: 'All Statuses' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'no_show', label: 'No Show' },
            ]}
            placeholder="All Statuses"
          />

          {/* Provider Filter */}
          <Select
            value={filters.providerId || 'all'}
            onChange={(value) =>
              setFilters(prev => ({
                ...prev,
                providerId: value === 'all' ? undefined : value as string
              }))
            }
            data={[
              { value: 'all', label: 'All Providers' },
              ...providers.map((provider) => ({
                value: provider.id,
                label: provider.name
              }))]
            }
            placeholder="All Providers"
          />

          {/* Appointment Type Filter */}
          <Select
            value={filters.appointmentTypeId || 'all'}
            onChange={(value) =>
              setFilters(prev => ({
                ...prev,
                appointmentTypeId: value === 'all' ? undefined : value as string
              }))
            }
            data={[
              { value: 'all', label: 'All Types' },
              ...appointmentTypes.map((type) => ({
                value: type.id,
                label: type.name
              }))]
            }
            placeholder="All Types"
          />
        </div>

        {/* Active Filters */}
        {(filters.status || filters.providerId || filters.appointmentTypeId || searchTerm) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <Text size="sm" c="dimmed">Active filters:</Text>
            {filters.status && (
              <Badge variant="light" color="gray">
                {filters.status}
              </Badge>
            )}
            {filters.providerId && (
              <Badge variant="light" color="gray">
                {providers.find(p => p.id === filters.providerId)?.name}
              </Badge>
            )}
            {filters.appointmentTypeId && (
              <Badge variant="light" color="gray">
                {appointmentTypes.find(t => t.id === filters.appointmentTypeId)?.name}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="light" color="gray">
                Search: {searchTerm}
              </Badge>
            )}
            <Button
              variant="subtle"
              size="xs"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </Paper>

      {/* Appointments List */}
      <Paper p="md" withBorder>
        <Title order={5} mb="md">Your Appointments</Title>
        <AppointmentList
          appointments={appointments}
          loading={loading}
          onAppointmentSelect={handleAppointmentSelect}
          onRefresh={refreshAppointments}
        />
      </Paper>

      {/* Appointment Details Modal */}
      <Modal
        opened={showBookingDialog}
        onClose={() => setShowBookingDialog(false)}
        title="Book New Appointment"
        size="lg"
        styles={{ body: { maxHeight: '90vh', overflowY: 'auto' } }}
      >
        <AppointmentBooking
          patientId={patientId}
          onBookingComplete={handleBookingSuccess}
          onCancel={() => setShowBookingDialog(false)}
        />
      </Modal>

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

export default AppointmentsDashboard;
