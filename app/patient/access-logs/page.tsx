'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, ExternalLink, ShieldAlert, Eye } from 'lucide-react';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';

// Mock data - in a real implementation, this would come from blockchain events
const mockAccessLogs = [
  {
    id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    accessedBy: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    accessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    dataTypes: ['medical-history', 'lab-results'],
    ipfsCid: 'QmXyZ123456789abcdef',
    status: 'active'
  },
  {
    id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    accessedBy: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    accessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    dataTypes: ['imaging'],
    ipfsCid: 'QmAbC987654321defghi',
    status: 'expired'
  }
];

export default function AccessLogsPage() {
  const { data: session, status } = useSession();
  const { isMetaMaskInstalled } = useMetaMask();
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Load access logs
  useEffect(() => {
    const fetchAccessLogs = async () => {
      try {
        // In a real implementation, this would fetch data from the blockchain
        // For now, we'll use mock data
        setAccessLogs(mockAccessLogs);
      } catch (err: any) {
        console.error('Error fetching access logs:', err);
        setError(err.message || 'Failed to fetch access logs');
      } finally {
        setLoading(false);
      }
    };

    fetchAccessLogs();
  }, []);

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
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Access Logs</h1>
      <p className="text-muted-foreground mb-8">
        Track who has accessed your shared medical data
      </p>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Data Access History</CardTitle>
          <CardDescription>
            A record of all access to your shared medical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Error loading access logs</h4>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          ) : accessLogs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No access logs yet</h3>
              <p className="text-muted-foreground">
                When someone accesses your shared medical data, it will be recorded here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accessed By</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Data Types</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {truncateAddress(log.accessedBy)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(log.accessedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDataTypes(log.dataTypes)}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'active' ? "default" : "outline"} className={log.status === 'active' ? "" : "text-muted-foreground"}>
                          {log.status === 'active' ? 'Active' : 'Expired'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/shared/${log.id}`, '_blank')}
                            disabled={log.status !== 'active'}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://ipfs.io/ipfs/${log.ipfsCid}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">IPFS</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
