import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportViewer from './ReportViewer'; // Adjust path as necessary
import * as exportUtils from '@/lib/export-utils'; // To mock convertToCSV and downloadFile
import { format, addDays } from 'date-fns';

// Mock Next.js router if needed (not directly used by ReportViewer, but good practice if sub-components might use it)
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock chart components (already done via __mocks__/@/components/ui/chart.tsx)
jest.mock('@/components/ui/chart');
// Mock date picker component (already done via __mocks__/@/components/ui/date-picker.tsx)
jest.mock('@/components/ui/date-picker');


// Mock global fetch
global.fetch = jest.fn();

// Mock utility functions
jest.mock('@/lib/export-utils', () => ({
  convertToCSV: jest.fn(),
  downloadFile: jest.fn(),
}));

// Mock window.print
global.print = jest.fn();


const mockPatientStatsData = {
  totalPatients: 150,
  newPatientsInDateRange: 15,
  genderDistribution: { Male: 8, Female: 7 },
};

const mockAppointmentVolumesData = {
  totalAppointmentsInDateRange: 35,
  statusDistribution: { SCHEDULED: 10, COMPLETED: 20, CANCELLED: 5 },
  appointmentsPerPeriod: { message: "Daily breakdown chart would go here." }
};

const mockProviderProductivityData = {
  providerProductivity: [
    { providerId: 'prov1', providerName: 'Dr. Alpha', providerSpecialty: 'Cardiology', appointmentCount: 20, proceduresPerformed: 20 },
    { providerId: 'prov2', providerName: 'Dr. Beta', providerSpecialty: 'Pediatrics', appointmentCount: 15, proceduresPerformed: 15 },
  ]
};


