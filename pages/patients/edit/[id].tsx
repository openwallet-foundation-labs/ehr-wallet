import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EditPatient() {
  const router = useRouter();
  const { id } = router.query;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    address: ''
  });
  
  // Parse name into first and last name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Fetch patient data
  useEffect(() => {
    if (!id) return;
    
    const fetchPatient = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/patients/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient data');
        }
        
        const data = await response.json();
        setFormData({
          name: data.name,
          dob: data.dob,
          gender: data.gender,
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || ''
        });
        
        // Split name into first and last name
        const nameParts = data.name.split(' ');
        if (nameParts.length > 1) {
          setFirstName(nameParts[0]);
          setLastName(nameParts.slice(1).join(' '));
        } else {
          setFirstName(data.name);
          setLastName('');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatient();
  }, [id]);
  
  // Handle first and last name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id === 'firstName') {
      setFirstName(value);
      setFormData(prev => ({
        ...prev,
        name: `${value} ${lastName}`.trim()
      }));
    } else if (id === 'lastName') {
      setLastName(value);
      setFormData(prev => ({
        ...prev,
        name: `${firstName} ${value}`.trim()
      }));
    }
  };
  
  // Handle other input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Handle select change
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      gender: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.dob || !formData.gender) {
        throw new Error('Please fill in all required fields');
      }
      
      // Submit data to API
      const response = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update patient');
      }
      
      setSuccess(true);
      
      // Redirect to patient details after short delay
      setTimeout(() => {
        router.push(`/patients/${id}`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span className="text-lg">Loading patient data...</span>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Edit Patient - GlobalRad</title>
        <meta name="description" content="Edit patient information" />
      </Head>
      
      <div className="space-y-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              className="mr-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Patient</h1>
              <p className="text-muted-foreground">Update patient information</p>
            </div>
          </div>
        </div>
        
        {/* Success message */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Update successful</AlertTitle>
            <AlertDescription className="text-green-700">
              Patient information has been updated successfully. Redirecting...
            </AlertDescription>
          </Alert>
        )}
        
        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-xl font-semibold flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={handleNameChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={handleNameChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dob">
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender
                  </Label>
                  <Select onValueChange={handleSelectChange} value={formData.gender}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">
                  Address
                </Label>
                <Textarea
                  id="address"
                  rows={3}
                  placeholder="Full address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Update Patient'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
