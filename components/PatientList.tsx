import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, User, Filter, Loader2, CalendarIcon, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

type Patient = {
  id: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
  lastVisit: string;
  email?: string;
  address?: string;
};

const PatientList = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date filter state
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [dateFilterType, setDateFilterType] = useState<"lastVisit" | "dob">("lastVisit");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Fetch patients from the API with retry logic
  useEffect(() => {
    const fetchPatients = async (retryCount = 0) => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/patients');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server response error:', response.status, errorData);
          throw new Error(`Failed to fetch patients: ${response.status} ${errorData.details || ''}`);
        }
        
        const data = await response.json();
        setPatients(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching patients:', err);
        
        // Implement retry logic (max 3 retries with exponential backoff)
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 500; // 500ms, 1000ms, 2000ms
          console.log(`Retrying fetch in ${delay}ms (attempt ${retryCount + 1}/3)`);
          
          setTimeout(() => {
            fetchPatients(retryCount + 1);
          }, delay);
          return;
        }
        
        setError('Failed to load patients. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatients();
  }, []);
  
  // Clear date filters
  const clearDateFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setIsFiltering(false);
  };
  
  // Format date for display
  const formatDate = (date: Date | undefined): string => {
    return date ? format(date, 'MMM dd, yyyy') : '';
  };
  
  // Filter patients by search query and dates
  const filteredPatients = patients.filter(patient => {
    // Text search filter
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    // Date filters
    if (isFiltering && (fromDate || toDate)) {
      const dateToCheck = dateFilterType === "lastVisit" ? patient.lastVisit : patient.dob;
      
      if (!dateToCheck) return false;
      
      try {
        const parsedDate = parseISO(dateToCheck);
        
        // From date filter
        if (fromDate && isBefore(parsedDate, fromDate)) {
          return false;
        }
        
        // To date filter
        if (toDate && isAfter(parsedDate, toDate)) {
          return false;
        }
        
        return true;
      } catch (e) {
        // If date parsing fails, exclude the record from filtered results
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient List</h1>
          <p className="text-muted-foreground">Manage and view patient records</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/patients/register">
              <User className="mr-2 h-4 w-4" />
              Add Patient
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Search and filter section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search patients..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {isFiltering && (
                  <Badge variant="secondary" className="ml-2 px-1 font-normal">
                    {dateFilterType === "lastVisit" ? "Visit" : "DOB"}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filter Patients By Date</h4>
                  <p className="text-sm text-muted-foreground">
                    Apply date range filters to patient records.
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Date Type:</label>
                    <Select
                      value={dateFilterType}
                      onValueChange={(value: "lastVisit" | "dob") => setDateFilterType(value)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue placeholder="Select date type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lastVisit">Last Visit</SelectItem>
                        <SelectItem value="dob">Date of Birth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">From:</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-8"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {fromDate ? formatDate(fromDate) : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={fromDate}
                              onSelect={setFromDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">To:</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-8"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {toDate ? formatDate(toDate) : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={toDate}
                              onSelect={setToDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilters}
                    disabled={!fromDate && !toDate}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsFiltering(true);
                      setDateFilterOpen(false);
                    }}
                    disabled={!fromDate && !toDate}
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="sm">Export</Button>
        </div>
      </div>
      
      {/* Patient table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Patient ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading patients...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.id}</TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>{patient.dob}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.lastVisit || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/patients/${patient.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No patients found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{filteredPatients.length}</span> of{" "}
          <span className="font-medium">{patients.length}</span> results
        </div>
      </div>
    </div>
  );
};

export default PatientList;
