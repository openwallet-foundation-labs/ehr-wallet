
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/router";
import { registerPatient } from "@/services/patientService";
import { initDatabase } from "@/lib/db";
import { useIsMobile } from "@/hooks/use-mobile";

const patientFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  gender: z.string().min(1, { message: "Gender is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
  address: z.object({
    street: z.string().min(1, { message: "Street is required" }),
    city: z.string().min(1, { message: "City is required" }),
    state: z.string().min(1, { message: "State is required" }),
    zipCode: z.string().min(5, { message: "ZIP code must be at least 5 characters" }),
  }),
  insuranceProvider: z.string().min(1, { message: "Insurance provider is required" }),
  insuranceNumber: z.string().min(1, { message: "Insurance number is required" }),
  emergencyContact: z.object({
    name: z.string().min(1, { message: "Emergency contact name is required" }),
    relationship: z.string().min(1, { message: "Relationship is required" }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
  }),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export const PatientForm = () => {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Initialize database
  useEffect(() => {
    initDatabase();
    
    // Check online status
    setIsOnline(navigator.onLine);
    
    // Set up event listeners for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const defaultValues: Partial<PatientFormValues> = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    insuranceProvider: "",
    insuranceNumber: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    medicalHistory: "",
    allergies: "",
  };

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: PatientFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Format data for patient registration
      const patientData = {
        name: `${data.firstName} ${data.lastName}`,
        dob: data.dateOfBirth.toISOString().split('T')[0],
        gender: data.gender,
        phone: data.phone,
        email: data.email || null,
        address: `${data.address.street}, ${data.address.city}, ${data.address.state} ${data.address.zipCode}`
      };
      
      // Register patient using Dexie service
      const result = await registerPatient(patientData);
      
      // Show success message
      toast({
        title: "Patient registered successfully",
        description: isOnline ? 
          `${data.firstName} ${data.lastName} has been registered.` :
          `${data.firstName} ${data.lastName} has been saved locally and will sync when online.`,
      });
      
      // Redirect to patient list after short delay
      setTimeout(() => {
        router.push('/PatientList');
      }, 2000);
      
    } catch (error) {
      console.error('Error registering patient:', error);
      toast({
        title: "Registration failed",
        description: "There was an error registering the patient. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      {!isOnline && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                You are currently offline. Patient data will be saved locally and synced when connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.smith@example.com" {...field} />
                    </FormControl>
                    <FormDescription>Optional for communication</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4 mt-8">Address</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Anytown" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AL">Alabama</SelectItem>
                              <SelectItem value="AK">Alaska</SelectItem>
                              <SelectItem value="AZ">Arizona</SelectItem>
                              <SelectItem value="CA">California</SelectItem>
                              <SelectItem value="CO">Colorado</SelectItem>
                              <SelectItem value="CT">Connecticut</SelectItem>
                              <SelectItem value="NY">New York</SelectItem>
                              <SelectItem value="TX">Texas</SelectItem>
                              {/* Add more states as needed */}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Insurance Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="insuranceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="Blue Cross Blue Shield" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy / Member Number</FormLabel>
                      <FormControl>
                        <Input placeholder="XYZ123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4 mt-8">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact.relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="Spouse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 987-6543" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4 mt-8">Medical Information</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical History</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief medical history, previous conditions, etc."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any known allergies or reactions"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">Cancel</Button>
          <Button 
            type="submit" 
            className="bg-medical-blue hover:bg-medical-blue/90" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Register Patient"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
