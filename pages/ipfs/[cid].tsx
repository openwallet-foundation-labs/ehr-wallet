'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getFromIpfs, decryptData } from '@/lib/web3/ipfs';
import { Button, Card, CardSection, TextInput, Text, Title, Modal, Alert, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Loader2, FileText, Download, Lock, Eye } from 'lucide-react';

// Force dynamic rendering to avoid build-time IPFS module loading
export const dynamic = 'force-dynamic';

export default function IpfsViewerPage() {
  const router = useRouter();
  const { cid } = router.query;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    if (!cid || typeof cid !== 'string') return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedData = await getFromIpfs(cid);

        // Check if the data is encrypted
        if (typeof fetchedData === 'string' && fetchedData.startsWith('eyJ')) {
          setIsEncrypted(true);
          setShowPasswordDialog(true);
        } else {
          setData(fetchedData);
        }
      } catch (err: any) {
        console.error('Error fetching IPFS data:', err);
        setError(err.message || 'Failed to fetch data from IPFS');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cid]);

  const handleDecrypt = async () => {
    if (!cid || typeof cid !== 'string') return;
    setDecryptError(null);

    try {
      const encryptedData = await getFromIpfs(cid);
      const decrypted = await decryptData(encryptedData, password);
      setData(decrypted);
      setShowPasswordDialog(false);
    } catch (err: any) {
      console.error('Error decrypting data:', err);
      setDecryptError(err.message || 'Failed to decrypt data');
    }
  };

  const renderDocumentPreview = (file: any) => {
    if (!file) return null;

    const isImage = file.type?.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (isImage) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src={file.content}
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '24rem', objectFit: 'contain', borderRadius: '6px', marginBottom: '0.5rem' }}
          />
          <Text size="sm" c="dimmed">{file.name}</Text>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--mantine-color-gray-1)', padding: '2rem', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FileText size={64} color="#ef4444" style={{ marginBottom: '0.5rem' }} />
            <Text size="sm" fw={500}>{file.name}</Text>
            <Text size="xs" c="dimmed">PDF Document</Text>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(file.content, '_blank')}
            mt="sm"
            leftSection={<Eye size={16} />}
          >
            View PDF
          </Button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ backgroundColor: 'var(--mantine-color-gray-1)', padding: '2rem', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FileText size={64} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
          <Text size="sm" fw={500}>{file.name}</Text>
          <Text size="xs" c="dimmed">{file.type || 'Document'}</Text>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Create a download link for the file
            const link = document.createElement('a');
            link.href = file.content;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          mt="sm"
          leftSection={<Download size={16} />}
        >
          Download
        </Button>
      </div>
    );
  };

  const renderContent = () => {
    if (!data) return null;

    // Check if this is document data
    if (data.files && Array.isArray(data.files)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'var(--mantine-color-gray-1)', padding: '1rem', borderRadius: '6px' }}>
            <Text size="sm" fw={500} mb="xs">Shared by</Text>
            <Text size="xs" c="dimmed">{data.createdBy || 'Unknown'}</Text>
            <Text size="xs" c="dimmed">Shared on {new Date(data.createdAt).toLocaleString()}</Text>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {data.files.map((file: any, index: number) => (
              <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
                <CardSection p="md">
                  {renderDocumentPreview(file)}
                </CardSection>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // Regular data
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--mantine-color-gray-1)', padding: '1rem', borderRadius: '6px' }}>
          <Text size="sm" fw={500} mb="xs">Shared Data</Text>
          <pre style={{ fontSize: '0.75rem', overflow: 'auto', padding: '0.5rem', backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '4px' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Title order={1} mb="xl">Shared Medical Data</Title>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Loader size="lg" mb="md" />
            <Text>Loading data from IPFS...</Text>
          </div>
        </div>
      ) : error ? (
        <Alert icon={<Loader2 size={16} />} title="Error" color="red" mb="xl">
          {error}
        </Alert>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {renderContent()}
        </div>
      )}

      <Modal
        opened={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        title={<Title order={3}>Password Protected Data</Title>}
      >
        <Text size="sm" c="dimmed" mb="md">
          This data is password protected. Enter the password to view it.
        </Text>

        <TextInput
          label="Password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          mb="md"
        />

        {decryptError && (
          <Text size="sm" c="red" mb="md">{decryptError}</Text>
        )}

        <Button onClick={handleDecrypt} disabled={!password} leftSection={<Lock size={16} />}>
          Decrypt
        </Button>
      </Modal>
    </div>
  );
}
