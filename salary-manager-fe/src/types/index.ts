export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department: string;
  country: string;
  base_salary: number;
  currency: string;
  usd_salary: number;
  bonus_percentage: number;
  gender: string;
  performance: number;
  hire_date: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export interface EmployeeListResponse {
  items: Employee[];
  data?: Employee[];
  pagination: PaginationMeta;
}

export interface KPISummary {
  total_payroll_usd: number;
  average_salary_usd: number;
  median_salary_usd: number;
  min_salary_usd: number;
  max_salary_usd: number;
  employee_count: number;
}

export interface DepartmentMetric {
  department: string;
  employee_count: number;
  total_payroll_usd: number;
  average_salary_usd: number;
}

export interface DepartmentAnalytics {
  departments: DepartmentMetric[];
}

export interface CountryMetric {
  country: string;
  employee_count: number;
  total_payroll_usd: number;
  percentage_payroll: number;
}

export interface CountryAnalytics {
  countries: CountryMetric[];
}

export interface GenderMetric {
  gender: string;
  average_salary_usd: number;
  headcount: number;
}

export interface GenderAnalytics {
  gender_metrics: GenderMetric[];
}

export interface EmployeeFilterParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  department?: string[];
  country?: string[];
  min_usd_salary?: number;
  max_usd_salary?: number;
}

export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department: string;
  country: string;
  base_salary: number;
  currency: string;
  bonus_percentage?: number;
  gender: string;
  performance: number;
  hire_date: string;
}
