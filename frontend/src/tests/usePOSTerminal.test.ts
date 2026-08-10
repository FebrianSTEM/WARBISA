import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePOSTerminal } from '../hooks/usePOSTerminal';

describe('usePOSTerminal Hook', () => {
  it('initializes with default mock products and categories', () => {
    const { result } = renderHook(() => usePOSTerminal());

    expect(result.current.products.length).toBeGreaterThan(0);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.selectedCategory).toBe('');
    expect(result.current.isScannerOpen).toBe(false);
  });

  it('updates search query and scanner modal visibility', () => {
    const { result } = renderHook(() => usePOSTerminal());

    act(() => {
      result.current.setSearchQuery('Kopi');
      result.current.setIsScannerOpen(true);
    });

    expect(result.current.searchQuery).toBe('Kopi');
    expect(result.current.isScannerOpen).toBe(true);
  });
});
