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
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import Head from "next/head";

const examFormSchema = z.object({
  patientId: z.string().min(1, { message: "Patient ID is required" }),
  patientName: z.string().min(1, { message: "Patient name is required" }),
  examDate: z.date({ required_error: "Exam date is required" }),
  examTime: z.string().min(1, { message: "Exam time is required" }),
  modality: z.string().min(1, { message: "Modality is required" }),
  procedureType: z.string().min(1, { message: "Procedure type is required" }),
  bodyPart: z.string().min(1, { message: "Body part is required" }),
  referringPhysician: z.string().min(1, { message: "Referring physician is required" }),
  appointmentType: z.string().optional(),  // Added for appointment type selection
  priority: z.string().default("routine"),
  notes: z.string().optional(),
  contrast: z.boolean().default(false),
  insuranceVerified: z.boolean().default(false),
});

type ExamFormValues = z.infer<typeof examFormSchema>;

// Define types for our API response data
type Patient = {
  id: string;
  patientId: string;
  name: string;
  dob: string;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type Provider = {
  id: string;
  name: string;
  specialty: string | null;
  email: string;
  phone: string | null;
};

type AppointmentType = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  color: string | null;
};

type TimeSlot = {
  id: string;
  providerId: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  provider: Provider;
};

const ScheduleExamContent = () => {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string | null>(null);
  
  // State for API data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  
  // States for loading and errors
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingAppointmentTypes, setLoadingAppointmentTypes] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Fetch patients
  useEffect(() => {
    async function fetchPatients() {
      setLoadingPatients(true);
      try {
        const response = await fetch('/api/patients');
        if (!response.ok) throw new Error('Failed to fetch patients');
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setErrorMessage('Failed to load patients');
      } finally {
        setLoadingPatients(false);
      }
    }
    
    fetchPatients();
  }, []);
  
  // Fetch providers
  useEffect(() => {
    async function fetchProviders() {
      setLoadingProviders(true);
      try {
        const response = await fetch('/api/providers');
        if (!response.ok) throw new Error('Failed to fetch providers');
        const data = await response.json();
        setProviders(data);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setErrorMessage('Failed to load providers');
      } finally {
        setLoadingProviders(false);
      }
    }
    
    fetchProviders();
  }, []);
  
  // Fetch appointment types
  useEffect(() => {
    async function fetchAppointmentTypes() {
      setLoadingAppointmentTypes(true);
      try {
        const response = await fetch('/api/appointment-types');
        if (!response.ok) throw new Error('Failed to fetch appointment types');
        const data = await response.json();
        setAppointmentTypes(data);
      } catch (error) {
        console.error('Error fetching appointment types:', error);
        setErrorMessage('Failed to load appointment types');
      } finally {
        setLoadingAppointmentTypes(false);
      }
    }
    
    fetchAppointmentTypes();
  }, []);

  const defaultValues: Partial<ExamFormValues> = {
    patientId: "",
    patientName: "",
    examDate: addDays(new Date(), 1),
    examTime: "",
    modality: "",
    procedureType: "",
    bodyPart: "",
    referringPhysician: "",
    appointmentType: "",  // Added for appointment type selection
    priority: "routine",
    notes: "",
    contrast: false,
    insuranceVerified: false,
  };

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues,
  });

  // Handle patient selection
  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      form.setValue("patientId", patient.id);
      form.setValue("patientName", patient.name);
      setSelectedPatient(patient.id);
    }
  };

  // Fetch available time slots when a provider and date are selected
  const fetchTimeSlots = async (providerId: string, date: Date) => {
    if (!providerId || !date) return;
    
    setLoadingTimeSlots(true);
    try {
      // Format the date for the API
      const dateStr = format(date, 'yyyy-MM-dd');
      // Get the next day to create a time range for just this day
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = format(nextDay, 'yyyy-MM-dd');
      
      // Call our API to get available time slots
      const url = `/api/time-slots?providerId=${providerId}&startDate=${dateStr}&endDate=${nextDayStr}&isAvailable=true`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch time slots: ${response.status}`);
      }
      
      const data: TimeSlot[] = await response.json();
      setAvailableTimeSlots(data);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setErrorMessage('Failed to load available time slots');
      setAvailableTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Handle date selection to update available time slots
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue("examDate", date);
      setSelectedDate(date);
      
      // Fetch time slots if we also have a provider selected
      if (selectedProviderId) {
        fetchTimeSlots(selectedProviderId, date);
      }
    }
  };
  
  // Handle provider selection
  const handleProviderSelect = (providerId: string) => {
    setSelectedProviderId(providerId);
    form.setValue("referringPhysician", providerId);
    
    // Fetch time slots if we have a date selected
    if (selectedDate) {
      fetchTimeSlots(providerId, selectedDate);
    }
  };
  
  // Handle appointment type selection
  const handleAppointmentTypeSelect = (typeId: string) => {
    setSelectedAppointmentType(typeId);
    
    // Set related fields based on the selected appointment type
    const appointmentType = appointmentTypes.find(type => type.id === typeId);
    if (appointmentType) {
      // If the appointment type name contains modality information, set it
      const nameLower = appointmentType.name.toLowerCase();
      if (nameLower.includes('mri')) {
        form.setValue("modality", "mri");
      } else if (nameLower.includes('ct')) {
        form.setValue("modality", "ct");
      } else if (nameLower.includes('x-ray') || nameLower.includes('xray')) {
        form.setValue("modality", "xray");
      } else if (nameLower.includes('ultrasound')) {
        form.setValue("modality", "ultrasound");
      }
    }
  };

  const onSubmit = async (data: ExamFormValues) => {
    try {
      // Find the selected time slot
      const selectedTimeSlot = availableTimeSlots.find(slot => 
        format(new Date(slot.startTime), 'h:mm a') === data.examTime
      );
      
      if (!selectedTimeSlot) {
        toast({
          title: "Error",
          description: "Please select a valid time slot",
          variant: "destructive"
        });
        return;
      }
      
      // Format the title based on selected modality and body part
      const title = `${data.modality.toUpperCase()} - ${data.bodyPart}`;
      
      // Get the appointment type ID if one is selected
      const appointmentTypeId = selectedAppointmentType;
      
      // Create the appointment via the API
      const appointmentData = {
        title,
        patientId: data.patientId,
        providerId: data.referringPhysician, // Using the referring physician as the provider
        appointmentTypeId,
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime,
        notes: data.notes || '',
        status: 'SCHEDULED'
      };
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }
      
      const result = await response.json();
      
      // Show success message
      toast({
        title: "Exam scheduled successfully",
        description: `${data.patientName}'s ${data.modality} exam has been scheduled for ${format(data.examDate, "PPP")} at ${data.examTime}.`,
      });
      
      // Reset form or redirect
      // window.location.href = '/scheduling';
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error scheduling exam",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Exam</h1>
          <p className="text-muted-foreground">Create a new imaging appointment</p>
        </div>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="new">New Exam</TabsTrigger>
          <TabsTrigger value="search">Find Patient</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Search for Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input placeholder="Search by name, ID, or DOB" className="flex-1" />
                  <Button>Search</Button>
                </div>
                
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 font-medium p-3 border-b bg-muted/50">
                    <div>Patient ID</div>
                    <div>Name</div>
                    <div>Action</div>
                  </div>
                  <div className="divide-y">
                    {loadingPatients ? (
                      <div className="p-3 text-center">Loading patients...</div>
                    ) : patients.length === 0 ? (
                      <div className="p-3 text-center">No patients found</div>
                    ) : (
                      patients.map((patient) => (
                        <div key={patient.id} className="grid grid-cols-3 p-3 items-center">
                          <div>{patient.patientId}</div>
                          <div>{patient.name}</div>
                          <div>
                            <Button 
                              size="sm" 
                              onClick={() => handlePatientSelect(patient.id)}
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter patient ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter patient name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exam Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="examDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Exam Date</FormLabel>
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
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    handleDateSelect(date);
                                  }}
                                  disabled={(date) =>
                                    date < new Date() || date > addDays(new Date(), 60)
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
                        name="examTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exam Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time slot" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingTimeSlots ? (
                                  <div className="p-2 text-center">Loading available times...</div>
                                ) : availableTimeSlots.length === 0 ? (
                                  <div className="p-2 text-center">No available time slots</div>
                                ) : (
                                  availableTimeSlots.map((timeSlot) => (
                                    <SelectItem 
                                      key={timeSlot.id} 
                                      value={format(new Date(timeSlot.startTime), 'h:mm a')}
                                    >
                                      {format(new Date(timeSlot.startTime), 'h:mm a')}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="modality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modality</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // If appointment type is selected, this will be auto-filled
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select modality" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="xray">X-Ray</SelectItem>
                                <SelectItem value="ct">CT Scan</SelectItem>
                                <SelectItem value="mri">MRI</SelectItem>
                                <SelectItem value="ultrasound">Ultrasound</SelectItem>
                                <SelectItem value="mammography">Mammography</SelectItem>
                                <SelectItem value="dexa">DEXA Scan</SelectItem>
                                <SelectItem value="pet">PET Scan</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bodyPart"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Body Part</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select body part" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="head">Head</SelectItem>
                                <SelectItem value="neck">Neck</SelectItem>
                                <SelectItem value="chest">Chest</SelectItem>
                                <SelectItem value="abdomen">Abdomen</SelectItem>
                                <SelectItem value="pelvis">Pelvis</SelectItem>
                                <SelectItem value="spine">Spine</SelectItem>
                                <SelectItem value="upper_extremity">Upper Extremity</SelectItem>
                                <SelectItem value="lower_extremity">Lower Extremity</SelectItem>
                                <SelectItem value="whole_body">Whole Body</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="procedureType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Procedure Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select procedure type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="diagnostic">Diagnostic</SelectItem>
                                <SelectItem value="screening">Screening</SelectItem>
                                <SelectItem value="interventional">Interventional</SelectItem>
                                <SelectItem value="follow_up">Follow-up</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="referringPhysician"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referring Physician</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleProviderSelect(value);
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select referring physician" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingProviders ? (
                                  <div className="p-2 text-center">Loading providers...</div>
                                ) : providers.length === 0 ? (
                                  <div className="p-2 text-center">No providers found</div>
                                ) : (
                                  providers.map((provider) => (
                                    <SelectItem key={provider.id} value={provider.id}>
                                      {provider.name}{provider.specialty ? ` (${provider.specialty})` : ''}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="appointmentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Appointment Type</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleAppointmentTypeSelect(value);
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select appointment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingAppointmentTypes ? (
                                  <div className="p-2 text-center">Loading appointment types...</div>
                                ) : appointmentTypes.length === 0 ? (
                                  <div className="p-2 text-center">No appointment types found</div>
                                ) : (
                                  appointmentTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.name} ({type.duration} min)
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the type of imaging procedure
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="routine">Routine</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="stat">STAT</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional instructions or notes for the exam"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="contrast"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Contrast Required</FormLabel>
                            <FormDescription>
                              Check if contrast material is needed for this exam
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="insuranceVerified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Insurance Verified</FormLabel>
                            <FormDescription>
                              Check if insurance coverage has been verified for this procedure
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline">Cancel</Button>
                <Button type="submit" className="bg-medical-blue hover:bg-medical-blue/90">Schedule Exam</Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ScheduleExam = () => {
  return (
    <>
      <Head>
        <title>Schedule Exam - GlobalRad</title>
        <meta name="description" content="Schedule a new imaging exam for a patient" />
      </Head>
      <ScheduleExamContent />
    </>
  );
};

export default ScheduleExam;
