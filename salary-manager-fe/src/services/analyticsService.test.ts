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

  it('fetchKPISummary requests /api/v1/analytics/summary with min/max salary fields', async () => {
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

  it('fetchKPISummary handles lowest_salary_usd and highest_salary_usd fallbacks and empty default 0', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lowest_salary_usd: 20000, highest_salary_usd: 90000 }),
    } as Response);

    const res1 = await fetchKPISummary();
    expect(res1.min_salary_usd).toBe(20000);
    expect(res1.max_salary_usd).toBe(90000);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const res2 = await fetchKPISummary();
    expect(res2.min_salary_usd).toBe(0);
    expect(res2.max_salary_usd).toBe(0);
  });

  it('fetchDepartmentAnalytics handles departments property, items fallback, and empty default', async () => {
    const mockDepts = [{ department: 'Sales', employee_count: 5, total_payroll_usd: 250000, average_salary_usd: 50000 }];
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ departments: mockDepts }),
    } as Response);

    const res1 = await fetchDepartmentAnalytics();
    expect(res1.departments).toEqual(mockDepts);

    const mockItems = [{ department: 'Engineering', employee_count: 10, total_payroll_usd: 500000, average_salary_usd: 50000 }];
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockItems }),
    } as Response);

    const res2 = await fetchDepartmentAnalytics();
    expect(res2.departments).toEqual(mockItems);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const res3 = await fetchDepartmentAnalytics();
    expect(res3.departments).toEqual([]);
  });

  it('fetchCountryAnalytics handles countries property, items fallback, and empty default', async () => {
    const mockCountries = [{ country: 'Germany', employee_count: 3, total_payroll_usd: 180000, percentage_payroll: 30 }];
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ countries: mockCountries }),
    } as Response);

    const res1 = await fetchCountryAnalytics();
    expect(res1.countries).toEqual(mockCountries);

    const mockItems = [{ country: 'USA', employee_count: 5, total_payroll_usd: 300000, percentage_of_payroll: 60 }];
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockItems }),
    } as Response);

    const res2 = await fetchCountryAnalytics();
    expect(res2.countries).toEqual(mockItems);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const res3 = await fetchCountryAnalytics();
    expect(res3.countries).toEqual([]);
  });

  it('fetchGenderAnalytics handles gender_metrics property, items fallback, and empty default', async () => {
    const mockMetrics = [{ gender: 'Male', average_salary_usd: 60000, employee_count: 10, total_payroll_usd: 600000 }];
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ gender_metrics: mockMetrics }),
    } as Response);

    const res1 = await fetchGenderAnalytics();
    expect(res1.gender_metrics).toEqual(mockMetrics);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockMetrics }),
    } as Response);

    const res2 = await fetchGenderAnalytics();
    expect(res2.gender_metrics).toEqual(mockMetrics);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const res3 = await fetchGenderAnalytics();
    expect(res3.gender_metrics).toEqual([]);
  });
});
