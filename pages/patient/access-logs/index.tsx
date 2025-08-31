import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, ExternalLink, ShieldAlert, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import PatientLayout from '@/components/layout/PatientLayout';

// Temporarily use regular import to debug dynamic import issue
import { MetaMaskProvider } from '@/components/web3/MetaMaskProvider';

// We'll fetch real data from the API

export default function AccessLogsPage() {
  const { data: session } = useSession();
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  // Check if MetaMask is installed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMetaMaskInstalled(Boolean(window.ethereum?.isMetaMask));
    }
  }, []);

  // Load access logs directly from the database
  useEffect(() => {
    const fetchAccessLogs = async () => {
      try {
        setLoading(true);
        
        // Directly fetch all shared data records from the database
        const response = await fetch('/api/shared-data?all=true');
        
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
        
        console.log('Transformed access logs:', logs);
        setAccessLogs(logs);
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
    <PatientLayout>
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
                            title="View on IPFS"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">IPFS</span>
                          </Button>
                          <div className="flex flex-col items-end ml-2">
                            <span className="text-xs text-muted-foreground">
                              {log.accessCount} {log.accessCount === 1 ? 'view' : 'views'}
                            </span>
                            {log.pinStatus && (
                              <span className="text-xs text-muted-foreground">
                                {log.pinStatus === 'pinned' ? 'Active pin' : log.pinStatus}
                              </span>
                            )}
                          </div>
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
    </PatientLayout>
  );
}

// TypeScript declaration for window.ethereum is now in Web3Handler.tsx
