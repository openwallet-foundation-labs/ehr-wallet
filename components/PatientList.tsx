import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, User, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import Link from 'next/link';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import {
  Button,
  TextInput,
  Badge,
  Popover,
  Select,
  Table,
  Group,
  Stack,
  Text,
  Loader,
  Paper,
  Box,
  Flex,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

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
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
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
    setFromDate(null);
    setToDate(null);
    setIsFiltering(false);
  };

  // Format date for display
  const formatDate = (date: Date | null): string => {
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
    <Stack gap="xl">
      {/* Header section */}
      <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align="flex-start" gap="md">
        <div>
          <Text size="xl" fw={700} style={{ fontSize: '1.875rem' }}>Patient List</Text>
          <Text size="sm" c="dimmed">Manage and view patient records</Text>
        </div>

        <Group>
          <Button component={Link} href="/patients/register" leftSection={<User size={16} />}>
            Add Patient
          </Button>
        </Group>
      </Flex>

      {/* Search and filter section */}
      <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align="center" gap="md">
        <TextInput
          placeholder="Search patients..."
          leftSection={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, maxWidth: 400 }}
        />

        <Group gap="sm">
          <Popover opened={dateFilterOpen} onChange={setDateFilterOpen} position="bottom-end">
            <Popover.Target>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateFilterOpen(true)}
                leftSection={<Filter size={16} />}
              >
                Filter
                {isFiltering && (
                  <Badge variant="light" color="gray" size="sm" ml="xs">
                    {dateFilterType === "lastVisit" ? "Visit" : "DOB"}
                  </Badge>
                )}
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="md">
                <div>
                  <Text size="sm" fw={500}>Filter Patients By Date</Text>
                  <Text size="xs" c="dimmed">
                    Apply date range filters to patient records.
                  </Text>
                </div>

                <Stack gap="sm">
                  <div>
                    <Text size="sm" fw={500} mb="xs">Date Type:</Text>
                    <Select
                      value={dateFilterType}
                      onChange={(value) => setDateFilterType(value as "lastVisit" | "dob")}
                      data={[
                        { value: 'lastVisit', label: 'Last Visit' },
                        { value: 'dob', label: 'Date of Birth' },
                      ]}
                      size="sm"
                    />
                  </div>

                  <Group grow>
                    <div>
                      <Text size="sm" fw={500} mb="xs">From:</Text>
                      <Popover position="bottom-start" withArrow>
                        <Popover.Target>
                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth
                            leftSection={<CalendarIcon size={16} />}
                            style={{ justifyContent: 'flex-start' }}
                          >
                            {fromDate ? formatDate(fromDate) : "Select date"}
                          </Button>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <DatePickerInput
                            value={fromDate}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={setFromDate as any}
                            placeholder="Select date"
                            size="xs"
                          />
                        </Popover.Dropdown>
                      </Popover>
                    </div>

                    <div>
                      <Text size="sm" fw={500} mb="xs">To:</Text>
                      <Popover position="bottom-start" withArrow>
                        <Popover.Target>
                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth
                            leftSection={<CalendarIcon size={16} />}
                            style={{ justifyContent: 'flex-start' }}
                          >
                            {toDate ? formatDate(toDate) : "Select date"}
                          </Button>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <DatePickerInput
                            value={toDate}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={setToDate as any}
                            placeholder="Select date"
                            size="xs"
                          />
                        </Popover.Dropdown>
                      </Popover>
                    </div>
                  </Group>
                </Stack>

                <Group justify="space-between">
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={clearDateFilters}
                    disabled={!fromDate && !toDate}
                    leftSection={<X size={14} />}
                  >
                    Clear
                  </Button>

                  <Button
                    size="xs"
                    onClick={() => {
                      setIsFiltering(true);
                      setDateFilterOpen(false);
                    }}
                    disabled={!fromDate && !toDate}
                  >
                    Apply Filter
                  </Button>
                </Group>
              </Stack>
            </Popover.Dropdown>
          </Popover>

          <Button variant="outline" size="sm">Export</Button>
        </Group>
      </Flex>

      {/* Patient table */}
      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 120 }}>Patient ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Date of Birth</Table.Th>
              <Table.Th>Gender</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Last Visit</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: 32 }}>
                  <Group justify="center" gap="sm">
                    <Loader size="sm" />
                    <Text>Loading patients...</Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ) : error ? (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--mantine-color-red-6)' }}>
                  {error}
                </Table.Td>
              </Table.Tr>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <Table.Tr key={patient.id}>
                  <Table.Td fw={500}>{patient.id}</Table.Td>
                  <Table.Td>{patient.name}</Table.Td>
                  <Table.Td>{patient.dob}</Table.Td>
                  <Table.Td>{patient.gender}</Table.Td>
                  <Table.Td>{patient.phone}</Table.Td>
                  <Table.Td>{patient.lastVisit || 'N/A'}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => router.push(`/patients/${patient.id}`)}
                    >
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--mantine-color-dimmed)' }}>
                  No patients found matching your search.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Flex justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          Showing <Text span fw={500}>{filteredPatients.length}</Text> of{' '}
          <Text span fw={500}>{patients.length}</Text> results
        </Text>
      </Flex>
    </Stack>
  );
};

export default PatientList;
