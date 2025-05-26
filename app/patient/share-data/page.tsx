'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataSharingForm from '@/components/web3/DataSharingForm';
import ShareDisplay from '@/components/web3/ShareDisplay';

export default function ShareDataPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('form');
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [accessId, setAccessId] = useState<string | null>(null);

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

  const handleShareSuccess = (link: string, id: string) => {
    setShareableLink(link);
    setAccessId(id);
    setActiveTab('share');
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Share Your Medical Data</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="form">Select Data</TabsTrigger>
          <TabsTrigger value="share" disabled={!shareableLink}>Share Link</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="mt-0">
          <DataSharingForm 
            patientId={session.user.id} 
            onSuccess={handleShareSuccess} 
          />
        </TabsContent>
        
        <TabsContent value="share" className="mt-0">
          {shareableLink && accessId && (
            <ShareDisplay 
              shareableLink={shareableLink} 
              accessId={accessId} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
