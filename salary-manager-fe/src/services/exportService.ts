import { EmployeeFilterParams } from '../types';
import { API_BASE } from './client';

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
