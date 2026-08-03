import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalyticsCharts from './AnalyticsCharts';
import { DepartmentAnalytics, CountryAnalytics, GenderAnalytics } from '../types';

describe('AnalyticsCharts Component', () => {
  const deptData: DepartmentAnalytics = {
    departments: [
      { department: 'Engineering', employee_count: 50, total_payroll_usd: 5000000, average_salary_usd: 100000 },
    ],
  };

  const countryData: CountryAnalytics = {
    countries: [
      { country: 'USA', employee_count: 30, total_payroll_usd: 3500000, percentage_payroll: 70 },
    ],
  };

  const genderData: GenderAnalytics = {
    gender_metrics: [
      { gender: 'Male', average_salary_usd: 95000, headcount: 25 },
      { gender: 'Female', average_salary_usd: 98000, headcount: 25 },
    ],
  };

  it('renders section headers and analytical cards', () => {
    render(
      <AnalyticsCharts
        departmentData={deptData}
        countryData={countryData}
        genderData={genderData}
        loading={false}
      />
    );

    expect(screen.getByText(/department spend/i)).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText(/country distribution/i)).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
    expect(screen.getByText(/pay equity by gender/i)).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
  });

  it('renders skeleton cards when loading is true', () => {
    const { container } = render(<AnalyticsCharts loading={true} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBe(3);
  });

  it('renders empty placeholders when datasets are empty or null', () => {
    render(
      <AnalyticsCharts
        departmentData={{ departments: [] }}
        countryData={{ countries: [] }}
        genderData={{ gender_metrics: [] }}
        loading={false}
      />
    );

    expect(screen.getByText('No department metrics available')).toBeInTheDocument();
    expect(screen.getByText('No country metrics available')).toBeInTheDocument();
    expect(screen.getByText('No gender parity metrics available')).toBeInTheDocument();
  });

  it('handles fallback property names and 0 fallbacks for percentage and headcount', () => {
    const fallbackCountryData: CountryAnalytics = {
      countries: [
        { country: 'India', employee_count: 10, total_payroll_usd: 200000, percentage_of_payroll: 25.5 },
        { country: 'Germany', employee_count: 5, total_payroll_usd: 0, percentage_payroll: 0 },
      ],
    };
    const fallbackGenderData: GenderAnalytics = {
      gender_metrics: [
        { gender: 'Non-Binary', average_salary_usd: 0, employee_count: 5 },
        { gender: 'Other', average_salary_usd: 0 },
      ],
    };

    render(
      <AnalyticsCharts
        departmentData={null}
        countryData={fallbackCountryData}
        genderData={fallbackGenderData}
      />
    );

    expect(screen.getByText('25.5% spend')).toBeInTheDocument();
    expect(screen.getByText('0.0% spend')).toBeInTheDocument();
    expect(screen.getByText('Headcount: 5')).toBeInTheDocument();
    expect(screen.getByText('Headcount: 0')).toBeInTheDocument();
  });
});
