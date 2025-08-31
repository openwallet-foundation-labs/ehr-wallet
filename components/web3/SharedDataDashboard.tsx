'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, ExternalLink, Plus, Trash, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

// Fetch shared records from the API
const fetchSharedRecords = async (address?: string, forceRefresh = true) => {
  try {
    // Add the address as a query parameter if provided
    // Add a timestamp to force cache busting
    const timestamp = new Date().getTime();
    const url = address 
      ? `/api/shared-data?address=${address}&_t=${timestamp}` 
      : `/api/shared-data?_t=${timestamp}`;
    
    console.log(`Fetching shared records from: ${url}`);
    
    const response = await fetch(url, {
      // Add cache: 'no-store' to prevent caching
      cache: 'no-store',
      // Include credentials to send authentication cookies
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      // Add a timestamp to force a fresh request
      ...(forceRefresh ? { next: { revalidate: 0 }, signal: AbortSignal.timeout(30000) } : {})
    });
    
    if (!response.ok) {
      // Get more detailed error information if available
      let errorMessage = 'Failed to fetch shared data';
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please ensure you are logged in and have connected your wallet.');
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
    console.error('Error fetching shared records:', error);
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

  const loadSharedRecords = async (forceRefresh = true) => {
    // If no ethereum address is provided, use a demo address for testing
    const addressToUse = ethereumAddress || '0x123456789abcdef123456789abcdef123456789a';
    
    setLoading(true);
    setError(null);
    
    try {
      // Clear any cached data first
      if (forceRefresh) {
        console.log('Forcing refresh of shared records');
      }
      
      // Pass the Ethereum address to the fetch function
      const records = await fetchSharedRecords(addressToUse, forceRefresh);
      console.log('Fetched shared records:', records);
      
      if (records && Array.isArray(records)) {
        setSharedRecords(records);
        console.log(`Successfully loaded ${records.length} shared records`);
      } else {
        console.error('Received invalid data format from API:', records);
        setSharedRecords([]);
      }
    } catch (err: any) {
      console.error('Error loading shared records:', err);
      setError(err.message || 'Failed to load shared records');
      setSharedRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load shared records on component mount
    console.log('Loading shared records on component mount');
    loadSharedRecords(true);
    
    // Add event listener for visibility change to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing data');
        loadSharedRecords(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add event listener for focus to refresh when window regains focus
    const handleFocus = () => {
      console.log('Window regained focus, refreshing data');
      loadSharedRecords(true);
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
      console.log(`Attempting to revoke access for record ID: ${recordId}`);
      
      // First, check if the record exists
      const checkResponse = await fetch(`/api/shared-data/${recordId}`, {
        method: 'GET',
      });
      
      if (!checkResponse.ok) {
        console.error('Record not found:', await checkResponse.text());
        throw new Error(`Record not found: ${recordId}`);
      }
      
      const recordData = await checkResponse.json();
      console.log('Found record:', recordData);
      
      // Now update the record to revoke access
      const response = await fetch(`/api/shared-data/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: false }),
      });
      
      const responseText = await response.text();
      console.log(`Revoke response (${response.status}):`, responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to revoke access: ${responseText}`);
      }
      
      // Update the UI by setting the record to inactive
      setSharedRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === recordId ? { ...record, isActive: false } : record
        )
      );
      
      alert('Access successfully revoked');
    } catch (error) {
      console.error('Error revoking access:', error);
      alert(`Failed to revoke access: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Shared Medical Data</CardTitle>
          <CardDescription>
            Manage your shared medical data records
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => loadSharedRecords(true)} 
            disabled={loading}
            title="Refresh shared records"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleShareNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Share New Data
          </Button>
        </div>
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
              <Button onClick={() => loadSharedRecords(true)} variant="outline" size="sm" className="mt-2">
                <RefreshCw className="h-3 w-3 mr-2" /> Try Again
              </Button>
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
                        <Badge 
                          variant={isExpired ? "outline" : record.isActive ? "default" : "secondary"} 
                          className={isExpired ? "text-muted-foreground" : ""}
                        >
                          {isExpired ? 'Expired' : record.isActive ? 'Active' : 'Revoked'}
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
                            onClick={() => handleViewShared(record.accessId)}
                            disabled={isExpired || !record.isActive}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeAccess(record.id)}
                            disabled={isExpired || !record.isActive}
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
