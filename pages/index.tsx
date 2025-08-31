
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import PatientLayout from '@/components/layout/PatientLayout';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';
import AppleHealthConnect from '@/components/health/AppleHealthConnect';
import AppointmentsDashboard from '@/components/appointments/AppointmentsDashboard';
import Head from 'next/head';
import { initDatabase } from '@/lib/db';
import { seedOfflineDatabase } from '@/lib/seed-offline-db';

// Temporarily use regular import to debug dynamic import issue
import SharedDataDashboard from '@/components/web3/SharedDataDashboard';

export default function Home() {
  const { data: session } = useSession();
  const { currentAccount, isConnected } = useMetaMask();
  const [patientSession, setPatientSession] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const [dbInitializing, setDbInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Function to force refresh of child components
  const refreshDashboard = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);
  
  // Initialize the database and seed if needed
  useEffect(() => {
    async function initialize() {
      try {
        await initDatabase();
        await seedOfflineDatabase();
        setDbInitializing(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitError('Failed to initialize the offline database. Please reload the page.');
        setDbInitializing(false);
      }
    }
    
    initialize();
  }, []);
  
  // Get patient session from localStorage if using MetaMask
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPatientSession = localStorage.getItem('patientSession');
      if (storedPatientSession) {
        try {
          setPatientSession(JSON.parse(storedPatientSession));
        } catch (error) {
          console.error('Error parsing patient session:', error);
        }
      }
    }
  }, []);
  
  // Determine which session to use (next-auth or MetaMask)
  const userSession = session || patientSession;
  const userName = userSession?.user?.name || 'Patient';
  const ethereumAddress = userSession?.user?.ethereumAddress || currentAccount;
  
  // Handle URL query parameters for tab selection and refresh
  const [activeTab, setActiveTab] = useState('shared-data');
  
  // Handle URL query parameters for tab selection and refresh
  useEffect(() => {
    const { tab, refresh } = router.query;
    
    // Set active tab if specified in URL
    if (tab && typeof tab === 'string') {
      setActiveTab(tab);
    }
    
    // Force refresh if refresh=true in URL
    if (refresh === 'true') {
      console.log('Refresh triggered by URL parameter');
      refreshDashboard();
      
      // Remove the refresh parameter from URL to prevent repeated refreshes
      const newQuery = { ...router.query };
      delete newQuery.refresh;
      router.replace(
        {
          pathname: router.pathname,
          query: newQuery,
        },
        undefined,
        { shallow: true }
      );
    }
  }, [router.query, router.pathname, refreshDashboard]);
  
  // Note: Removed automatic refresh on route changes to prevent infinite loops
  // The dashboard will refresh only when explicitly triggered by URL parameters

  // Show loading state while database is initializing
  if (dbInitializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Initializing offline database...</h1>
            <p className="text-muted-foreground">Please wait while we set up your local database.</p>
          </div>
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-red-500">Database Error</h1>
            <p className="text-muted-foreground">{initError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>GlobalRad - Patient Portal</title>
        <meta name="description" content="Access your medical records, appointments, and health data" />
      </Head>
      <PatientLayout>
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-2">Patient Dashboard</h1>
          <p className="text-muted-foreground mb-8">
            Welcome back, {userName}
          </p>
        
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="shared-data">Shared Data</TabsTrigger>
              <TabsTrigger value="health-data">Health Data</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="medical-records">Medical Records</TabsTrigger>
            </TabsList>
            
            <TabsContent value="shared-data" className="mt-0">
              <SharedDataDashboard 
                key={`shared-data-${refreshKey}`} 
                ethereumAddress={ethereumAddress} 
              />
            </TabsContent>
            
            <TabsContent value="health-data" className="mt-0">
              <div className="space-y-6">
                <AppleHealthConnect 
                  onConnect={(success) => {
                    // Handle connection status
                    console.log('Apple Health connection status:', success);
                  }} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="appointments" className="mt-0">
              <AppointmentsDashboard 
                key={`appointments-${refreshKey}`}
                patientId={userSession?.user?.id || 'default-patient-id'}
              />
            </TabsContent>
            
            <TabsContent value="medical-records" className="mt-0">
              <div className="bg-muted p-8 rounded-lg text-center">
                <h3 className="text-lg font-medium mb-2">Medical Records Coming Soon</h3>
                <p className="text-muted-foreground">
                  This feature is under development. You'll be able to view your medical records here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PatientLayout>
    </>
  );
}
