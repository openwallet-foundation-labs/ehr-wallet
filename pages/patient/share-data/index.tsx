import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import PatientLayout from '@/components/layout/PatientLayout';

// Dynamically import components that use browser APIs
const DataSharingForm = dynamic(
  () => import('@/components/web3/DataSharingForm'),
  { ssr: false }
);

const ShareDisplay = dynamic(
  () => import('@/components/web3/ShareDisplay'),
  { ssr: false }
);

export default function ShareDataPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('form');
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [accessId, setAccessId] = useState<string | null>(null);

  const handleShareSuccess = (link: string, id: string) => {
    setShareableLink(link);
    setAccessId(id);
    setActiveTab('share');
  };

  return (
    <PatientLayout>
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
    </PatientLayout>
  );
}
