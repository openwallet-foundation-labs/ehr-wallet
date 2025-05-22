"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { addDays, format } from 'date-fns';
import { convertToCSV, downloadFile } from '@/lib/export-utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

// Simple chart components
const PieChart = ({ data }: { data: { name: string; value: number }[] }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-64 h-64 relative">
      {data.map((item, i) => {
        const percentage = (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100;
        const rotation = data.slice(0, i).reduce((sum, d) => 
          sum + (d.value / data.reduce((s, d) => s + d.value, 0)) * 360, 0);
        
        return (
          <div 
            key={item.name}
            className="absolute inset-0 rounded-full border-8 border-transparent"
            style={{
              background: `conic-gradient(
                from ${rotation}deg,
                hsl(${i * 137.5}, 70%, 60%}) 0%,
                hsl(${i * 137.5}, 70%, 60%}) ${percentage}%,
                transparent ${percentage}%,
                transparent 100%
              )`,
              transform: 'rotate(-90deg)'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotate(90deg)' }}>
              <span className="text-sm font-medium">{percentage.toFixed(0)}%</span>
            </div>
          </div>
        );
      })}
    </div>
    <div className="ml-8">
      {data.map((item, i) => (
        <div key={item.name} className="flex items-center mb-2">
          <div 
            className="w-4 h-4 mr-2 rounded-full" 
            style={{ backgroundColor: `hsl(${i * 137.5}, 70%, 60%})` }}
          />
          <span className="text-sm">{item.name}: {item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const BarChart = ({ data }: { data: { name: string; value: number }[] }) => (
  <div className="w-full h-64 flex items-end justify-between gap-2 px-4">
    {data.map((item, i) => {
      const maxValue = Math.max(...data.map(d => d.value), 1);
      const height = (item.value / maxValue) * 100;
      
      return (
        <div key={item.name} className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-blue-500 rounded-t-sm" 
            style={{ height: `${height}%`, minHeight: '1px' }}
          />
          <div className="text-xs mt-1 text-center">{item.name}</div>
          <div className="text-xs text-muted-foreground">{item.value}</div>
        </div>
      );
    })}
  </div>
);

const LineChart = ({ data }: { data: { name: string; value: number }[] }) => (
  <div className="w-full h-64 relative p-4">
    <div className="absolute inset-0 grid grid-cols-6 gap-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-t border-gray-200" />
      ))}
    </div>
    
    <div className="relative h-full flex items-end">
      {data.map((item, i) => {
        const maxValue = Math.max(...data.map(d => d.value), 1);
        const height = (item.value / maxValue) * 100;
        const left = (i / (data.length - 1 || 1)) * 100;
        
        return (
          <div 
            key={item.name}
            className="absolute bottom-0 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"
            style={{ left: `${left}%`, bottom: `${height}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs">
              {item.value}
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs">
              {item.name}
            </div>
            {i > 0 && (
              <div 
                className="absolute w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: `${Math.sqrt(Math.pow(100 / (data.length - 1), 2) + Math.pow(100 - height, 2))}%`,
                  transform: 'rotate(45deg)',
                  transformOrigin: 'left center'
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// Define interfaces for the expected report data structures
interface PatientStatsData {
  totalPatients: number;
  newPatientsInDateRange: number;
  genderDistribution: Record<string, number>;
}

interface AppointmentVolumesData {
  totalAppointmentsInDateRange: number;
  statusDistribution: Record<string, number>;
  appointmentsPerPeriod: { message: string; details?: string }; // Or a more structured data for actual charting
}

interface ProviderProductivityData {
  providerId: string;
  providerName: string;
  providerSpecialty: string | null;
  appointmentCount: number;
  proceduresPerformed: number;
}

type ReportType = 'patientStats' | 'appointmentVolumes' | 'providerProductivity';

const ReportViewer: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<ReportType>('patientStats');

  // Mock data - replace with actual API calls
  const [patientStats, setPatientStats] = useState<PatientStatsData | null>(null);
  const [appointmentVolumes, setAppointmentVolumes] = useState<AppointmentVolumesData | null>(null);
  const [providerProductivity, setProviderProductivity] = useState<ProviderProductivityData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate fetching data when dateRange or activeTab changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDate) {
        setError("Please select a valid date.");
        return;
      }
      setLoading(true);
      setError(null);
      // Format date for API query
      const startDate = format(addDays(selectedDate, -30), 'yyyy-MM-dd'); // Show data from 30 days before selected date
      const endDate = format(selectedDate, 'yyyy-MM-dd');

      try {
        // Simulate API calls
        console.log(`Fetching data for ${activeTab} from ${startDate} to ${endDate}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

        if (activeTab === 'patientStats') {
          // const response = await fetch(`/api/reports/patient-stats?startDate=${startDate}&endDate=${endDate}`);
          // if (!response.ok) throw new Error('Failed to fetch patient stats');
          // const data = await response.json();
          // setPatientStats(data);
          setPatientStats({
            totalPatients: 1500,
            newPatientsInDateRange: 75,
            genderDistribution: { 'Male': 40, 'Female': 30, 'Other': 5 },
          });
        } else if (activeTab === 'appointmentVolumes') {
          // const response = await fetch(`/api/reports/appointment-volumes?startDate=${startDate}&endDate=${endDate}`);
          // if (!response.ok) throw new Error('Failed to fetch appointment volumes');
          // const data = await response.json();
          // setAppointmentVolumes(data);
          setAppointmentVolumes({
            totalAppointmentsInDateRange: 350,
            statusDistribution: { 'SCHEDULED': 100, 'COMPLETED': 200, 'CANCELLED': 30, 'NO_SHOW': 20 },
            appointmentsPerPeriod: { message: "Daily breakdown chart would go here." }
          });
        } else if (activeTab === 'providerProductivity') {
          // const response = await fetch(`/api/reports/provider-productivity?startDate=${startDate}&endDate=${endDate}`);
          // if (!response.ok) throw new Error('Failed to fetch provider productivity');
          // const data = await response.json();
          // setProviderProductivity(data.providerProductivity);
          setProviderProductivity([
            { providerId: 'prov1', providerName: 'Dr. Smith', providerSpecialty: 'Cardiology', appointmentCount: 50, proceduresPerformed: 50 },
            { providerId: 'prov2', providerName: 'Dr. Jones', providerSpecialty: 'Pediatrics', appointmentCount: 70, proceduresPerformed: 70 },
            { providerId: 'prov3', providerName: 'Dr. Who', providerSpecialty: 'Neurology', appointmentCount: 30, proceduresPerformed: 30 },
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setPatientStats(null);
        setAppointmentVolumes(null);
        setProviderProductivity(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, activeTab]);

  const handleExportCSV = () => {
    if (!selectedDate) {
      alert('Please select a valid date first.');
      return;
    }

    let dataToExport: any[] = [];
    let fileName = `${activeTab.replace(/([A-Z])/g, '-$1').toLowerCase()}`; // e.g. patient-stats
    const endDate = format(selectedDate, 'yyyy-MM-dd');
    const startDate = format(addDays(selectedDate, -30), 'yyyy-MM-dd');
    fileName += `_${startDate}_to_${endDate}.csv`;

    console.log(`Exporting ${activeTab} to ${fileName}`);

    if (activeTab === 'patientStats' && patientStats) {
      // For patient stats, we might export the gender distribution
      // Or create a more structured export for all stats
      dataToExport = Object.entries(patientStats.genderDistribution).map(([gender, count]) => ({
        gender,
        count,
      }));
      // Could also add summary stats:
      // dataToExport.unshift({ metric: "Total Patients", value: patientStats.totalPatients });
      // dataToExport.unshift({ metric: "New Patients in Range", value: patientStats.newPatientsInDateRange });
      // For simplicity, we'll just export the gender distribution table for now.
      if (dataToExport.length === 0) {
        alert("No patient gender data to export.");
        return;
      }
    } else if (activeTab === 'appointmentVolumes' && appointmentVolumes) {
      // Exporting status distribution
      dataToExport = Object.entries(appointmentVolumes.statusDistribution).map(([status, count]) => ({
        status,
        count,
      }));
       if (dataToExport.length === 0) {
        alert("No appointment volume data to export.");
        return;
      }
    } else if (activeTab === 'providerProductivity' && providerProductivity) {
      dataToExport = providerProductivity.map(p => ({
        providerName: p.providerName,
        providerSpecialty: p.providerSpecialty,
        appointmentCount: p.appointmentCount,
        // proceduresPerformed: p.proceduresPerformed, // Already same as appointmentCount in mock
      }));
       if (dataToExport.length === 0) {
        alert("No provider productivity data to export.");
        return;
      }
    } else {
      alert('No data available to export for the selected report or report not found.');
      return;
    }

    if (dataToExport.length > 0) {
      try {
        const csvString = convertToCSV(dataToExport);
        downloadFile(fileName, csvString);
      } catch (e) {
        console.error("Error during CSV export:", e);
        alert("Failed to export data as CSV. Please check the console for errors.");
      }
    } else {
      // This case is mostly handled above, but as a fallback
      alert(`No data processed for export for ${activeTab}.`);
    }
  };

  const handlePrintView = () => {
    console.log('Print View triggered for', activeTab);
    window.print();
  };
  
  // --- Chart Data Preparation ---
  const patientGenderChartData = patientStats ? Object.entries(patientStats.genderDistribution).map(([name, value]) => ({ name, value })) : [];
  const appointmentStatusChartData = appointmentVolumes ? Object.entries(appointmentVolumes.statusDistribution).map(([name, value]) => ({ name, value })) : [];
  const providerAppointmentChartData = providerProductivity ? providerProductivity.map(p => ({ name: p.providerName, value: p.appointmentCount })) : [];


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 print:p-0">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .printable-area {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .print-card {
            box-shadow: none;
            border: none;
          }
          .print-card-header {
            padding-bottom: 0.5rem;
          }
        }
        .chart-container {
          min-height: 300px;
          position: relative;
        }
      `}</style>

      <Card className="mb-6 no-print">
        <CardHeader>
          <CardTitle>Report Date</CardTitle>
          <CardDescription>Select the end date for the report period (reports show 30 days prior).</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full max-w-md justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2 mb-4 no-print">
        <Button variant="outline" onClick={handleExportCSV}>Export to CSV</Button>
        <Button variant="outline" onClick={handlePrintView}>Print View</Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-4 no-print">
          <TabsTrigger value="patientStats">Patient Statistics</TabsTrigger>
          <TabsTrigger value="appointmentVolumes">Appointment Volumes</TabsTrigger>
          <TabsTrigger value="providerProductivity">Provider Productivity</TabsTrigger>
        </TabsList>

        {error && <p className="text-red-500 mb-4 no-print">Error: {error}</p>}
        {loading && <p className="text-blue-500 mb-4 no-print">Loading report data...</p>}

        <TabsContent value="patientStats" className="printable-area">
          <Card className="print-card">
            <CardHeader className="print-card-header">
              <CardTitle>Patient Statistics</CardTitle>
              <CardDescription>Overview of patient demographics and new registrations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {patientStats && !loading && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader><CardTitle>Total Patients</CardTitle></CardHeader>
                      <CardContent><p className="text-3xl font-bold">{patientStats.totalPatients}</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>New Patients (in range)</CardTitle></CardHeader>
                      <CardContent><p className="text-3xl font-bold">{patientStats.newPatientsInDateRange}</p></CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader><CardTitle>Gender Distribution (New Patients)</CardTitle></CardHeader>
                    <CardContent className="h-80 flex items-center justify-center">
                      <PieChart data={patientGenderChartData} />
                    </CardContent>
                  </Card>

                  <Card>
                     <CardHeader><CardTitle>Gender Data Table</CardTitle></CardHeader>
                     <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Gender</TableHead>
                                    <TableHead className="text-right">Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patientGenderChartData.map(item => (
                                    <TableRow key={item.name}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-right">{item.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointmentVolumes" className="printable-area">
          <Card className="print-card">
            <CardHeader className="print-card-header">
              <CardTitle>Appointment Volumes</CardTitle>
              <CardDescription>Analysis of appointment statuses and trends.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {appointmentVolumes && !loading && (
                <>
                  <Card>
                    <CardHeader><CardTitle>Total Appointments (in range)</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">{appointmentVolumes.totalAppointmentsInDateRange}</p></CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader><CardTitle>Appointment Status Distribution</CardTitle></CardHeader>
                    <CardContent className="h-80">
                      <BarChart data={appointmentStatusChartData} />
                    </CardContent>
                  </Card>
                  <Card>
                     <CardHeader><CardTitle>Status Data Table</CardTitle></CardHeader>
                     <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointmentStatusChartData.map(item => (
                                    <TableRow key={item.name}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-right">{item.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </CardContent>
                  </Card>
                   <Card>
                    <CardHeader><CardTitle>Appointments Over Time (Placeholder)</CardTitle></CardHeader>
                    <CardContent className="h-80">
                      <LineChart data={[
                        {name: "Week 1", value: 45},
                        {name: "Week 2", value: 65},
                        {name: "Week 3", value: 58},
                        {name: "Week 4", value: 72}
                      ]} />
                      <p className="text-muted-foreground mt-2 text-center">Appointments over the past 4 weeks</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providerProductivity" className="printable-area">
          <Card className="print-card">
            <CardHeader className="print-card-header">
              <CardTitle>Provider Productivity</CardTitle>
              <CardDescription>Appointments and procedures per provider.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {providerProductivity && !loading && (
                <>
                  <Card>
                    <CardHeader><CardTitle>Appointments per Provider</CardTitle></CardHeader>
                    <CardContent className="h-96">
                      <BarChart data={providerAppointmentChartData} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Provider Productivity Table</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Provider Name</TableHead>
                                    <TableHead>Specialty</TableHead>
                                    <TableHead className="text-right">Appointments</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {providerProductivity.map(p => (
                                    <TableRow key={p.providerId}>
                                        <TableCell>{p.providerName}</TableCell>
                                        <TableCell>{p.providerSpecialty || 'N/A'}</TableCell>
                                        <TableCell className="text-right">{p.appointmentCount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportViewer;
