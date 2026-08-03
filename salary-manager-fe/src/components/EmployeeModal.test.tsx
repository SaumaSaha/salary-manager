import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmployeeModal from './EmployeeModal';
import { Employee, EmployeeFormData } from '../types';

describe('EmployeeModal Component', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnSubmit = vi.fn();
  });

  const getProps = (overrides = {}) => ({
    isOpen: true,
    onClose: mockOnClose as unknown as () => void,
    onSubmit: mockOnSubmit as unknown as (data: EmployeeFormData) => void,
    employee: null as Employee | null,
    departments: ['Engineering', 'Product'],
    countries: ['USA', 'India'],
    ...overrides,
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(<EmployeeModal {...getProps({ isOpen: false })} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders form elements for adding employee with default fallback values', () => {
    render(<EmployeeModal {...getProps({ departments: [], countries: [] })} />);
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

    render(<EmployeeModal {...getProps({ employee: existingEmployee })} />);
    expect(screen.getByText('Edit Employee')).toBeInTheDocument();
    expect((screen.getByLabelText(/first name/i) as HTMLInputElement).value).toBe('Jane');
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe('jane@acme.com');
  });

  it('handles empty hire_date in employee prop gracefully', () => {
    const empNoHireDate: Employee = {
      id: 'emp-2',
      first_name: 'Mark',
      last_name: 'Wood',
      email: 'mark@acme.com',
      job_title: 'QA Engineer',
      department: 'Engineering',
      country: 'USA',
      base_salary: 80000,
      currency: 'USD',
      usd_salary: 80000,
      bonus_percentage: 0,
      gender: 'Male',
      performance: 3,
      hire_date: '',
      created_at: '2021-05-10T00:00:00Z',
      updated_at: '2021-05-10T00:00:00Z',
    };

    render(<EmployeeModal {...getProps({ employee: empNoHireDate })} />);
    expect((screen.getByLabelText(/hire date/i) as HTMLInputElement).value).toBe('');
  });

  it('calls onClose when close icon or Cancel button is clicked', () => {
    render(<EmployeeModal {...getProps()} />);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('updates form fields on input changes and calls onSubmit with updated data', () => {
    render(<EmployeeModal {...getProps()} />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Marley' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bob@acme.com' } });
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'DevOps Lead' } });
    fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Product' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'India' } });
    fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'INR' } });
    fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: 'Female' } });
    fireEvent.change(screen.getByLabelText(/performance/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/hire date/i), { target: { value: '2022-08-01' } });
    fireEvent.change(screen.getByLabelText(/base salary/i), { target: { value: '95000' } });

    const submitBtn = screen.getByRole('button', { name: /save employee/i });
    fireEvent.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      first_name: 'Bob',
      last_name: 'Marley',
      email: 'bob@acme.com',
      job_title: 'DevOps Lead',
      department: 'Product',
      country: 'India',
      currency: 'INR',
      gender: 'Female',
      performance: 5,
      hire_date: '2022-08-01',
      base_salary: 95000,
      bonus_percentage: 0,
    });
  });

  it('handles empty salary and performance numeric input fallbacks', () => {
    render(<EmployeeModal {...getProps()} />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@acme.com' } });
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'Tester' } });
    fireEvent.change(screen.getByLabelText(/hire date/i), { target: { value: '2023-01-01' } });

    const salaryInput = screen.getByLabelText(/base salary/i);
    fireEvent.change(salaryInput, { target: { value: '' } });

    const perfInput = screen.getByLabelText(/performance/i);
    fireEvent.change(perfInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /save employee/i });
    fireEvent.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        base_salary: 0,
        performance: 3,
      })
    );
  });
});
