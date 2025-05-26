'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SharedDataDashboard from '@/components/web3/SharedDataDashboard';

export default function PatientDashboardPage() {
  const { data: session, status } = useSession();

  // Check if user is authenticated and has the PATIENT role
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    redirect('/login');
    return null;
  }

  // Only patients can access this page
  if (session.user.role !== 'PATIENT') {
    redirect('/dashboard');
    return null;
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Patient Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back, {session.user.name || 'Patient'}
      </p>
      
      <Tabs defaultValue="shared-data" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="shared-data">Shared Data</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medical-records">Medical Records</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shared-data" className="mt-0">
          <SharedDataDashboard ethereumAddress={session.user.ethereumAddress} />
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
  );
}
