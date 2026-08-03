import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './page';
import Providers from './providers';

vi.mock('../services/api', () => ({
  fetchEmployees: vi.fn().mockResolvedValue({
    data: [],
    items: [],
    pagination: { page: 1, page_size: 20, total_records: 0, total_pages: 0 },
  }),
  fetchKPISummary: vi.fn().mockResolvedValue({
    total_payroll_usd: 0,
    average_salary_usd: 0,
    median_salary_usd: 0,
    min_salary_usd: 0,
    max_salary_usd: 0,
    employee_count: 0,
  }),
  fetchDepartmentAnalytics: vi.fn().mockResolvedValue({ departments: [] }),
  fetchCountryAnalytics: vi.fn().mockResolvedValue({ countries: [] }),
  fetchGenderAnalytics: vi.fn().mockResolvedValue({ gender_metrics: [] }),
  fetchDepartments: vi.fn().mockResolvedValue([]),
  fetchCountries: vi.fn().mockResolvedValue([]),
  fetchSalaryRange: vi.fn().mockResolvedValue({ min_usd_salary: 0, max_usd_salary: 100000 }),
  createEmployee: vi.fn().mockResolvedValue({ id: 'new-emp' }),
  updateEmployee: vi.fn().mockResolvedValue({ id: 'emp-1' }),
  deleteEmployee: vi.fn().mockResolvedValue({ message: 'Deleted' }),
  getExportCsvUrl: vi.fn().mockReturnValue('http://localhost:8000/api/v1/export/csv'),
}));

describe('Home Page Dashboard', () => {
  it('renders navbar header and ACME branding', async () => {
    await act(async () => {
      render(
        <Providers>
          <Home />
        </Providers>
      );
    });
    const title = screen.getByText('ACME Salary Manager');
    expect(title).toBeInTheDocument();
  });
});
