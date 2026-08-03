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
  ];

  const mockPagination: PaginationMeta = {
    page: 1,
    page_size: 20,
    total_records: 1,
    total_pages: 1,
  };

  const defaultProps = {
    employees: mockEmployees,
    pagination: mockPagination,
    sortBy: 'last_name',
    sortOrder: 'asc' as const,
    loading: false,
    onSortChange: vi.fn(),
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onEditEmployee: vi.fn(),
    onDeleteEmployee: vi.fn(),
  };

  it('renders employee rows and table headers', () => {
    render(<EmployeeTable {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
    expect(screen.getAllByText('$120,000').length).toBeGreaterThanOrEqual(1);
  });

  it('triggers onSortChange when column header is clicked', () => {
    render(<EmployeeTable {...defaultProps} />);
    const deptHeader = screen.getByText('Department');
    fireEvent.click(deptHeader);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('department');
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
