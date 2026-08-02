import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home Page', () => {
  it('renders welcome heading correctly', () => {
    render(<Home />);
    const heading = screen.getByText('ACME Salary Manager');
    expect(heading).toBeInTheDocument();
  });
});
