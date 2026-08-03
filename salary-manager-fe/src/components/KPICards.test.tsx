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

  it('handles fallback property names lowest_salary_usd and highest_salary_usd', () => {
    const fallbackData: KPISummary = {
      total_payroll_usd: 100000,
      average_salary_usd: 50000,
      median_salary_usd: 50000,
      lowest_salary_usd: 20000,
      highest_salary_usd: 80000,
      employee_count: 2,
    };
    render(<KPICards kpi={fallbackData} loading={false} />);

    expect(screen.getByText('$20,000 / $80,000')).toBeInTheDocument();
  });

  it('handles missing value properties safely with default $0 and 0 formatting', () => {
    const emptyData = {} as KPISummary;
    render(<KPICards kpi={emptyData} loading={false} />);

    expect(screen.getByText('$0 / $0')).toBeInTheDocument();
  });
});
