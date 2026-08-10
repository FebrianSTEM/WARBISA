import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { POSPage } from '../pages/POSPage';

describe('POSPage Component', () => {
  it('renders search input and product catalog', async () => {
    render(<POSPage />);
    expect(screen.getByPlaceholderText(/Cari produk/i)).toBeInTheDocument();
    expect(screen.getByText(/Keranjang Kasir/i)).toBeInTheDocument();
    expect(await screen.findByText(/Minyak Goreng Bimoli/i)).toBeInTheDocument();
  });

  it('filters products by search input', async () => {
    render(<POSPage />);
    const searchInput = screen.getByPlaceholderText(/Cari produk/i);
    fireEvent.change(searchInput, { target: { value: 'Bimoli' } });
    expect(await screen.findByText(/Minyak Goreng Bimoli/i)).toBeInTheDocument();
  });
});
