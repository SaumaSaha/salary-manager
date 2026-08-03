import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from './employeeService';

global.fetch = vi.fn();

describe('Employee Service (`services/employeeService.ts`)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetchEmployees requests /api/v1/employees with query parameters', async () => {
    const mockResponse = {
      items: [{ id: '1', first_name: 'John', last_name: 'Doe' }],
      pagination: { page: 1, page_size: 20, total_records: 1, total_pages: 1 },
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchEmployees({ page: 1, page_size: 20, search: 'John', department: ['Engineering'] });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/employees?page=1&page_size=20&search=John&department=Engineering')
    );
    expect(result.items).toEqual(mockResponse.items);
  });

  it('createEmployee sends POST request with payload', async () => {
    const payload = {
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice@acme.com',
      job_title: 'Software Engineer',
      department: 'Engineering',
      country: 'USA',
      base_salary: 120000,
      currency: 'USD',
      bonus_percentage: 0,
      gender: 'Female',
      performance: 4,
      hire_date: '2023-01-15',
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'new-id', ...payload, usd_salary: 120000 }),
    } as Response);

    const result = await createEmployee(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/employees'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    expect(result.id).toBe('new-id');
  });

  it('updateEmployee sends PUT request', async () => {
    const updateData = { base_salary: 130000 };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'emp-1', base_salary: 130000 }),
    } as Response);

    const result = await updateEmployee('emp-1', updateData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/employees/emp-1'),
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
    );
    expect(result.base_salary).toBe(130000);
  });

  it('deleteEmployee sends DELETE request', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Employee deleted successfully' }),
    } as Response);

    await deleteEmployee('emp-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/employees/emp-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