describe('ReportViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockPatientStatsData }), // Default to patient stats
    });
  });

  const renderComponent = () => render(<ReportViewer />);

  test('renders basic structure: date picker, tabs, and action buttons', async () => {
    renderComponent();
    expect(screen.getByTestId('mock-date-picker')).toBeInTheDocument();
    expect(screen.getByText('Patient Statistics')).toBeInTheDocument();
    expect(screen.getByText('Appointment Volumes')).toBeInTheDocument();
    expect(screen.getByText('Provider Productivity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export to CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print View/i })).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1)); // Initial fetch
  });

  test('initially loads Patient Statistics tab and displays its data', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(mockPatientStatsData.totalPatients.toString())).toBeInTheDocument();
      expect(screen.getByText(mockPatientStatsData.newPatientsInDateRange.toString())).toBeInTheDocument();
      expect(screen.getByTestId('mock-pie-chart')).toHaveTextContent(JSON.stringify(
        Object.entries(mockPatientStatsData.genderDistribution).map(([name, value]) => ({ name, value }))
      ));
    });
  });

  test('switches to Appointment Volumes tab and displays its data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ // For initial load (patient)
      ok: true,
      json: async () => mockPatientStatsData,
    }).mockResolvedValueOnce({ // For appointment volumes tab
      ok: true,
      json: async () => mockAppointmentVolumesData,
    });

    renderComponent();
    await act(async () => {
      fireEvent.click(screen.getByText('Appointment Volumes'));
    });
    
    await waitFor(() => {
      expect(screen.getByText(mockAppointmentVolumesData.totalAppointmentsInDateRange.toString())).toBeInTheDocument();
      expect(screen.getByTestId('mock-bar-chart')).toHaveTextContent(JSON.stringify(
         Object.entries(mockAppointmentVolumesData.statusDistribution).map(([name, value]) => ({ name, value }))
      ));
    });
    expect(fetch).toHaveBeenCalledTimes(2); // Initial + 1 for tab switch
  });

  test('switches to Provider Productivity tab and displays its data', async () => {
     (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPatientStatsData,
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProviderProductivityData,
    });
    
    renderComponent();
    await act(async () => {
      fireEvent.click(screen.getByText('Provider Productivity'));
    });

    await waitFor(() => {
      expect(screen.getByText(mockProviderProductivityData.providerProductivity[0].providerName)).toBeInTheDocument();
      expect(screen.getByText(mockProviderProductivityData.providerProductivity[0].appointmentCount.toString())).toBeInTheDocument();
       expect(screen.getByTestId('mock-bar-chart')).toHaveTextContent(JSON.stringify(
        mockProviderProductivityData.providerProductivity.map(p => ({ name: p.providerName, value: p.appointmentCount }))
      ));
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('calls export utilities when "Export to CSV" is clicked for Patient Stats', async () => {
    const mockCsvString = "gender,count\nMale,8\nFemale,7";
    (exportUtils.convertToCSV as jest.Mock).mockReturnValue(mockCsvString);
    
    renderComponent(); // Patient stats is default
    await waitFor(() => expect(fetch).toHaveBeenCalled()); // Wait for initial data load

    fireEvent.click(screen.getByRole('button', { name: /Export to CSV/i }));

    expect(exportUtils.convertToCSV).toHaveBeenCalledWith(
      Object.entries(mockPatientStatsData.genderDistribution).map(([gender, count]) => ({ gender, count }))
    );
    const expectedStartDate = format(addDays(new Date(), -30), 'yyyy-MM-dd');
    const expectedEndDate = format(new Date(), 'yyyy-MM-dd');
    expect(exportUtils.downloadFile).toHaveBeenCalledWith(
      `patient-stats_${expectedStartDate}_to_${expectedEndDate}.csv`,
      mockCsvString
    );
  });
  
  test('calls export utilities when "Export to CSV" is clicked for Appointment Volumes', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ // Initial patient stats
      ok: true, json: async () => mockPatientStatsData,
    }).mockResolvedValueOnce({ // Appointment volumes data
      ok: true, json: async () => mockAppointmentVolumesData,
    });
    const mockCsvString = "status,count\nSCHEDULED,10\nCOMPLETED,20\nCANCELLED,5";
    (exportUtils.convertToCSV as jest.Mock).mockReturnValue(mockCsvString);

    renderComponent();
    await act(async () => {
      fireEvent.click(screen.getByText('Appointment Volumes'));
    });
    await waitFor(() => expect(screen.getByText(mockAppointmentVolumesData.totalAppointmentsInDateRange.toString())).toBeInTheDocument());


    fireEvent.click(screen.getByRole('button', { name: /Export to CSV/i }));

    expect(exportUtils.convertToCSV).toHaveBeenCalledWith(
      Object.entries(mockAppointmentVolumesData.statusDistribution).map(([status, count]) => ({ status, count }))
    );
    // Dates would be based on the date picker's state, using default for mock
    const expectedStartDate = format(addDays(new Date(), -30), 'yyyy-MM-dd');
    const expectedEndDate = format(new Date(), 'yyyy-MM-dd');
    expect(exportUtils.downloadFile).toHaveBeenCalledWith(
      `appointment-volumes_${expectedStartDate}_to_${expectedEndDate}.csv`,
      mockCsvString
    );
  });


  test('calls window.print when "Print View" is clicked', async () => {
    renderComponent();
    await waitFor(() => expect(fetch).toHaveBeenCalled()); 

    fireEvent.click(screen.getByRole('button', { name: /Print View/i }));
    expect(global.print).toHaveBeenCalledTimes(1);
  });

  test('displays loading state', async () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Promise that never resolves
    renderComponent();
    expect(await screen.findByText(/Loading report data.../i)).toBeInTheDocument();
  });

  test('displays error state if fetch fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    renderComponent();
    expect(await screen.findByText(/Error: API Error/i)).toBeInTheDocument();
  });
  
  test('changing date range triggers new data fetch', async () => {
    renderComponent();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1)); // Initial fetch

    // Simulate date change via mocked DatePickerWithRange
    // The mock directly calls onDateChange, so we find a button in it and click
    const fromDateButton = screen.getByTestId('mock-date-picker-from');
    await act(async () => {
      fireEvent.click(fromDateButton); 
    });
    
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); 
    // Check if fetch was called with new dates (depends on how mock date picker updates)
    // The mock date picker sets from: 2023-01-01
    const expectedStartDate = '2023-01-01';
    // Default 'to' date is 'today', but the mock for 'to' button sets '2023-01-31'
    // Let's assume the second call used the default 'to' from initial state as only 'from' was clicked
    const expectedEndDate = format(new Date(), 'yyyy-MM-dd'); 
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining(
      `/api/reports/patientStats?startDate=${expectedStartDate}&endDate=${expectedEndDate}`
    ));
  });

});
