import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import PatientLayout from '@/components/layout/PatientLayout';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';

// Dynamically import components that use browser APIs
const SharedDataDashboard = dynamic(
  () => import('@/components/web3/SharedDataDashboard'),
  { ssr: false }
);

export default function PatientDashboardPage() {
  const { data: session } = useSession();
  const { currentAccount, isConnected } = useMetaMask();
  const [patientSession, setPatientSession] = useState<any>(null);
  
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

  return (
    <PatientLayout>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Patient Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Welcome back, {userName}
        </p>
      
      <Tabs defaultValue="shared-data" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="shared-data">Shared Data</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medical-records">Medical Records</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shared-data" className="mt-0">
          <SharedDataDashboard ethereumAddress={ethereumAddress} />
        </TabsContent>
        
        <TabsContent value="appointments" className="mt-0">
          <div className="bg-muted p-8 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Appointments Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is under development. You'll be able to view and manage your appointments here.
            </p>
          </div>
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
  );
}
