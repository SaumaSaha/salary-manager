import {
  KPISummary,
  DepartmentAnalytics,
  CountryAnalytics,
  GenderAnalytics,
} from '../types';
import { API_BASE, handleResponse } from './client';

export async function fetchKPISummary(): Promise<KPISummary> {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  const data = await handleResponse<KPISummary>(res);
  return {
    ...data,
    min_salary_usd: data?.min_salary_usd ?? data?.lowest_salary_usd ?? 0,
    max_salary_usd: data?.max_salary_usd ?? data?.highest_salary_usd ?? 0,
  };
}

export async function fetchDepartmentAnalytics(): Promise<DepartmentAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/by-department`);
  const data = await handleResponse<DepartmentAnalytics & { items?: DepartmentAnalytics['departments'] }>(res);
  return { departments: data?.departments || data?.items || [] };
}

export async function fetchCountryAnalytics(): Promise<CountryAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/by-country`);
  const data = await handleResponse<CountryAnalytics & { items?: CountryAnalytics['countries'] }>(res);
  return { countries: data?.countries || data?.items || [] };
}

export async function fetchGenderAnalytics(): Promise<GenderAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/by-gender`);
  const data = await handleResponse<GenderAnalytics & { items?: GenderAnalytics['gender_metrics'] }>(res);
  return { gender_metrics: data?.gender_metrics || data?.items || [] };
}
