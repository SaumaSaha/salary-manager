import {
  KPISummary,
  DepartmentAnalytics,
  CountryAnalytics,
  GenderAnalytics,
} from '../types';
import { API_BASE, handleResponse } from './client';

export async function fetchKPISummary(): Promise<KPISummary> {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  return handleResponse<KPISummary>(res);
}

export async function fetchDepartmentAnalytics(): Promise<DepartmentAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/by-department`);
  const data = await handleResponse<DepartmentAnalytics>(res);
  return { departments: data?.departments || [] };
}

export async function fetchCountryAnalytics(): Promise<CountryAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/by-country`);
  const data = await handleResponse<CountryAnalytics>(res);
  return { countries: data?.countries || [] };
}

export async function fetchGenderAnalytics(): Promise<GenderAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/by-gender`);
  const data = await handleResponse<GenderAnalytics>(res);
  return { gender_metrics: data?.gender_metrics || [] };
}
