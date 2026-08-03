import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmployeeModal from './EmployeeModal';
import { Employee } from '../types';

describe('EmployeeModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    employee: null,
    departments: ['Engineering', 'Product'],
    countries: ['USA', 'India'],
  };

  it('renders form elements for adding employee', () => {
    render(<EmployeeModal {...defaultProps} />);
    expect(screen.getByText('Add New Employee')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('populates fields when employee prop is provided for editing', () => {
    const existingEmployee: Employee = {
      id: 'emp-1',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@acme.com',
      job_title: 'Product Manager',
      department: 'Product',
      country: 'USA',
      base_salary: 130000,
      currency: 'USD',
      usd_salary: 130000,
      bonus_percentage: 15,
      gender: 'Female',
      performance: 5,
      hire_date: '2021-05-10T00:00:00Z',
      created_at: '2021-05-10T00:00:00Z',
      updated_at: '2021-05-10T00:00:00Z',
    };

    render(<EmployeeModal {...defaultProps} employee={existingEmployee} />);
    expect(screen.getByText('Edit Employee')).toBeInTheDocument();
    expect((screen.getByLabelText(/first name/i) as HTMLInputElement).value).toBe('Jane');
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe('jane@acme.com');
  });

  it('calls onSubmit with form data when submitted', () => {
    render(<EmployeeModal {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Marley' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bob@acme.com' } });
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'DevOps Lead' } });
    fireEvent.change(screen.getByLabelText(/base salary/i), { target: { value: '95000' } });

    const submitBtn = screen.getByRole('button', { name: /save employee/i });
    fireEvent.click(submitBtn);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Bob',
        last_name: 'Marley',
        email: 'bob@acme.com',
        job_title: 'DevOps Lead',
        base_salary: 95000,
      })
    );
  });
});
