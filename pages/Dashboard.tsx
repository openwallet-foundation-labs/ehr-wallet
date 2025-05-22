
import { Calendar, User, FileSearch, Clock, Activity, BarChart3 } from "lucide-react";
import { useRouter } from "next/router";
import { StatCard } from "@/components/dashboard/StatCard";
import { StudiesTable } from "@/components/dashboard/StudiesTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const Dashboard = () => {
  const router = useRouter();
  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to RadGlobal RIS</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/patients/register')}>
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
      
      {/* Today's Schedule */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/scheduling">View Full Schedule</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/analytics" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Morning Appointments</h3>
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
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Afternoon Appointments</h3>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
