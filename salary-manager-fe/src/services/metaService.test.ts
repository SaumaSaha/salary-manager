import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchDepartments,
  fetchCountries,
  fetchSalaryRange,
} from './metaService';

global.fetch = vi.fn();

describe('Meta Service (`services/metaService.ts`)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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

  it('fetchMetadata functions handle missing response fields with defaults', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);
    const depts = await fetchDepartments();
    expect(depts).toEqual([]);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);
    const countries = await fetchCountries();
    expect(countries).toEqual([]);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);
    const range = await fetchSalaryRange();
    expect(range).toEqual({ min_usd_salary: 0, max_usd_salary: 500000 });
  });
});
