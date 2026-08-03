import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeleteConfirmModal from './DeleteConfirmModal';
import { Employee } from '../types';

describe('DeleteConfirmModal Component', () => {
  const mockEmp: Employee = {
    id: 'emp-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@acme.com',
    job_title: 'Engineer',
    department: 'Engineering',
    country: 'USA',
    base_salary: 100000,
    currency: 'USD',
    usd_salary: 100000,
    bonus_percentage: 10,
    gender: 'Male',
    performance: 4,
    hire_date: '2022-01-01',
    created_at: '2022-01-01',
    updated_at: '2022-01-01',
  };

  it('does not render when isOpen is false or employee is null', () => {
    const { container } = render(
      <DeleteConfirmModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} employee={mockEmp} />
    );
    expect(container.firstChild).toBeNull();

    const { container: container2 } = render(
      <DeleteConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} employee={null} />
    );
    expect(container2.firstChild).toBeNull();
  });

  it('renders confirmation text and triggers callbacks', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteConfirmModal isOpen={true} onClose={onClose} onConfirm={onConfirm} employee={mockEmp} />
    );

    expect(screen.getByText(/delete employee record/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /delete employee/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('renders deleting state when deleting prop is true', () => {
    render(
      <DeleteConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} employee={mockEmp} deleting={true} />
    );

    const deleteBtn = screen.getByRole('button', { name: /deleting\.\.\./i });
    expect(deleteBtn).toBeDisabled();
  });
});
