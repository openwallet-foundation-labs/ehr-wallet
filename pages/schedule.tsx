import { useState } from "react";
import Head from "next/head";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Users, FileText, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Mock scheduled exams data
const scheduledExams = [
  {
    id: "E001",
    patientName: "John Smith",
    patientId: "P001",
    examType: "MRI Brain",
    date: new Date(2025, 4, 12, 9, 30),
    status: "confirmed",
    modality: "MRI"
  },
  {
    id: "E002",
    patientName: "Sarah Johnson",
    patientId: "P002",
    examType: "CT Chest",
    date: new Date(2025, 4, 12, 11, 0),
    status: "confirmed",
    modality: "CT"
  },
  {
    id: "E003",
    patientName: "Michael Brown",
    patientId: "P003",
    examType: "X-Ray Shoulder",
    date: new Date(2025, 4, 12, 14, 15),
    status: "pending",
    modality: "X-Ray"
  },
  {
    id: "E004",
    patientName: "Emily Davis",
    patientId: "P004",
    examType: "Ultrasound Abdomen",
    date: new Date(2025, 4, 13, 10, 0),
    status: "confirmed",
    modality: "Ultrasound"
  }
];

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("day");
  
  // Filter exams for the selected date
  const filteredExams = scheduledExams.filter(exam => {
    if (!selectedDate) return false;
    
    if (view === "day") {
      return exam.date.toDateString() === selectedDate.toDateString();
    } else if (view === "week") {
      // Simple week filter - could be improved with proper week calculation
      const examDate = new Date(exam.date);
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return examDate >= weekStart && examDate <= weekEnd;
    } else {
      // Month view
      return exam.date.getMonth() === selectedDate.getMonth() && 
             exam.date.getFullYear() === selectedDate.getFullYear();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Head>
        <title>Schedule | GlobalRad</title>
      </Head>
      <MainLayout>
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
              <p className="text-muted-foreground">Manage imaging appointments</p>
            </div>
            <Link href="/ScheduleExam">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>New Exam</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                  <div className="flex justify-center space-x-2">
                    <Button 
                      variant={view === "day" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setView("day")}
                    >
                      Day
                    </Button>
                    <Button 
                      variant={view === "week" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setView("week")}
                    >
                      Week
                    </Button>
                    <Button 
                      variant={view === "month" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setView("month")}
                    >
                      Month
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {view === "day" ? (
                    `Appointments for ${selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Today"}`
                  ) : view === "week" ? (
                    "Weekly Schedule"
                  ) : (
                    `${selectedDate ? format(selectedDate, "MMMM yyyy") : "Monthly"} Schedule`
                  )}
                </CardTitle>
                <CardDescription>
                  {filteredExams.length} appointments scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="mri">MRI</TabsTrigger>
                    <TabsTrigger value="ct">CT</TabsTrigger>
                    <TabsTrigger value="xray">X-Ray</TabsTrigger>
                    <TabsTrigger value="ultrasound">Ultrasound</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="m-0">
                    <div className="space-y-4">
                      {filteredExams.length > 0 ? (
                        filteredExams.map((exam) => (
                          <div 
                            key={exam.id} 
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{exam.patientName}</span>
                                <Badge variant="outline">{exam.patientId}</Badge>
                                <Badge className={getStatusColor(exam.status)}>
                                  {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">{exam.examType}</div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 sm:mt-0">
                              <div className="flex items-center gap-1 text-sm">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{format(exam.date, "MMM d, yyyy")}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{format(exam.date, "h:mm a")}</span>
                              </div>
                              <Button size="sm" variant="outline">View</Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <h3 className="font-medium text-lg">No appointments scheduled</h3>
                          <p className="text-muted-foreground mt-1">
                            {view === "day" ? "Try selecting a different date" : "Try changing your view or date range"}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Filter tabs for each modality - similar structure to "all" tab */}
                  {["mri", "ct", "xray", "ultrasound"].map((modality) => (
                    <TabsContent key={modality} value={modality} className="m-0">
                      <div className="space-y-4">
                        {filteredExams.filter(exam => exam.modality.toLowerCase() === modality).length > 0 ? (
                          filteredExams
                            .filter(exam => exam.modality.toLowerCase() === modality)
                            .map((exam) => (
                              <div 
                                key={exam.id} 
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{exam.patientName}</span>
                                    <Badge variant="outline">{exam.patientId}</Badge>
                                    <Badge className={getStatusColor(exam.status)}>
                                      {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">{exam.examType}</div>
                                </div>
                                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                  <div className="flex items-center gap-1 text-sm">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(exam.date, "MMM d, yyyy")}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(exam.date, "h:mm a")}</span>
                                  </div>
                                  <Button size="sm" variant="outline">View</Button>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-medium text-lg">No {modality.toUpperCase()} appointments scheduled</h3>
                            <p className="text-muted-foreground mt-1">
                              Try selecting a different date or view
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
