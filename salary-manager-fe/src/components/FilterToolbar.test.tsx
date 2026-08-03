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

  it('renders search input, filter controls, and reset button with default All selections', () => {
    render(<FilterToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search employees/i)).toBeInTheDocument();
    expect(screen.getByText('All Departments')).toBeInTheDocument();
    expect(screen.getByText('All Countries')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('populates initial values when non-empty filters are passed', () => {
    render(
      <FilterToolbar
        {...defaultProps}
        filters={{
          search: 'Initial',
          department: ['Engineering'],
          country: ['USA'],
          min_usd_salary: 50000,
          max_usd_salary: 150000,
        }}
      />
    );
    expect(screen.getByDisplayValue('Initial')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
    expect(screen.getByDisplayValue('USA')).toBeInTheDocument();
  });

  it('triggers onFilterChange when department or country dropdown is changed or cleared', () => {
    render(<FilterToolbar {...defaultProps} />);
    const deptSelect = screen.getByDisplayValue('All Departments');
    fireEvent.change(deptSelect, { target: { value: 'Engineering' } });
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ department: ['Engineering'] });

    fireEvent.change(deptSelect, { target: { value: '' } });
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ department: [] });

    const countrySelect = screen.getByDisplayValue('All Countries');
    fireEvent.change(countrySelect, { target: { value: 'USA' } });
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ country: ['USA'] });

    fireEvent.change(countrySelect, { target: { value: '' } });
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ country: [] });
  });

  it('triggers onFilterChange on min/max salary input blur', () => {
    render(<FilterToolbar {...defaultProps} />);
    const minInput = screen.getByPlaceholderText(/Min/i);
    const maxInput = screen.getByPlaceholderText(/Max/i);

    fireEvent.change(minInput, { target: { value: '50000' } });
    fireEvent.blur(minInput);
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ min_usd_salary: 50000 });

    fireEvent.change(minInput, { target: { value: '' } });
    fireEvent.blur(minInput);
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ min_usd_salary: undefined });

    fireEvent.change(maxInput, { target: { value: '200000' } });
    fireEvent.blur(maxInput);
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ max_usd_salary: 200000 });

    fireEvent.change(maxInput, { target: { value: '' } });
    fireEvent.blur(maxInput);
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ max_usd_salary: undefined });
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
