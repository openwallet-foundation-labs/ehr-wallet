import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Table, Badge, Button, Alert, Group, Text, LoadingOverlay, Title } from '@mantine/core';
import { AlertCircle, Clock, ExternalLink, ShieldAlert, Eye } from 'lucide-react';
import PatientLayout from '@/components/layout/PatientLayout';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';

export default function AccessLogsPage() {
  const { data: session } = useSession();
  const { currentAccount } = useMetaMask();
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load access logs directly from the database
  useEffect(() => {
    const fetchAccessLogs = async () => {
      try {
        setLoading(true);

        // Build headers with wallet address if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (currentAccount) {
          headers['x-wallet-address'] = currentAccount;
        }

        const response = await fetch('/api/shared-data?all=true', { headers });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch access logs');
        }

        const sharedData = await response.json();

        // Transform the shared data into access logs format
        const logs = sharedData.map((data: any) => {
          const dataTypes = data.dataTypes ? data.dataTypes.split(',') : [];
          return {
            id: data.accessId,
            accessedBy: data.userId,
            accessedAt: new Date(data.createdAt),
            dataTypes: dataTypes,
            ipfsCid: data.ipfsCid,
            status: data.isActive && new Date() < new Date(data.expiryTime) ? 'active' : 'expired',
            accessCount: data.accessCount || 0,
            pinStatus: 'pinned'
          };
        });

        setAccessLogs(logs);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch access logs');
      } finally {
        setLoading(false);
      }
    };

    fetchAccessLogs();
  }, [currentAccount]);

  // Format data types for display
  const formatDataTypes = (types: string[]) => {
    const labels: Record<string, string> = {
      'medical-history': 'Medical History',
      'lab-results': 'Lab Results',
      'imaging': 'Imaging & Scans',
      'prescriptions': 'Prescriptions',
      'visit-notes': 'Visit Notes',
    };

    return types.map(type => labels[type] || type).join(', ');
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Truncate Ethereum addresses
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <PatientLayout>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Title order={1}>Access Logs</Title>
        <Text c="dimmed" mb="xl">
          Track who has accessed your shared medical data
        </Text>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Card.Section withBorder inheritPadding py="xs">
            <Group justify="space-between">
              <Title order={3}>Data Access History</Title>
              <Text size="sm" c="dimmed">
                A record of all access to your shared medical data
              </Text>
            </Group>
          </Card.Section>
          <Card.Section withBorder inheritPadding py="md" pos="relative">
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ blur: 2 }} />

            {error ? (
              <Alert color="red" icon={<AlertCircle size={16} />} title="Error loading access logs">
                {error}
              </Alert>
            ) : accessLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <ShieldAlert size={48} style={{ margin: '0 auto 16px', color: 'var(--mantine-color-dimmed)' }} />
                <Text fw={500} size="lg" mb="xs">No access logs yet</Text>
                <Text c="dimmed">
                  When someone accesses your shared medical data, it will be recorded here.
                </Text>
              </div>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Accessed By</Table.Th>
                    <Table.Th>Time</Table.Th>
                    <Table.Th>Data Types</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {accessLogs.map((log) => (
                    <Table.Tr key={log.id}>
                      <Table.Td>
                        <Text fw={500}>
                          {truncateAddress(log.accessedBy)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Clock size={12} />
                          <span>{formatTimeAgo(log.accessedAt)}</span>
                        </Group>
                      </Table.Td>
                      <Table.Td>{formatDataTypes(log.dataTypes)}</Table.Td>
                      <Table.Td>
                        <Badge color={log.status === 'active' ? 'green' : 'gray'} variant="outline">
                          {log.status === 'active' ? 'Active' : 'Expired'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap="xs" justify="flex-end">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => window.open(`/shared/${log.id}`, '_blank')}
                            disabled={log.status !== 'active'}
                            leftSection={<Eye size={14} />}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => window.open(`https://ipfs.io/ipfs/${log.ipfsCid}`, '_blank')}
                            title="View on IPFS"
                            leftSection={<ExternalLink size={14} />}
                          >
                            IPFS
                          </Button>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 8 }}>
                            <Text size="xs" c="dimmed">
                              {log.accessCount} {log.accessCount === 1 ? 'view' : 'views'}
                            </Text>
                            {log.pinStatus && (
                              <Text size="xs" c="dimmed">
                                {log.pinStatus === 'pinned' ? 'Active pin' : log.pinStatus}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card.Section>
        </Card>
      </div>
    </PatientLayout>
  );
}

// TypeScript declaration for window.ethereum is now in Web3Handler.tsx
