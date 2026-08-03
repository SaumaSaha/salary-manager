import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterToolbar from './FilterToolbar';

describe('FilterToolbar Component', () => {
  const defaultProps = {
    departments: ['Engineering', 'Product', 'Sales'],
    countries: ['USA', 'India', 'UK'],
    salaryBounds: { min_usd_salary: 10000, max_usd_salary: 300000 },
    filters: {
      search: '',
      department: [],
      country: [],
      min_usd_salary: undefined,
      max_usd_salary: undefined,
    },
    onFilterChange: vi.fn(),
    onResetFilters: vi.fn(),
  };

  it('renders search input, filter controls, and reset button', () => {
    render(<FilterToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search employees/i)).toBeInTheDocument();
    expect(screen.getByText(/Department/)).toBeInTheDocument();
    expect(screen.getByText(/Country/)).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('triggers onFilterChange with debounced search input', async () => {
    render(<FilterToolbar {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/search employees/i);

    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    await waitFor(
      () => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Alice' })
        );
      },
      { timeout: 500 }
    );
  });

  it('calls onResetFilters when Clear All button is clicked', () => {
    render(<FilterToolbar {...defaultProps} />);
    const clearBtn = screen.getByText('Clear All');
    fireEvent.click(clearBtn);
    expect(defaultProps.onResetFilters).toHaveBeenCalled();
  });
});
