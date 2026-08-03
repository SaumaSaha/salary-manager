import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './page';
import Providers from './providers';
import * as services from '../services';

vi.mock('../services', () => {
  const dummyEmp = {
    id: 'emp-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@acme.com',
    job_title: 'Software Engineer',
    department: 'Engineering',
    country: 'USA',
    base_salary: 120000,
    currency: 'USD',
    usd_salary: 120000,
    bonus_percentage: 10,
    gender: 'Male',
    performance: 4,
    hire_date: '2022-01-10T00:00:00Z',
    created_at: '2022-01-10T00:00:00Z',
    updated_at: '2022-01-10T00:00:00Z',
  };

  return {
    fetchEmployees: vi.fn().mockResolvedValue({
      data: [dummyEmp],
      items: [dummyEmp],
      pagination: { page: 2, page_size: 20, total_records: 45, total_pages: 3 },
    }),
    fetchKPISummary: vi.fn().mockResolvedValue({
      total_payroll_usd: 120000,
      average_salary_usd: 120000,
      median_salary_usd: 120000,
      min_salary_usd: 120000,
      max_salary_usd: 120000,
      employee_count: 45,
    }),
    fetchDepartmentAnalytics: vi.fn().mockResolvedValue({ departments: [{ department: 'Engineering', total_payroll_usd: 120000, employee_count: 45, average_salary_usd: 120000 }] }),
    fetchCountryAnalytics: vi.fn().mockResolvedValue({ countries: [{ country: 'USA', employee_count: 45, total_payroll_usd: 120000, percentage_payroll: 100 }] }),
    fetchGenderAnalytics: vi.fn().mockResolvedValue({ gender_metrics: [{ gender: 'Male', headcount: 45, average_salary_usd: 120000 }] }),
    fetchDepartments: vi.fn().mockResolvedValue(['Engineering', 'Sales']),
    fetchCountries: vi.fn().mockResolvedValue(['USA', 'India']),
    fetchSalaryRange: vi.fn().mockResolvedValue({ min_usd_salary: 10000, max_usd_salary: 500000 }),
    createEmployee: vi.fn().mockResolvedValue(dummyEmp),
    updateEmployee: vi.fn().mockResolvedValue(dummyEmp),
    deleteEmployee: vi.fn().mockResolvedValue({ message: 'Deleted' }),
    getExportCsvUrl: vi.fn().mockReturnValue('http://localhost:8000/api/v1/export/csv'),
  };
});

describe('Home Page Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navbar header, KPI summary, and employee directory', async () => {
    render(
      <Providers>
        <Home />
      </Providers>
    );

    expect(screen.getByText('ACME Salary Manager')).toBeInTheDocument();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  it('handles Export CSV button click', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <Providers>
        <Home />
      </Providers>
    );

    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportBtn);

    expect(services.getExportCsvUrl).toHaveBeenCalled();
    expect(windowOpenSpy).toHaveBeenCalledWith('http://localhost:8000/api/v1/export/csv', '_blank');
    expect(screen.getByText('Exporting employee CSV dataset...')).toBeInTheDocument();

    windowOpenSpy.mockRestore();
  });

  it('opens Add Employee modal, fills form, and submits new employee or closes modal', async () => {
    render(
      <Providers>
        <Home />
      </Providers>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /add employee/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Employee')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Add New Employee')).not.toBeInTheDocument();

    fireEvent.click(addBtn);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@acme.com' } });
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'Designer' } });

    const saveBtn = screen.getByRole('button', { name: /save employee/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(services.createEmployee).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('New employee created successfully!')).toBeInTheDocument();
    });
  });

  it('opens Edit Employee modal and submits updated employee', async () => {
    render(
      <Providers>
        <Home />
      </Providers>
    );

    const editBtn = await screen.findByTestId('edit-emp-1');
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Employee')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /save employee/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(services.updateEmployee).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Employee details updated successfully!')).toBeInTheDocument();
    });
  });

  it('opens Delete Employee modal and confirms deletion or closes modal', async () => {
    render(
      <Providers>
        <Home />
      </Providers>
    );

    const deleteBtn = await screen.findByTestId('delete-emp-1');
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/delete employee record/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText(/delete employee record/i)).not.toBeInTheDocument();

    fireEvent.click(deleteBtn);

    const confirmBtns = screen.getAllByRole('button', { name: /delete employee/i });
    const confirmBtn = confirmBtns[confirmBtns.length - 1];
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(services.deleteEmployee).toHaveBeenCalledWith('emp-1', expect.anything());
    await waitFor(() => {
      expect(screen.getByText('Employee record deleted successfully')).toBeInTheDocument();
    });
  });

  it('handles page navigation via handlePageChange', async () => {
    render(
      <Providers>
        <Home />
      </Providers>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    const prevBtn = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevBtn);
  });

  it('handles filter change, sort change, page size change, and filter reset', async () => {
    render(
      <Providers>
        <Home />
      </Providers>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    const deptSelect = screen.getByDisplayValue('All Departments');
    fireEvent.change(deptSelect, { target: { value: 'Engineering' } });

    const deptHeader = screen.getByText('Department');
    fireEvent.click(deptHeader);

    const pageSizeSelect = screen.getByDisplayValue('20');
    fireEvent.change(pageSizeSelect, { target: { value: '50' } });

    const resetBtn = screen.getByText('Clear All');
    fireEvent.click(resetBtn);
  });

  it('displays error toast when create, update, or delete mutations fail', async () => {
    vi.mocked(services.createEmployee).mockRejectedValueOnce(new Error('Email already exists'));
    vi.mocked(services.updateEmployee).mockRejectedValueOnce(new Error('Update failed'));
    vi.mocked(services.deleteEmployee).mockRejectedValueOnce(new Error('Delete failed'));

    render(
      <Providers>
        <Home />
      </Providers>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    // Create Error
    const addBtn = screen.getByRole('button', { name: /add employee/i });
    fireEvent.click(addBtn);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@acme.com' } });
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'Designer' } });

    const saveBtn = screen.getByRole('button', { name: /save employee/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    // Update Error
    const editBtn = await screen.findByTestId('edit-emp-1');
    fireEvent.click(editBtn);

    const editSaveBtn = screen.getByRole('button', { name: /save employee/i });
    await act(async () => {
      fireEvent.click(editSaveBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });

    // Delete Error
    const deleteBtn = await screen.findByTestId('delete-emp-1');
    fireEvent.click(deleteBtn);

    const confirmBtns = screen.getAllByRole('button', { name: /delete employee/i });
    const confirmBtn = confirmBtns[confirmBtns.length - 1];
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument();
    });
  });

  it('displays generic error toast string fallback when mutation throws non-error object', async () => {
    vi.mocked(services.createEmployee).mockRejectedValueOnce('Raw string error');

    render(
      <Providers>
        <Home />
      </Providers>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /add employee/i });
    fireEvent.click(addBtn);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@acme.com' } });
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'Designer' } });

    const saveBtn = screen.getByRole('button', { name: /save employee/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to create employee')).toBeInTheDocument();
    });
  });
});
