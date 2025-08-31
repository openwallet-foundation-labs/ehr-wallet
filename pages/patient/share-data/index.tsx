import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import PatientLayout from '@/components/layout/PatientLayout';

// Temporarily use regular imports to debug dynamic import issue
import DataSharingForm from '@/components/web3/DataSharingForm';
import ShareDisplay from '@/components/web3/ShareDisplay';

export default function ShareDataPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('form');
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [accessId, setAccessId] = useState<string | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);

  const handleShareSuccess = (link: string, id: string) => {
    setShareableLink(link);
    setAccessId(id);
    setActiveTab('share');
    
    // Start a timer to redirect back to dashboard after showing the share link
    const timer = window.setTimeout(() => {
      router.push('/patient/dashboard?tab=shared-data&refresh=true');
    }, 10000); // 10 seconds
    
    setRedirectTimer(timer);
  };
  
  // Clear the redirect timer when component unmounts
  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [redirectTimer]);

  // Allow anonymous access to share-data page
  const isAnonymousAccess = !session || !session.user;
  
  if (isAnonymousAccess) {
    return (
      <PatientLayout>
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-6">Share Your Medical Data</h1>
          <div className="p-4 border rounded-md bg-blue-50 text-blue-800 mb-6">
            You are accessing the data sharing feature without authentication. You can still share medical data anonymously.
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="form">Select Data</TabsTrigger>
              <TabsTrigger value="share" disabled={!shareableLink}>Share Link</TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="mt-0">
              <DataSharingForm 
                patientId={"anonymous"} 
                onSuccess={handleShareSuccess} 
              />
            </TabsContent>
            
            <TabsContent value="share" className="mt-0">
              {shareableLink && accessId && (
                <>
                  <ShareDisplay 
                    shareableLink={shareableLink} 
                    accessId={accessId} 
                  />
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Your data has been shared successfully. You can bookmark this page or copy the link above.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('form')}
                    >
                      Share More Data
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PatientLayout>
    );
  }

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
            <>
              <ShareDisplay 
                shareableLink={shareableLink} 
                accessId={accessId} 
              />
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  You will be redirected to the dashboard in a few seconds, or you can click the button below.  
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/patient/dashboard?tab=shared-data&refresh=true')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </PatientLayout>
  );
}
