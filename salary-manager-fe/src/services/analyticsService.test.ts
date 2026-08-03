import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchKPISummary,
  fetchDepartmentAnalytics,
  fetchCountryAnalytics,
  fetchGenderAnalytics,
} from './analyticsService';

global.fetch = vi.fn();

describe('Analytics Service (`services/analyticsService.ts`)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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
});
