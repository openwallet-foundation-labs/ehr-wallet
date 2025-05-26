import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Lock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

// We're using MetaMaskProvider from _app.tsx

export default function SharedDataPage() {
  const router = useRouter();
  const { accessId } = router.query;

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
        // We'll handle this in the Web3Handler component
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
  }, [accessId]);

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
      // This will be handled by the Web3Handler component
      // Mock data for now
      const mockData = {
        patientId: 'P12345',
        createdAt: new Date().toISOString(),
        dataTypes: ['medical-history', 'lab-results', 'imaging']
      };
      
      setSharedData(mockData);
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
      <div className="space-y-6">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Access Granted</AlertTitle>
          <AlertDescription>
            You have successfully accessed the shared medical data
          </AlertDescription>
        </Alert>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Patient Information</h3>
          <p className="text-sm">Patient ID: {sharedData.patientId}</p>
          <p className="text-sm">Shared on: {new Date(sharedData.createdAt).toLocaleString()}</p>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Shared Data Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedData.dataTypes.map((type: string) => (
              <Card key={type} className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{formatDataType(type)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Data available for viewing
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If access has expired
  if (expiryTime && new Date() > expiryTime) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Expired</CardTitle>
            <CardDescription>
              The shared data is no longer available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Expired</AlertTitle>
              <AlertDescription>
                This shared data link has expired and is no longer accessible.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Please contact the patient if you need access to this data.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Shared Medical Data</h1>
      
      {!sharedData ? (
          <Card>
            <CardHeader>
              <CardTitle>Access Verification</CardTitle>
              <CardDescription>
                {accessDetails?.hasPassword 
                  ? 'Enter the password to access the shared medical data'
                  : 'Verifying access to the shared medical data'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {expiryTime && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>
                    Time remaining: <strong>{timeLeft}</strong>
                  </span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex space-x-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter the password provided by the patient"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={verifying}
                  />
                  <Button 
                    onClick={handleVerify} 
                    disabled={verifying || !password}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {verifying && (
                <div className="flex justify-center py-4">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Verifying access...</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                This data is securely stored on IPFS and access is managed by an Ethereum smart contract
              </p>
            </CardFooter>
          </Card>
        ) : (
          renderSharedData()
        )}
    </div>
  );
}
