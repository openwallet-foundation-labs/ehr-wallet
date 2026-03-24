
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { Tabs } from '@mantine/core';
import PatientLayout from '@/components/layout/PatientLayout';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';
import AppleHealthConnect from '@/components/health/AppleHealthConnect';
import AppointmentsDashboard from '@/components/appointments/AppointmentsDashboard';
import SharedDataDashboard from '@/components/web3/SharedDataDashboard';
import { initDatabase } from '@/lib/db';
import { seedOfflineDatabase } from '@/lib/seed-offline-db';
import { Center, Loader, Text, Stack, Button, Paper, Title, Group } from '@mantine/core';
import { Share2, Heart, Calendar, FileText } from 'lucide-react';

export default function Home() {
  const { data: session } = useSession();
  const { currentAccount } = useMetaMask();
  const [patientSession, setPatientSession] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const [dbInitializing, setDbInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const refreshDashboard = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        await initDatabase();
        await seedOfflineDatabase();
        setDbInitializing(false);
      } catch {
        setInitError('Failed to initialize the offline database. Please reload the page.');
        setDbInitializing(false);
      }
    }
    initialize();
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

  if (dbInitializing) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="lg" fw={500}>Initializing...</Text>
          <Text c="dimmed">Please wait while we set up your local database.</Text>
        </Stack>
      </Center>
    );
  }

  if (initError) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Text size="xl" c="red" fw={600}>Database Error</Text>
          <Text c="dimmed">{initError}</Text>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <PatientLayout>
      <Stack gap="xl" py="xl">
        <div>
          <Title order={1}>Patient Dashboard</Title>
          <Text c="dimmed">Welcome back, {userName}</Text>
        </div>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'shared-data')}>
          <Tabs.List grow>
            <Tabs.Tab value="shared-data" leftSection={<Share2 size={18} />}>Shared Data</Tabs.Tab>
            <Tabs.Tab value="health-data" leftSection={<Heart size={18} />}>Health Data</Tabs.Tab>
            <Tabs.Tab value="appointments" leftSection={<Calendar size={18} />}>Appointments</Tabs.Tab>
            <Tabs.Tab value="medical-records" leftSection={<FileText size={18} />}>Medical Records</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="shared-data" pt="md">
            <SharedDataDashboard
              key={`shared-data-${refreshKey}`}
              ethereumAddress={ethereumAddress}
            />
          </Tabs.Panel>

          <Tabs.Panel value="health-data" pt="md">
            <AppleHealthConnect />
          </Tabs.Panel>

          <Tabs.Panel value="appointments" pt="md">
            <AppointmentsDashboard
              key={`appointments-${refreshKey}`}
              patientId={userSession?.user?.id || 'default-patient-id'}
            />
          </Tabs.Panel>

          <Tabs.Panel value="medical-records" pt="md">
            <Paper p="xl" bg="gray.0" radius="md">
              <Stack align="center" gap="sm">
                <Title order={3}>Medical Records Coming Soon</Title>
                <Text c="dimmed">
                  This feature is under development. You&apos;ll be able to view your medical records here.
                </Text>
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </PatientLayout>
  );
}
