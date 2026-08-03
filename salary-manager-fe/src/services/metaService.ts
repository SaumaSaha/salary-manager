import { API_BASE, handleResponse } from './client';

export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/meta/departments`);
  const data = await handleResponse<{ departments: string[] }>(res);
  return data?.departments || [];
}

export async function fetchCountries(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/meta/countries`);
  const data = await handleResponse<{ countries: string[] }>(res);
  return data?.countries || [];
}

export async function fetchSalaryRange(): Promise<{ min_usd_salary: number; max_usd_salary: number }> {
  const res = await fetch(`${API_BASE}/meta/salary-range`);
  const data = await handleResponse<{ min_usd_salary: number; max_usd_salary: number }>(res);
  return {
    min_usd_salary: data?.min_usd_salary || 0,
    max_usd_salary: data?.max_usd_salary || 500000,
  };
}
