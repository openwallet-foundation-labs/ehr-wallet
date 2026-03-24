'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Text, Button, Table, Badge, Group, Stack, ThemeIcon, Loader, Alert } from '@mantine/core';
import { AlertCircle, Clock, ExternalLink, Plus, Trash, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Fetch shared records from the API
const fetchSharedRecords = async (address?: string) => {
  try {
    const timestamp = new Date().getTime();
    const url = `/api/shared-data?_t=${timestamp}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (address) {
      headers['x-wallet-address'] = address;
    }

    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'include',
      headers,
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch shared data';
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Use default message
      }

      if (response.status === 401) {
        throw new Error('Authentication required. Please connect your wallet.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.map((record: any) => ({
      ...record,
      createdAt: new Date(record.createdAt),
      expiryTime: new Date(record.expiryTime)
    }));
  } catch (error) {
    throw error;
  }
};

interface SharedDataDashboardProps {
  ethereumAddress?: string;
}

const SharedDataDashboard = ({ ethereumAddress }: SharedDataDashboardProps) => {
  const router = useRouter();
  const [sharedRecords, setSharedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSharedRecords = async () => {
    const addressToUse = ethereumAddress || '0x123456789abcdef123456789abcdef123456789a';

    setLoading(true);
    setError(null);

    try {
      const records = await fetchSharedRecords(addressToUse);

      if (records && Array.isArray(records)) {
        setSharedRecords(records);

        // Check for expiring shares (within 24 hours)
        const now = new Date();
        const expiringShares = records.filter((record: any) => {
          if (!record.isActive) return false;
          const expiryTime = new Date(record.expiryTime);
          const hoursUntilExpiry = (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
        });

        if (expiringShares.length > 0) {
          toast.info('Shares expiring soon', {
            description: `You have ${expiringShares.length} shared ${expiringShares.length === 1 ? 'item' : 'items'} expiring within 24 hours.`,
          });
        }
      } else {
        setSharedRecords([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shared records');
      setSharedRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSharedRecords();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSharedRecords();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleFocus = () => {
      loadSharedRecords();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [ethereumAddress]);


  const handleShareNew = () => {
    router.push('/patient/share-data');
  };

  const handleViewShared = (accessId: string) => {
    // Use the direct IPFS API endpoint instead of the shared page
    // This avoids the Web3Provider dependency that causes errors
    window.open(`/api/ipfs?accessId=${accessId}`, '_blank');
  };

  // Revoke access by setting isActive to false
  const handleRevokeAccess = async (recordId: string) => {
    try {
      const checkResponse = await fetch(`/api/shared-data/${recordId}`, {
        method: 'GET',
      });

      if (!checkResponse.ok) {
        throw new Error(`Record not found: ${recordId}`);
      }

      const response = await fetch(`/api/shared-data/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': ethereumAddress || '',
        },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to revoke access: ${errorText}`);
      }

      // Update the UI by setting the record to inactive
      setSharedRecords(prevRecords =>
        prevRecords.map(record =>
          record.id === recordId ? { ...record, isActive: false } : record
        )
      );

      // Show success toast
      toast.success('Access revoked', {
        description: 'The recipient can no longer access this shared data.',
      });
    } catch (error) {
      // Show error toast
      toast.error('Failed to revoke access', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  // Helper to format time remaining or show expired
  const formatTimeRemaining = (expiryTime: Date) => {
    const now = new Date();
    if (now > expiryTime) {
      return 'Expired';
    }

    const difference = expiryTime.getTime() - now.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  };

  // Helper to truncate long strings like hashes
  const truncate = (str: string, startLength = 6, endLength = 4) => {
    if (str.length <= startLength + endLength) {
      return str;
    }
    return `${str.substring(0, startLength)}...${str.substring(str.length - endLength)}`;
  };

  const getBadgeColor = (isExpired: boolean, isActive: boolean) => {
    if (isExpired) return 'gray';
    if (isActive) return 'green';
    return 'red';
  };

  const getBadgeLabel = (isExpired: boolean, isActive: boolean) => {
    if (isExpired) return 'Expired';
    if (isActive) return 'Active';
    return 'Revoked';
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder w="100%">
      <Card.Section withBorder inheritPadding py="md">
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={600}>Shared Medical Data</Text>
            <Text size="sm" c="dimmed">
              Manage your shared medical data records
            </Text>
          </div>
          <Group gap="sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSharedRecords()}
              loading={loading}
              title="Refresh shared records"
            >
              <RefreshCw size={16} />
            </Button>
            <Button onClick={handleShareNew} leftSection={<Plus size={16} />}>
              Share New Data
            </Button>
          </Group>
        </Group>
      </Card.Section>

      <Card.Section withBorder inheritPadding py="md">
        {loading ? (
          <Stack align="center" py="xl">
            <Loader size="lg" />
            <Text c="dimmed">Loading shared records...</Text>
          </Stack>
        ) : error ? (
          <Alert color="red" icon={<AlertCircle size={16} />} title="Error loading shared records">
            <Text size="sm" c="dimmed">{error}</Text>
            <Button onClick={() => loadSharedRecords()} variant="outline" size="xs" mt="sm">
              <RefreshCw size={12} style={{ marginRight: 8 }} /> Try Again
            </Button>
          </Alert>
        ) : sharedRecords.length === 0 ? (
          <Stack align="center" py="xl" gap="md">
            <Text size="lg" fw={500}>No shared records yet</Text>
            <Text c="dimmed" ta="center" maw={400}>
              You haven't shared any medical data yet. Click the button above to share your data securely.
            </Text>
            <Button onClick={handleShareNew} variant="outline">
              Share Your First Record
            </Button>
          </Stack>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Shared On</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Time Remaining</Table.Th>
                <Table.Th>Security</Table.Th>
                <Table.Th>Access Count</Table.Th>
                <Table.Th ta="right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sharedRecords.map((record) => {
                const isExpired = new Date() > record.expiryTime;
                return (
                  <Table.Tr key={record.id}>
                    <Table.Td>
                      <Text fw={500}>{record.createdAt.toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getBadgeColor(isExpired, record.isActive)} variant="light">
                        {getBadgeLabel(isExpired, record.isActive)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Clock size={12} />
                        <Text size="sm">{formatTimeRemaining(record.expiryTime)}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{record.hasPassword ? 'Password Protected' : 'No Password'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{record.accessCount}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Group gap="xs" justify="flex-end">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleViewShared(record.accessId)}
                          disabled={isExpired || !record.isActive}
                          title="View shared data"
                        >
                          <ExternalLink size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          color="red"
                          onClick={() => handleRevokeAccess(record.id)}
                          disabled={isExpired || !record.isActive}
                          title="Revoke access"
                        >
                          <Trash size={14} />
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card.Section>

      <Card.Section inheritPadding py="md">
        <Text size="xs" c="dimmed">
          Your data is securely stored on IPFS and access is managed by a blockchain smart contract
        </Text>
      </Card.Section>
    </Card>
  );
};

export default SharedDataDashboard;
