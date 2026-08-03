import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import KPICards from './KPICards';
import { KPISummary } from '../types';

describe('KPICards Component', () => {
  const mockData: KPISummary = {
    total_payroll_usd: 485000000,
    average_salary_usd: 48500,
    median_salary_usd: 45200,
    min_salary_usd: 18000,
    max_salary_usd: 350000,
    employee_count: 10000,
  };

  it('renders loading state when kpi is null', () => {
    render(<KPICards kpi={null} loading={true} />);
    expect(screen.getByTestId('kpi-skeleton')).toBeInTheDocument();
  });

  it('renders executive summary cards formatted accurately', () => {
    render(<KPICards kpi={mockData} loading={false} />);

    expect(screen.getByText('Total Payroll')).toBeInTheDocument();
    expect(screen.getByText('$485,000,000')).toBeInTheDocument();

    expect(screen.getByText('Average Salary')).toBeInTheDocument();
    expect(screen.getByText('$48,500')).toBeInTheDocument();

    expect(screen.getByText('Median Salary')).toBeInTheDocument();
    expect(screen.getByText('$45,200')).toBeInTheDocument();

    expect(screen.getByText('Headcount')).toBeInTheDocument();
    expect(screen.getByText('10,000')).toBeInTheDocument();

    expect(screen.getByText('Min / Max Salary')).toBeInTheDocument();
    expect(screen.getByText('$18,000 / $350,000')).toBeInTheDocument();
  });
});
