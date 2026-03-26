import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import JobCard from '../JobCard';
import type { Job } from '@/lib/supabase';

const mockJob: Job = {
  id: 'test-job-123',
  customer_name: 'Acme Corp',
  building_name: 'Main Office',
  address: '123 Main St',
  job_type: 'Modernization',
  stage: 'In Progress',
  trade: 'Elevator',
  role: 'Prime Contractor',
  has_prints: true,
  has_proposal: true,
  has_parts_list: false,
  has_permit: false,
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

describe('JobCard', () => {
  it('should render customer name', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('should render building name when present', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Main Office')).toBeInTheDocument();
  });

  it('should render address when present', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('should render job stage', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should render trade when not General', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Elevator')).toBeInTheDocument();
  });

  it('should not render trade when it is General', () => {
    const generalJob = { ...mockJob, trade: 'General' };
    render(<JobCard job={generalJob} />);
    expect(screen.queryByText('General')).not.toBeInTheDocument();
  });

  it('should render job type when present', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Modernization')).toBeInTheDocument();
  });

  it('should show missing docs warning for Scheduled stage', () => {
    const jobWithMissingDocs: Job = {
      ...mockJob,
      stage: 'Scheduled',
      has_prints: false,
      has_proposal: false,
    };

    render(<JobCard job={jobWithMissingDocs} />);
    expect(screen.getByText(/Missing:/)).toBeInTheDocument();
    expect(screen.getByText(/Prints/)).toBeInTheDocument();
  });

  it('should show missing docs warning for In Progress stage', () => {
    const jobWithMissingDocs: Job = {
      ...mockJob,
      stage: 'In Progress',
      has_prints: false,
      has_proposal: true,
    };

    render(<JobCard job={jobWithMissingDocs} />);
    expect(screen.getByText(/Missing:/)).toBeInTheDocument();
  });

  it('should not show warning for Lead stage even with missing docs', () => {
    const leadJob: Job = {
      ...mockJob,
      stage: 'Lead',
      has_prints: false,
      has_proposal: false,
    };

    render(<JobCard job={leadJob} />);
    expect(screen.queryByText(/Missing:/)).not.toBeInTheDocument();
  });

  it('should not show warning when all critical docs are present', () => {
    const completeJob: Job = {
      ...mockJob,
      stage: 'In Progress',
      has_prints: true,
      has_proposal: true,
    };

    render(<JobCard job={completeJob} />);
    expect(screen.queryByText(/Missing:/)).not.toBeInTheDocument();
  });

  it('should render as a link to job detail page', () => {
    const { container } = render(<JobCard job={mockJob} />);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/jobs/test-job-123');
  });

  it('should not render building name when null', () => {
    const jobWithoutBuilding = { ...mockJob, building_name: null };
    render(<JobCard job={jobWithoutBuilding} />);
    expect(screen.queryByText('Main Office')).not.toBeInTheDocument();
  });

  it('should not render address when null', () => {
    const jobWithoutAddress = { ...mockJob, address: null };
    render(<JobCard job={jobWithoutAddress} />);
    expect(screen.queryByText('123 Main St')).not.toBeInTheDocument();
  });
});
