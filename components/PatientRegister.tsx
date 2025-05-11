import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PatientRegister = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    address: ''
  });
  
  // Handle input change
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
      if (!formData.firstName || !formData.lastName || !formData.dob || !formData.gender) {
        throw new Error('Please fill in all required fields');
      }
      
      // Prepare data for API
      const patientData = {
        name: `${formData.firstName} ${formData.lastName}`,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address
      };
      
      // Submit data to API
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register patient');
      }
      
      const result = await response.json();
      setSuccess(true);
      
      // Redirect to patient list after short delay
      setTimeout(() => {
        router.push('/PatientList');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Registration</h1>
          <p className="text-muted-foreground">Register a new patient in the system</p>
        </div>
      </div>
      
      {/* Success message */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Registration successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Patient has been registered successfully. Redirecting to patient list...
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
                value={formData.firstName}
                onChange={handleChange}
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
                value={formData.lastName}
                onChange={handleChange}
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
              onClick={() => router.push('/PatientList')}
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
                  Processing...
                </>
              ) : 'Register Patient'}
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientRegister;
