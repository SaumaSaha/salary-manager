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
    expect(screen.getByText(/country distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/pay equity by gender/i)).toBeInTheDocument();
  });
});
