import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from './Navbar';

describe('Navbar Component', () => {
  it('renders branding and triggers CSV export', () => {
    const onExport = vi.fn();
    render(<Navbar onExportCsv={onExport} />);

    expect(screen.getByText('ACME Salary Manager')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(btn);
    expect(onExport).toHaveBeenCalled();
  });

  it('renders exporting state when exporting is true', () => {
    const onExport = vi.fn();
    render(<Navbar onExportCsv={onExport} exporting={true} />);

    const btn = screen.getByRole('button', { name: /exporting\.\.\./i });
    expect(btn).toBeDisabled();
  });
});
