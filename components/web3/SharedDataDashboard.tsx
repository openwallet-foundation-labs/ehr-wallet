'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, ExternalLink, Plus, Trash } from 'lucide-react';
import { ethers } from 'ethers';

// Placeholder for actual blockchain data fetching
// In a real implementation, you would query events from the smart contract
const fetchSharedRecords = async (address: string) => {
  // This is a placeholder - in a real implementation, you would:
  // 1. Connect to the blockchain
  // 2. Query AccessCreated events from the smart contract filtered by the user's address
  // 3. Format and return the data
  
  // For demo purposes, return mock data
  return [
    {
      id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      ipfsCid: 'QmXyZ123456789abcdef',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      expiryTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      hasPassword: true,
      accessCount: 2
    },
    {
      id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      ipfsCid: 'QmAbC987654321defghi',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      expiryTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired 1 day ago
      hasPassword: false,
      accessCount: 5
    }
  ];
};

interface SharedDataDashboardProps {
  ethereumAddress?: string;
}

const SharedDataDashboard = ({ ethereumAddress }: SharedDataDashboardProps) => {
  const router = useRouter();
  const [sharedRecords, setSharedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedRecords = async () => {
      if (!ethereumAddress) {
        setLoading(false);
        return;
      }
      
      try {
        const records = await fetchSharedRecords(ethereumAddress);
        setSharedRecords(records);
      } catch (err: any) {
        console.error('Error loading shared records:', err);
        setError(err.message || 'Failed to load shared records');
      } finally {
        setLoading(false);
      }
    };

    loadSharedRecords();
  }, [ethereumAddress]);

  const handleShareNew = () => {
    router.push('/patient/share-data');
  };

  const handleViewShared = (accessId: string) => {
    window.open(`/shared/${accessId}`, '_blank');
  };

  // This would be implemented to call the smart contract to revoke access
  const handleRevokeAccess = async (accessId: string) => {
    // Placeholder - would call a smart contract function to revoke access
    alert(`Revoke access for ${accessId}`);
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

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Shared Medical Data</CardTitle>
          <CardDescription>
            Manage your shared medical data records
          </CardDescription>
        </div>
        <Button onClick={handleShareNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Share New Data
        </Button>
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
              <h4 className="font-medium text-destructive">Error loading shared records</h4>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        ) : sharedRecords.length === 0 ? (
          <div className="text-center py-12 px-4">
            <h3 className="font-medium text-lg mb-2">No shared records yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't shared any medical data yet. Click the button above to share your data securely.
            </p>
            <Button onClick={handleShareNew} variant="outline">
              Share Your First Record
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shared On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Security</TableHead>
                  <TableHead>Access Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharedRecords.map((record) => {
                  const isExpired = new Date() > record.expiryTime;
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isExpired ? "outline" : "default"} className={isExpired ? "text-muted-foreground" : ""}>
                          {isExpired ? 'Expired' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeRemaining(record.expiryTime)}</span>
                      </TableCell>
                      <TableCell>
                        {record.hasPassword ? 'Password Protected' : 'No Password'}
                      </TableCell>
                      <TableCell>{record.accessCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewShared(record.id)}
                            disabled={isExpired}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeAccess(record.id)}
                            disabled={isExpired}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Revoke</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Your data is securely stored on IPFS and access is managed by an Ethereum smart contract
        </p>
      </CardFooter>
    </Card>
  );
};

export default SharedDataDashboard;
