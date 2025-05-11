
import { Calendar, User, FileSearch, Clock, BarChart3, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { StudiesTable } from "@/components/dashboard/StudiesTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to RadGlobal RIS</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button>
            <User className="mr-2 h-4 w-4" />
            New Patient
          </Button>
          <Button variant="outline" asChild>
            <Link href="/ScheduleExam">
              <Calendar className="mr-2 h-4 w-4" /> 
              Schedule Exam
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Patients" 
          value="1,285" 
          trend={{ value: "+12%", positive: true }}
          icon={<User className="h-6 w-6" />} 
        />
        <StatCard 
          title="Studies Today" 
          value="24" 
          trend={{ value: "+4", positive: true }}
          icon={<FileSearch className="h-6 w-6" />} 
        />
        <StatCard 
          title="Pending Reports" 
          value="8" 
          trend={{ value: "-3", positive: true }}
          icon={<Activity className="h-6 w-6" />} 
        />
      </div>
      
      {/* Recent Studies Table */}
      <Card>
        <CardHeader className="px-6 py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">Recent Studies</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <StudiesTable />
        </CardContent>
      </Card>
      
      {/* Tabbed content for schedule and analytics */}
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Morning Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors">
                      <div>
                        <p className="font-medium">Patient {i}</p>
                        <p className="text-sm text-muted-foreground">CT Scan - Dr. Johnson</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{8 + i}:00 AM</p>
                        <div className="text-xs mt-1 px-2 py-1 rounded bg-blue-100 text-blue-800">Scheduled</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Afternoon Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors">
                      <div>
                        <p className="font-medium">Patient {i + 3}</p>
                        <p className="text-sm text-muted-foreground">MRI - Dr. Smith</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{12 + i}:00 PM</p>
                        <div className="text-xs mt-1 px-2 py-1 rounded bg-green-100 text-green-800">In Progress</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm">View Full Schedule</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                  Study Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-secondary/30 rounded-lg">
                  <p className="text-muted-foreground">Weekly completion chart</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Department Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-secondary/30 rounded-lg">
                  <p className="text-muted-foreground">Department activity metrics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
