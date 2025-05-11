import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ArrowLeft, Calendar, Loader2, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

type Visit = {
  id: string;
  date: string;
  notes: string;
};

type Patient = {
  id: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  visits: Visit[];
};

export default function PatientDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch patient details
    const fetchPatientDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/patients/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient details');
        }
        
        const data = await response.json();
        setPatient(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching patient details:', err);
        setError('Failed to load patient details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchPatientDetails();
    }
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span className="text-lg">Loading patient details...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/PatientList')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Patient List
          </Button>
        </div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Patient information could not be found.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/PatientList')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Patient List
          </Button>
        </div>
      </div>
    );
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString || 'N/A';
    }
  };
  
  return (
    <>
      <Head>
        <title>{patient.name} - Patient Details</title>
        <meta name="description" content={`Patient details for ${patient.name}`} />
      </Head>
      
      <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button onClick={() => router.push('/PatientList')} variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
              <p className="text-muted-foreground">Patient ID: {patient.id}</p>
            </div>
          </div>
          <Button 
            onClick={() => router.push(`/patients/edit/${patient.id}`)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Edit Patient
          </Button>
        </div>
        
        <Tabs defaultValue="details">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="details">Patient Details</TabsTrigger>
            <TabsTrigger value="visits">Visit History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-muted-foreground">Full Name</h3>
                    <p className="text-lg">{patient.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-muted-foreground">Date of Birth</h3>
                    <p className="text-lg">{formatDate(patient.dob)}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-muted-foreground">Gender</h3>
                    <p className="text-lg">{patient.gender}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-muted-foreground">Phone</h3>
                    <p className="text-lg">{patient.phone || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-muted-foreground">Email</h3>
                    <p className="text-lg">{patient.email || 'N/A'}</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h3 className="font-medium text-muted-foreground">Address</h3>
                    <p className="text-lg">{patient.address || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Edit button moved to the page header */}
          </TabsContent>
          
          <TabsContent value="visits" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Visit History
                </CardTitle>
                <CardDescription>
                  {patient.visits.length === 0 
                    ? 'No visit records found for this patient.' 
                    : `Found ${patient.visits.length} visit record(s).`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patient.visits.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No visit history available for this patient.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patient.visits.map((visit) => (
                      <Card key={visit.id} className="bg-muted/40">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{formatDate(visit.date)}</div>
                          </div>
                          <p className="text-muted-foreground">{visit.notes || 'No notes recorded for this visit.'}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
