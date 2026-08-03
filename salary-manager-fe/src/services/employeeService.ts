import {
  Employee,
  PaginationMeta,
  EmployeeListResponse,
  EmployeeFilterParams,
  EmployeeFormData,
} from '../types';
import { API_BASE, handleResponse } from './client';

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
