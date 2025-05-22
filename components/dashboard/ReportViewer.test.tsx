import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportViewer from './ReportViewer';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/',
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock global fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({
    totalPatients: 150,
    newPatientsInDateRange: 15,
    genderDistribution: { Male: 8, Female: 7 },
  }),
});

describe('ReportViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders basic structure', () => {
    render(<ReportViewer />);
    
    // Check for tab elements
    expect(screen.getByRole('tab', { name: 'Patient Statistics' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Appointment Volumes' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Provider Productivity' })).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByRole('button', { name: /Export to CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print View/i })).toBeInTheDocument();
  });
});
