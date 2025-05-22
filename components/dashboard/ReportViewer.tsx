"use client";

import React, { useState, useEffect } from 'react';
import { DatePickerWithRange } from '@/components/ui/date-picker'; // Assuming this is how DatePickerWithRange is exported
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, LineChart, PieChart } from '@/components/ui/chart'; // Assuming these are available chart types
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { convertToCSV, downloadFile } from '@/lib/export-utils'; // Import CSV utilities

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
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
      if (!dateRange?.from || !dateRange?.to) {
        setError("Please select a valid date range.");
        return;
      }
      setLoading(true);
      setError(null);
      // Format dates for API query
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

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
  }, [dateRange, activeTab]);

  const handleExportCSV = () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert('Please select a valid date range first.');
      return;
    }

    let dataToExport: any[] = [];
    let fileName = `${activeTab.replace(/([A-Z])/g, '-$1').toLowerCase()}`; // e.g. patient-stats
    fileName += `_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.csv`;

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
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-6 no-print">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reporting Dashboard</h1>
        <p className="text-muted-foreground">
          Analyze patient statistics, appointment volumes, and provider productivity.
        </p>
      </header>

      <Card className="mb-6 no-print">
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Select the start and end date for the reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
            className="w-full max-w-md" 
          />
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
                    <CardContent className="h-80"> {/* Ensure chart has enough height */}
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
                       {/* Placeholder for Line Chart - actual data would come from appointmentsPerPeriod */}
                       <LineChart data={[{name: "Jan", value: 10}, {name: "Feb", value: 20}]} />
                       <p className="text-muted-foreground mt-2">{appointmentVolumes.appointmentsPerPeriod.message}</p>
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
                    <CardContent className="h-96"> {/* Increased height for potentially more providers */}
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
