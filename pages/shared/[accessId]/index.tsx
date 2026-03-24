import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, Text, Button, TextInput, Alert, LoadingOverlay } from '@mantine/core';
import { Lock, AlertTriangle, Check, Clock, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useWeb3 } from '@/components/web3/Web3Handler';

// We're using MetaMaskProvider from _app.tsx

export default function SharedDataPage() {
  const router = useRouter();
  const { accessId, useProxy } = router.query;

  // Get the Web3 context
  const web3 = useWeb3();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDetails, setAccessDetails] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [sharedData, setSharedData] = useState<any>(null);
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Fetch access details on load
  useEffect(() => {
    const fetchAccessDetails = async () => {
      if (!accessId || typeof accessId !== 'string') return;

      try {
        // Use the Web3Handler to get access details
        const details = await web3.getAccessGrantDetails(accessId);
        setAccessDetails(details);

        // Set expiry time if available
        if (details.expiryTime) {
          setExpiryTime(details.expiryTime);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching access details:', err);
        setError(err.message || 'Failed to fetch access details');
        setLoading(false);
      }
    };

    if (accessId) {
      fetchAccessDetails();
    }
  }, [accessId, web3]);

  // Calculate time left until expiry
  useEffect(() => {
    if (!expiryTime) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = expiryTime.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      // Calculate days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiryTime]);

  // Verify access and fetch data
  const verifyAndFetchData = async (passwordInput: string) => {
    if (!accessId || typeof accessId !== 'string') return;

    setVerifying(true);
    setError(null);

    try {
      // Verify access using the Web3Handler
      const ipfsCid = await web3.verifyAccess(accessId, passwordInput || undefined);

      if (!ipfsCid) {
        throw new Error('Failed to verify access - no IPFS CID returned');
      }

      // Fetch the data from IPFS using our proxy if requested
      let data = await web3.getFromIpfs(ipfsCid);

      // If the data is encrypted and we have a password, decrypt it
      if (typeof data === 'string' && passwordInput) {
        try {
          data = await web3.decryptData(data, passwordInput);
        } catch (decryptError) {
          console.error('Error decrypting data:', decryptError);
          throw new Error('Invalid password or corrupted data');
        }
      }

      // Record this access in the database
      try {
        const recordResponse = await fetch('/api/shared-data/record-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessId }),
        });

        if (recordResponse.ok) {
        } else {
          console.warn('Failed to record access:', await recordResponse.json());
        }
      } catch (recordError) {
        console.error('Error recording access:', recordError);
        // Continue even if recording fails - don't block access to data
      }

      setSharedData(data);
    } catch (err: any) {
      console.error('Error verifying access:', err);
      setError(err.message || 'Failed to verify access');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = () => {
    verifyAndFetchData(password);
  };

  // Format the data for display
  const renderSharedData = () => {
    if (!sharedData) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Alert color="green" title="Access Granted" icon={<Check size={16} />}>
          You have successfully accessed the shared medical data
        </Alert>

        <div style={{ backgroundColor: 'var(--mantine-color-gray-1)', padding: '16px', borderRadius: '8px' }}>
          <Text fw={500} mb="xs">Patient Information</Text>
          <Text size="sm">Patient ID: {sharedData.patientId}</Text>
          <Text size="sm">Shared on: {new Date(sharedData.createdAt).toLocaleString()}</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Text fw={500}>Shared Data Types</Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {sharedData.dataTypes.map((type: string) => (
              <Card key={type} withBorder>
                <Text fw={500} size="md" mb="xs">{formatDataType(type)}</Text>
                <Text size="sm" c="dimmed">
                  Data available for viewing
                </Text>
                <Button variant="outline" fullWidth mt="md">
                  View Details
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Helper to format data type IDs into readable labels
  const formatDataType = (type: string) => {
    const labels: Record<string, string> = {
      'medical-history': 'Medical History',
      'lab-results': 'Lab Results',
      'imaging': 'Imaging & Scans',
      'prescriptions': 'Prescriptions',
      'visit-notes': 'Visit Notes',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LoadingOverlay visible={loading} />
      </div>
    );
  }

  // If access has expired
  if (expiryTime && new Date() > expiryTime) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '48px 16px' }}>
        <Card>
          <Text fw={600} size="lg" mb="xs">Access Expired</Text>
          <Text size="sm" c="dimmed" mb="md">
            The shared data is no longer available
          </Text>
          <Alert color="red" title="Expired" icon={<AlertTriangle size={16} />}>
            This shared data link has expired and is no longer accessible.
          </Alert>
          <Text size="xs" c="dimmed" mt="md">
            Please contact the patient if you need access to this data.
          </Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
      <Text size="xl" fw={700} mb="xl">Shared Medical Data</Text>

      {!sharedData ? (
          <Card>
            <Text fw={600} size="lg" mb="xs">Access Verification</Text>
            <Text size="sm" c="dimmed" mb="md">
              {accessDetails?.hasPassword
                ? 'Enter the password to access the shared medical data'
                : 'Verifying access to the shared medical data'}
            </Text>

            {error && (
              <Alert color="red" title="Error" icon={<AlertTriangle size={16} />} mb="md">
                {error}
              </Alert>
            )}

            {expiryTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <Clock size={16} />
                <span>
                  Time remaining: <strong>{timeLeft}</strong>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <Text size="sm" fw={500}>Password</Text>
              <div style={{ display: 'flex', gap: '8px' }}>
                <TextInput
                  placeholder="Enter the password provided by the patient"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={verifying}
                  style={{ flex: 1 }}
                  type="password"
                />
                <Button
                  onClick={handleVerify}
                  disabled={verifying || !password}
                  leftSection={!verifying ? <Lock size={16} /> : undefined}
                  loading={verifying}
                >
                  {verifying ? 'Verifying' : 'Verify'}
                </Button>
              </div>
            </div>

            {verifying && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <LoadingOverlay visible={verifying} />
                  <Text size="sm" c="dimmed">Verifying access...</Text>
                </div>
              </div>
            )}

            <Text size="xs" c="dimmed" mt="md">
              This data is securely stored on IPFS and access is managed by a blockchain smart contract
            </Text>
          </Card>
        ) : (
          renderSharedData()
        )}
    </div>
  );
}

// Disable static generation for this page since it requires client-side Web3 context
export async function getServerSideProps() {
  return {
    props: {},
  };
}
