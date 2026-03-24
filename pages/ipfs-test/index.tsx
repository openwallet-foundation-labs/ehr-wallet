'use client';

import { useState } from 'react';
import { PinataUploader } from '@/components/web3/PinataUploader';
import { Card, CardSection, Text, Title, TextInput, Button, Tabs, Alert } from '@mantine/core';
import { AlertCircle, CheckCircle, Search, Loader2 } from 'lucide-react';
import Head from 'next/head';

// Simple inline spinner component since we don't have access to the UI spinner
const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={`animate-spin ${className || ''}`} style={{ animation: 'spin 1s linear infinite' }} />
);

export default function IpfsTestPage() {
  const [cid, setCid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnostic = async () => {
    if (!cid.trim()) {
      setError('Please enter a CID to check');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call the diagnostic endpoint
      const response = await fetch(`/api/ipfs/pinata-diagnostic?cid=${encodeURIComponent(cid.trim())}`);
      const data = await response.json();

      setResult(data);

      if (data.status === 'error') {
        setError(data.message || 'An error occurred during the diagnostic check');
      }
    } catch (err: any) {
      console.error('Diagnostic error:', err);
      setError(err.message || 'An error occurred during the diagnostic check');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentFetch = async () => {
    if (!cid.trim()) {
      setError('Please enter a CID to fetch');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call the IPFS API endpoint
      const response = await fetch(`/api/ipfs?cid=${encodeURIComponent(cid.trim())}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Try to parse as JSON first
      try {
        const jsonData = await response.json();
        setResult({
          status: 'success',
          message: 'Content retrieved successfully',
          data: jsonData,
          contentType: 'application/json'
        });
      } catch (jsonError) {
        // If not JSON, get as text
        const textData = await response.text();
        setResult({
          status: 'success',
          message: 'Content retrieved successfully (not JSON)',
          data: textData,
          contentType: 'text/plain'
        });
      }
    } catch (err: any) {
      console.error('Content fetch error:', err);
      setError(err.message || 'An error occurred while fetching the content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>IPFS with Pinata Test Page - GlobalRad</title>
        <meta name="description" content="Test IPFS and Pinata integration" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>

      <div className="container mx-auto py-8 space-y-8">
        <Title order={1}>IPFS with Pinata Test Page</Title>
        <Text c="dimmed">
          Use this page to test the Pinata integration with IPFS. You can upload files,
          retrieve content, and run diagnostics on CIDs.
        </Text>

        <Tabs defaultValue="upload" className="w-full">
          <Tabs.List>
            <Tabs.Tab value="upload">Upload</Tabs.Tab>
            <Tabs.Tab value="retrieve">Retrieve Content</Tabs.Tab>
            <Tabs.Tab value="diagnostic">Diagnostic</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="upload" pt="md">
            <PinataUploader />
          </Tabs.Panel>

          <Tabs.Panel value="retrieve" pt="md">
            <Card shadow="md" padding="lg" radius="md" withBorder>
              <CardSection p="md" withBorder>
                <Title order={3}>Retrieve Content from IPFS</Title>
                <Text size="sm" c="dimmed">
                  Enter a CID to retrieve content from IPFS
                </Text>
              </CardSection>
              <CardSection p="md">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <TextInput
                      placeholder="Enter CID"
                      value={cid}
                      onChange={(e) => setCid(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Button onClick={handleContentFetch} loading={isLoading} leftSection={!isLoading ? <Search size={16} /> : undefined}>
                      Fetch
                    </Button>
                  </div>

                  {error && (
                    <Alert icon={<AlertCircle size={16} />} title="Error" color="red">
                      {error}
                    </Alert>
                  )}

                  {result && result.status === 'success' && (
                    <Alert icon={<CheckCircle size={16} />} title="Content Retrieved" color="green" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}>
                      <div>
                        <p><strong>Content Type:</strong> {result.contentType}</p>
                        <div className="mt-2 p-4 rounded-md" style={{ backgroundColor: '#f3f4f6', overflow: 'auto', maxHeight: '24rem' }}>
                          <pre style={{ fontSize: '0.75rem' }}>
                            {typeof result.data === 'object'
                              ? JSON.stringify(result.data, null, 2)
                              : result.data}
                          </pre>
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>
              </CardSection>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="diagnostic" pt="md">
            <Card shadow="md" padding="lg" radius="md" withBorder>
              <CardSection p="md" withBorder>
                <Title order={3}>IPFS Diagnostic</Title>
                <Text size="sm" c="dimmed">
                  Check the status of a CID on Pinata and IPFS
                </Text>
              </CardSection>
              <CardSection p="md">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <TextInput
                      placeholder="Enter CID"
                      value={cid}
                      onChange={(e) => setCid(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Button onClick={handleDiagnostic} loading={isLoading} leftSection={!isLoading ? <Search size={16} /> : undefined}>
                      Check
                    </Button>
                  </div>

                  {error && (
                    <Alert icon={<AlertCircle size={16} />} title="Error" color="red">
                      {error}
                    </Alert>
                  )}

                  {result && (
                    <div className="p-4 rounded-md" style={{ backgroundColor: '#f3f4f6', overflow: 'auto', maxHeight: '24rem' }}>
                      <pre style={{ fontSize: '0.75rem' }}>
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardSection>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </div>
    </>
  );
}
