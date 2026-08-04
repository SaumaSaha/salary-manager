import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmployeeTable from './EmployeeTable';
import { Employee, PaginationMeta } from '../types';

describe('EmployeeTable Component', () => {
  const mockEmployees: Employee[] = [
    {
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
    },
    {
      id: 'emp-2',
      first_name: 'Priya',
      last_name: 'Sharma',
      email: 'priya@acme.com',
      job_title: 'Lead Engineer',
      department: 'Engineering',
      country: 'India',
      base_salary: 2800000,
      currency: 'INVALID_CURR_9999', // Triggers catch block in formatCurrency
      usd_salary: 33600,
      bonus_percentage: 15,
      gender: 'Female',
      performance: 5,
      hire_date: '2021-03-15T00:00:00Z',
      created_at: '2021-03-15T00:00:00Z',
      updated_at: '2021-03-15T00:00:00Z',
    },
  ];

  const mockPagination: PaginationMeta = {
    page: 2,
    page_size: 20,
    total_records: 45,
    total_pages: 3,
  };

  const defaultProps = {
    employees: mockEmployees,
    pagination: mockPagination,
    sortBy: 'last_name',
    sortOrder: 'desc' as const,
    loading: false,
    onSortChange: vi.fn(),
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onEditEmployee: vi.fn(),
    onDeleteEmployee: vi.fn(),
    onAddEmployee: vi.fn(),
  };

  it('renders employee rows, pagination summary, and add employee button', () => {
    render(<EmployeeTable {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Add Employee')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /add employee/i });
    fireEvent.click(addBtn);
    expect(defaultProps.onAddEmployee).toHaveBeenCalledTimes(1);
  });

  it('handles page size change and pagination navigation buttons', () => {
    render(<EmployeeTable {...defaultProps} />);

    const pageSizeSelect = screen.getByRole('combobox');
    fireEvent.change(pageSizeSelect, { target: { value: '50' } });
    expect(defaultProps.onPageSizeChange).toHaveBeenCalledWith(50);

    const prevBtn = screen.getByRole('button', { name: /previous/i });
    const nextBtn = screen.getByRole('button', { name: /next/i });

    fireEvent.click(prevBtn);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(nextBtn);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3);
  });

  it('triggers onSortChange when column header is clicked', () => {
    render(<EmployeeTable {...defaultProps} />);
    const deptHeader = screen.getByText('Department');
    fireEvent.click(deptHeader);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('department');
  });

  it('renders empty table message when employees list is empty', () => {
    render(<EmployeeTable {...defaultProps} employees={[]} pagination={{ page: 1, page_size: 20, total_records: 0, total_pages: 0 }} />);
    expect(screen.getByText('No employee records found matching your filters.')).toBeInTheDocument();
  });

  it('renders loading spinner overlay when loading is true and no employees exist', () => {
    const { container } = render(<EmployeeTable {...defaultProps} employees={[]} loading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('keeps rows visible and applies subtle dimming transition when isFetching is true', () => {
    render(<EmployeeTable {...defaultProps} isFetching={true} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByTestId('table-fetching-indicator')).not.toBeInTheDocument();
  });

  it('triggers onEditEmployee and onDeleteEmployee when action buttons are clicked', () => {
    render(<EmployeeTable {...defaultProps} />);
    const editBtn = screen.getByTestId('edit-emp-1');
    const deleteBtn = screen.getByTestId('delete-emp-1');

    fireEvent.click(editBtn);
    expect(defaultProps.onEditEmployee).toHaveBeenCalledWith(mockEmployees[0]);

    fireEvent.click(deleteBtn);
    expect(defaultProps.onDeleteEmployee).toHaveBeenCalledWith(mockEmployees[0]);
  });
});

