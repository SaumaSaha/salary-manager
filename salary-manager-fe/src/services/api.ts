import {
  Employee,
  PaginationMeta,
  EmployeeListResponse,
  KPISummary,
  DepartmentAnalytics,
  CountryAnalytics,
  GenderAnalytics,
  EmployeeFilterParams,
  EmployeeFormData,
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'An unexpected error occurred' }));
    throw new Error(errorData.detail || `HTTP Error ${res.status}`);
  }
  return res.json();
}

export async function fetchEmployees(params: EmployeeFilterParams = {}): Promise<EmployeeListResponse> {
  const query = new URLSearchParams();

  if (params.page) query.append('page', params.page.toString());
  if (params.page_size) query.append('page_size', params.page_size.toString());
  if (params.sort_by) query.append('sort_by', params.sort_by);
  if (params.sort_order) query.append('sort_order', params.sort_order);
  if (params.search) query.append('search', params.search);
  if (params.min_usd_salary !== undefined) query.append('min_usd_salary', params.min_usd_salary.toString());
  if (params.max_usd_salary !== undefined) query.append('max_usd_salary', params.max_usd_salary.toString());

  if (params.department) {
    params.department.forEach((dept) => query.append('department', dept));
  }
  if (params.country) {
    params.country.forEach((c) => query.append('country', c));
  }

  const res = await fetch(`${API_BASE}/employees?${query.toString()}`);
  const data = await handleResponse<{ items?: Employee[]; data?: Employee[]; pagination?: PaginationMeta }>(res);
  const list = data?.items || data?.data || [];

  return {
    items: list,
    data: list,
    pagination: data?.pagination || { page: 1, page_size: 20, total_records: 0, total_pages: 0 },
  };
}

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

export async function createEmployee(data: EmployeeFormData): Promise<Employee> {
  const res = await fetch(`${API_BASE}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Employee>(res);
}

export async function updateEmployee(id: string, data: Partial<EmployeeFormData>): Promise<Employee> {
  const res = await fetch(`${API_BASE}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Employee>(res);
}

export async function deleteEmployee(id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
  return handleResponse<{ message: string }>(res);
}

export function getExportCsvUrl(params: EmployeeFilterParams = {}): string {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.min_usd_salary !== undefined) query.append('min_usd_salary', params.min_usd_salary.toString());
  if (params.max_usd_salary !== undefined) query.append('max_usd_salary', params.max_usd_salary.toString());
  if (params.department) {
    params.department.forEach((dept) => query.append('department', dept));
  }
  if (params.country) {
    params.country.forEach((c) => query.append('country', c));
  }

  return `${API_BASE}/export/csv?${query.toString()}`;
}
