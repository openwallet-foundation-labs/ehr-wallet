import { useState, useEffect } from "react";
import { Calendar, Clock, Filter, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import Head from "next/head";
import Link from "next/link";

// Types to match our API data structure
type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

// This is the raw appointment data from the API
type ApiAppointment = {
  id: string;
  title: string;
  patientId: string;
  providerId: string;
  appointmentTypeId: string | null;
  startTime: string;
  endTime: string;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    patientId: string;
    name: string;
    dob: string;
    gender: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  provider: {
    id: string;
    name: string;
    specialty: string | null;
    email: string;
    phone: string | null;
  };
  appointmentType: {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    color: string | null;
  } | null;
};

// This is our formatted appointment data for the UI
type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  date: string;
  modality: string;
  bodyPart: string;
  doctor: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show";
  priority: "routine" | "urgent" | "stat";
  duration: number; // in minutes
};

// Map appointments from API to our UI format
const formatApiAppointments = (appointments: ApiAppointment[]): Appointment[] => {
  return appointments.map(apt => {
    // Extract body part from the title if possible (assumes format like "MRI - Head")
    const titleParts = apt.title.split(' - ');
    const modality = apt.appointmentType?.name.split(' ')[0] || titleParts[0] || 'Other';
    const bodyPart = titleParts.length > 1 ? titleParts[1] : 'Not specified';
    
    // Calculate duration in minutes
    const startTime = new Date(apt.startTime);
    const endTime = new Date(apt.endTime);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    // Map API status to UI status
    const statusMap: Record<AppointmentStatus, "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show"> = {
      SCHEDULED: "scheduled",
      CONFIRMED: "scheduled",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
      NO_SHOW: "no-show"
    };
    
    // Determine priority based on appointment type or duration
    // This is a simple heuristic - in a real app you might have this data from the API
    let priority: "routine" | "urgent" | "stat" = "routine";
    if (apt.title.toLowerCase().includes('urgent') || apt.title.toLowerCase().includes('emergency')) {
      priority = "urgent";
    } else if (apt.title.toLowerCase().includes('stat')) {
      priority = "stat";
    }
    
    return {
      id: apt.id,
      patientId: apt.patient.patientId,
      patientName: apt.patient.name,
      time: format(startTime, "h:mm a"),
      date: format(startTime, "yyyy-MM-dd"),
      modality,
      bodyPart,
      doctor: apt.provider.name,
      status: statusMap[apt.status],
      priority,
      duration: durationMinutes || apt.appointmentType?.duration || 30
    };
  });
};

