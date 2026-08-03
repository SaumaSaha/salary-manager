import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchEmployees,
  fetchKPISummary,
  fetchDepartmentAnalytics,
  fetchCountryAnalytics,
  fetchGenderAnalytics,
  fetchDepartments,
  fetchCountries,
  fetchSalaryRange,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getExportCsvUrl,
} from './api';

global.fetch = vi.fn();

describe('API Service (`services/api.ts`)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetchEmployees requests /api/v1/employees with query parameters', async () => {
    const mockResponse = {
      data: [{ id: '1', first_name: 'John', last_name: 'Doe' }],
      pagination: { page: 1, page_size: 20, total_records: 1, total_pages: 1 },
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchEmployees({ page: 1, page_size: 20, search: 'John', department: ['Engineering'] });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/employees?page=1&page_size=20&search=John&department=Engineering')
    );
    expect(result).toEqual(mockResponse);
  });

  it('fetchKPISummary requests /api/v1/analytics/summary', async () => {
    const mockKPI = {
      total_payroll_usd: 100000,
      average_salary_usd: 50000,
      median_salary_usd: 50000,
      min_salary_usd: 40000,
      max_salary_usd: 60000,
      employee_count: 2,
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPI,
    } as Response);

    const result = await fetchKPISummary();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/analytics/summary')
    );
    expect(result).toEqual(mockKPI);
  });

  it('fetchDepartmentAnalytics requests /api/v1/analytics/by-department', async () => {
    const mockData = { departments: [{ department: 'Engineering', employee_count: 10, total_payroll_usd: 500000, average_salary_usd: 50000 }] };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await fetchDepartmentAnalytics();
    expect(result).toEqual(mockData);
  });

  it('fetchCountryAnalytics requests /api/v1/analytics/by-country', async () => {
    const mockData = { countries: [{ country: 'USA', employee_count: 5, total_payroll_usd: 300000, percentage_payroll: 60 }] };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await fetchCountryAnalytics();
    expect(result).toEqual(mockData);
  });

  it('fetchGenderAnalytics requests /api/v1/analytics/by-gender', async () => {
    const mockData = { gender_metrics: [{ gender: 'Female', average_salary_usd: 60000, headcount: 10 }] };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await fetchGenderAnalytics();
    expect(result).toEqual(mockData);
  });

  it('fetchMetadata functions retrieve filter dropdown choices', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ departments: ['Engineering', 'Product'] }),
    } as Response);
    const depts = await fetchDepartments();
    expect(depts).toEqual(['Engineering', 'Product']);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ countries: ['USA', 'India'] }),
    } as Response);
    const countries = await fetchCountries();
    expect(countries).toEqual(['USA', 'India']);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ min_usd_salary: 10000, max_usd_salary: 300000 }),
    } as Response);
    const range = await fetchSalaryRange();
    expect(range).toEqual({ min_usd_salary: 10000, max_usd_salary: 300000 });
  });

  it('createEmployee sends POST request with payload', async () => {
    const payload = {
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice@acme.com',
      job_title: 'Software Engineer',
      department: 'Engineering',
      country: 'USA',
      base_salary: 120000,
      currency: 'USD',
      gender: 'Female',
      performance: 4,
      hire_date: '2023-01-15',
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'new-id', ...payload, usd_salary: 120000 }),
    } as Response);

    const result = await createEmployee(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/employees'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    expect(result.id).toBe('new-id');
  });

  it('updateEmployee sends PUT request', async () => {
    const updateData = { base_salary: 130000 };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'emp-1', base_salary: 130000 }),
    } as Response);

    const result = await updateEmployee('emp-1', updateData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/employees/emp-1'),
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
    );
    expect(result.base_salary).toBe(130000);
  });

  it('deleteEmployee sends DELETE request', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Employee deleted successfully' }),
    } as Response);

    await deleteEmployee('emp-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/employees/emp-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('getExportCsvUrl formats export endpoint with filters', () => {
    const url = getExportCsvUrl({ search: 'Jane', department: ['Sales'] });
    expect(url).toContain('/api/v1/export/csv?search=Jane&department=Sales');
  });
});
