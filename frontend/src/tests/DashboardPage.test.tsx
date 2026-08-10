import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';

describe('DashboardPage Component', () => {
  it('renders analytics cards and metric titles', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Dashboard Finansial & Omset/i)).toBeInTheDocument();
    expect(screen.getByText(/Gross Omset/i)).toBeInTheDocument();
    expect(screen.getByText(/Profit Bersih \(Net\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Top 5 Produk Paling Laris/i)).toBeInTheDocument();
  });
});