const SchedulingContent = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">("day");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModality, setFilterModality] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Generate dates for the week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDates = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Fetch appointments whenever date or view changes
  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setError(null);
      
      try {
        // Format date parameters based on current view
        let startDate, endDate;
        
        if (currentView === "day") {
          startDate = format(currentDate, "yyyy-MM-dd");
          endDate = startDate;
        } else if (currentView === "week") {
          startDate = format(weekStart, "yyyy-MM-dd");
          endDate = format(weekEnd, "yyyy-MM-dd");
        }
        
        console.log(`Fetching appointments from ${startDate} to ${endDate}`);
        
        // Fetch appointments from our API
        const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error (${response.status}):`, errorText);
          throw new Error(`Failed to fetch appointments: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
        }
        
        const data: ApiAppointment[] = await response.json();
        console.log(`Received ${data.length} appointments from API`);
        const formattedAppointments = formatApiAppointments(data);
        setAppointments(formattedAppointments);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAppointments();
  }, [currentDate, currentView]);
  
  // Filter appointments for day view
  const dayAppointments = appointments.filter(apt => 
    apt.date === format(currentDate, "yyyy-MM-dd")
  );
  
  // All appointments for week view
  const weekAppointments = appointments;
  
  // Filter appointments based on search and filters
  const filterAppointments = (appointments: Appointment[]) => {
    return appointments.filter(apt => {
      const matchesSearch = searchQuery === "" || 
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctor.toLowerCase().includes(searchQuery.toLowerCase());
        
      // Handle the "All" selection by treating it as no filter
      const noModalityFilter = !filterModality || filterModality === "All";
      const matchesModality = noModalityFilter || apt.modality.toLowerCase() === filterModality.toLowerCase();
      
      return matchesSearch && matchesModality;
    });
  };
  
  const filteredDayAppointments = filterAppointments(dayAppointments);
  const filteredWeekAppointments = filterAppointments(weekAppointments);
  
  // Navigation functions
  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());
  const goToPreviousWeek = () => setCurrentDate(subDays(currentDate, 7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  
  // Status badge styles
  const getStatusBadge = (status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show") => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "in-progress":
        return <Badge className="bg-green-100 text-green-800">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-secondary text-secondary-foreground">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "no-show":
        return <Badge className="bg-amber-100 text-amber-800">No Show</Badge>;
      default:
        return null;
    }
  };
  
  // Priority badge styles
  const getPriorityBadge = (priority: "routine" | "urgent" | "stat") => {
    switch (priority) {
      case "stat":
        return <Badge className="bg-destructive text-destructive-foreground">STAT</Badge>;
      case "urgent":
        return <Badge className="bg-primary text-primary-foreground">Urgent</Badge>;
      case "routine":
        return <Badge className="bg-secondary text-secondary-foreground">Routine</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-8 pb-8">
      {/* Microsoft Teams-style header with date navigation (sticky on scroll) */}
      <div className="flex flex-col gap-4 sticky top-0 z-20 bg-background/90 backdrop-blur-md py-2 border-b border-border">
        {/* Top navigation bar with title and date controls */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">Scheduling</h1>
          </div>

          {/* Date navigation controls moved to top */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={currentView === "day" ? goToPreviousDay : goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={currentView === "day" ? goToNextDay : goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold">
              {currentView === "day" ? (
                format(currentDate, "MMMM d, yyyy")
              ) : (
                `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
              )}
            </div>
          </div>
          
          {/* Schedule new exam button */}
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button asChild className="font-semibold px-6 py-2 text-base shadow-md" aria-label="Schedule new exam">
              <Link href="/ScheduleExam">
                <Calendar className="mr-2 h-5 w-5" /> 
                Schedule New Exam
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Second bar with view selector and search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex-shrink-0">
            <Tabs 
              value={currentView} 
              onValueChange={(value) => setCurrentView(value as "day" | "week" | "month")}
            >
              <TabsList className="bg-muted p-1 rounded-lg">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-1 sm:flex-row gap-4 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search patients, doctors..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterModality} onValueChange={setFilterModality}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by modality" aria-label="Filter by modality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="CT">CT</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                  <SelectItem value="Mammography">Mammography</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Message about appointments */}
      <div className="py-2">
        <p className="text-muted-foreground">View and manage all appointments</p>
      </div>
      
      {/* Calendar Views */}
      <Tabs 
        value={currentView} 
        onValueChange={(value) => setCurrentView(value as "day" | "week" | "month")}
        className="mt-4"
      >      
        {/* Day View */}
        <TabsContent value="day" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {format(currentDate, "EEEE, MMMM d")}
                {isToday(currentDate) && <Badge className="ml-2">Today</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-muted-foreground text-lg">
                  Loading appointments...
                </div>
              ) : error ? (
                <div className="py-12 text-center text-red-500 text-lg">
                  Error: {error}
                </div>
              ) : filteredDayAppointments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-lg">
                  No appointments found for this day
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredDayAppointments.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center w-20">
                          <p className="text-base font-semibold">{appointment.time}</p>
                          <p className="text-xs text-muted-foreground">{appointment.duration}min</p>
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{appointment.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.modality} - {appointment.bodyPart} - {appointment.doctor}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-end gap-2 mt-2 md:mt-0">
                        {getStatusBadge(appointment.status)}
                        {appointment.priority !== "routine" && getPriorityBadge(appointment.priority)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Week View */}
        <TabsContent value="week" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 overflow-x-auto">
            {weekDates.map((date) => {
              const dateAppointments = filteredWeekAppointments.filter(
                apt => apt.date === format(date, "yyyy-MM-dd")
              );
              return (
                <Card key={format(date, "yyyy-MM-dd")}
                  className={cn(
                    isToday(date) ? "border-2 border-primary shadow-lg bg-primary/5" : "shadow-sm"
                  )}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <span>{format(date, "EEE, MMM d")}</span>
                      {isToday(date) && <Badge className="ml-2">Today</Badge>}
                      <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {dateAppointments.length} appt{dateAppointments.length !== 1 ? 's' : ''}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                      <div className="py-8 text-center text-muted-foreground text-base">
                        Loading...
                      </div>
                    ) : error ? (
                      <div className="py-8 text-center text-red-500 text-base">
                        Error
                      </div>
                    ) : dateAppointments.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground text-base">
                        No appointments
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dateAppointments.map((appointment) => (
                          <div 
                            key={appointment.id} 
                            className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors text-base"
                          >
                            <div className="flex justify-between items-center">
                              <p className="font-semibold">{appointment.time}</p>
                              {appointment.priority !== "routine" && getPriorityBadge(appointment.priority)}
                            </div>
                            <p className="font-semibold mt-1">{appointment.patientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.modality} - {appointment.bodyPart}
                            </p>
                            <div className="mt-1">
                              {getStatusBadge(appointment.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Scheduling = () => {
  return (
    <>
      <Head>
        <title>Scheduling - RadGlobal RIS</title>
        <meta name="description" content="View and manage all scheduled appointments" />
      </Head>
      <MainLayout>
        <SchedulingContent />
      </MainLayout>
    </>
  );
};

export default Scheduling;
