
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { Tabs } from '@mantine/core';
import PatientLayout from '@/components/layout/PatientLayout';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';
import AppleHealthConnect from '@/components/health/AppleHealthConnect';
import AppointmentsDashboard from '@/components/appointments/AppointmentsDashboard';
import SharedDataDashboard from '@/components/web3/SharedDataDashboard';

export default function PatientDashboardPage() {
  const { data: session } = useSession();
  const { currentAccount } = useMetaMask();
  const [patientSession, setPatientSession] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const refreshDashboard = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPatientSession = localStorage.getItem('patientSession');
      if (storedPatientSession) {
        try {
          setPatientSession(JSON.parse(storedPatientSession));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  const userSession = session || patientSession;
  const userName = userSession?.user?.name || 'Patient';
  const ethereumAddress = userSession?.user?.ethereumAddress || currentAccount;

  const [activeTab, setActiveTab] = useState('shared-data');

  useEffect(() => {
    const { tab, refresh } = router.query;

    if (tab && typeof tab === 'string') {
      setActiveTab(tab);
    }

    if (refresh === 'true') {
      refreshDashboard();
      const newQuery = { ...router.query };
      delete newQuery.refresh;
      router.replace(
        { pathname: router.pathname, query: newQuery },
        undefined,
        { shallow: true }
      );
    }
  }, [router.query, router.pathname, refreshDashboard]);

  return (
    <PatientLayout>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Patient Dashboard</h1>
        <p style={{ color: 'var(--mantine-color-gray-6)', marginBottom: '2rem' }}>
          Welcome back, {userName}
        </p>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)}>
          <Tabs.List mb="md">
            <Tabs.Tab value="shared-data">Shared Data</Tabs.Tab>
            <Tabs.Tab value="health-data">Health Data</Tabs.Tab>
            <Tabs.Tab value="appointments">Appointments</Tabs.Tab>
            <Tabs.Tab value="medical-records">Medical Records</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="shared-data">
            <SharedDataDashboard
              key={`shared-data-${refreshKey}`}
              ethereumAddress={ethereumAddress}
            />
          </Tabs.Panel>

          <Tabs.Panel value="health-data">
            <AppleHealthConnect />
          </Tabs.Panel>

          <Tabs.Panel value="appointments">
            <AppointmentsDashboard
              key={`appointments-${refreshKey}`}
              patientId={userSession?.user?.id || 'default-patient-id'}
            />
          </Tabs.Panel>

          <Tabs.Panel value="medical-records">
            <div style={{ backgroundColor: 'var(--mantine-color-gray-1)', padding: '2rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>Medical Records Coming Soon</h3>
              <p style={{ color: 'var(--mantine-color-gray-6)' }}>
                This feature is under development. You&apos;ll be able to view your medical records here.
              </p>
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
    </PatientLayout>
  );
}
