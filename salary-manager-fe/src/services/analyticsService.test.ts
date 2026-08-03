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

  it('fetchDepartmentAnalytics handles backend items array response', async () => {
    const mockItems = [{ department: 'Engineering', employee_count: 10, total_payroll_usd: 500000, average_salary_usd: 50000 }];
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockItems }),
    } as Response);

    const result = await fetchDepartmentAnalytics();
    expect(result.departments).toEqual(mockItems);
  });

  it('fetchCountryAnalytics handles backend items array response', async () => {
    const mockItems = [{ country: 'USA', employee_count: 5, total_payroll_usd: 300000, percentage_of_payroll: 60 }];
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockItems }),
    } as Response);

    const result = await fetchCountryAnalytics();
    expect(result.countries).toEqual(mockItems);
  });

  it('fetchGenderAnalytics handles backend items array response', async () => {
    const mockItems = [{ gender: 'Female', average_salary_usd: 60000, employee_count: 10, total_payroll_usd: 600000 }];
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockItems }),
    } as Response);

    const result = await fetchGenderAnalytics();
    expect(result.gender_metrics).toEqual(mockItems);
  });
});
