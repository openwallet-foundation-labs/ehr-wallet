'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Tabs, Card, Text, Button, Alert, Title } from '@mantine/core';
import PatientLayout from '@/components/layout/PatientLayout';

// Temporarily use regular imports to debug dynamic import issue
import DataSharingForm from '@/components/web3/DataSharingForm';
import ShareDisplay from '@/components/web3/ShareDisplay';

// Force dynamic rendering to avoid build-time IPFS module loading
export const dynamic = 'force-dynamic';

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
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 40, paddingLeft: 20, paddingRight: 20 }}>
          <Title order={1}>Share Your Medical Data</Title>
          <Alert
            color="blue"
            mb="xl"
            style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}
          >
            You are accessing the data sharing feature without authentication. You can still share medical data anonymously.
          </Alert>

          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'form')} variant="outline">
            <Tabs.List grow mb="xl">
              <Tabs.Tab value="form">Select Data</Tabs.Tab>
              <Tabs.Tab value="share" disabled={!shareableLink}>Share Link</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="form">
              <DataSharingForm
                patientId={"anonymous"}
                onSuccess={handleShareSuccess}
              />
            </Tabs.Panel>

            <Tabs.Panel value="share">
              {shareableLink && accessId && (
                <>
                  <ShareDisplay
                    shareableLink={shareableLink}
                    accessId={accessId}
                  />
                  <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <Text size="sm" c="dimmed" mb="sm">
                      Your data has been shared successfully. You can bookmark this page or copy the link above.
                    </Text>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('form')}
                    >
                      Share More Data
                    </Button>
                  </div>
                </>
              )}
            </Tabs.Panel>
          </Tabs>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 40, paddingLeft: 20, paddingRight: 20 }}>
        <Title order={1}>Share Your Medical Data</Title>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'form')} variant="outline">
          <Tabs.List grow mb="xl">
            <Tabs.Tab value="form">Select Data</Tabs.Tab>
            <Tabs.Tab value="share" disabled={!shareableLink}>Share Link</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="form">
            <DataSharingForm
              patientId={session.user.id}
              onSuccess={handleShareSuccess}
            />
          </Tabs.Panel>

          <Tabs.Panel value="share">
            {shareableLink && accessId && (
              <>
                <ShareDisplay
                  shareableLink={shareableLink}
                  accessId={accessId}
                />
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Text size="sm" c="dimmed" mb="sm">
                    You will be redirected to the dashboard in a few seconds, or you can click the button below.
                  </Text>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/patient/dashboard?tab=shared-data&refresh=true')}
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </>
            )}
          </Tabs.Panel>
        </Tabs>
      </div>
    </PatientLayout>
  );
}
