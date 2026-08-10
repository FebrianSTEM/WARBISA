import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryManagementModal } from '../components/inventory/CategoryManagementModal';
import { inventoryApi } from '../api/inventoryApi';

vi.mock('../api/inventoryApi', () => ({
  inventoryApi: {
    getCategories: vi.fn().mockResolvedValue([
      { id: 'cat-1', warungId: 'w1', name: 'Sembako' },
      { id: 'cat-2', warungId: 'w1', name: 'Minuman' },
    ]),
    createCategory: vi.fn().mockResolvedValue({ id: 'cat-3', warungId: 'w1', name: 'Makanan' }),
    updateCategory: vi.fn().mockResolvedValue({ id: 'cat-1', warungId: 'w1', name: 'Sembako Premium' }),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('CategoryManagementModal Component', () => {
  it('renders modal with categories list', async () => {
    render(
      <CategoryManagementModal isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByText('Kelola Kategori Produk')).toBeInTheDocument();
    expect(await screen.findByText('Sembako')).toBeInTheDocument();
    expect(screen.getByText('Minuman')).toBeInTheDocument();
  });

  it('allows adding a new category', async () => {
    const onCategoriesChanged = vi.fn();
    render(
      <CategoryManagementModal
        isOpen={true}
        onClose={vi.fn()}
        onCategoriesChanged={onCategoriesChanged}
      />
    );

    const input = screen.getByPlaceholderText(/Nama Kategori Baru/i);
    fireEvent.change(input, { target: { value: 'Makanan' } });

    const addButton = screen.getByRole('button', { name: /tambah/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(inventoryApi.createCategory).toHaveBeenCalledWith('Makanan');
      expect(onCategoriesChanged).toHaveBeenCalled();
    });
  });

  it('allows editing an existing category', async () => {
    const onCategoriesChanged = vi.fn();
    render(
      <CategoryManagementModal
        isOpen={true}
        onClose={vi.fn()}
        onCategoriesChanged={onCategoriesChanged}
      />
    );

    await screen.findByText('Sembako');

    const editButtons = screen.getAllByTitle('Edit Nama Kategori');
    fireEvent.click(editButtons[0]);

    const editInput = screen.getByDisplayValue('Sembako');
    fireEvent.change(editInput, { target: { value: 'Sembako Premium' } });

    const saveButton = screen.getByTitle('Simpan');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(inventoryApi.updateCategory).toHaveBeenCalledWith('cat-1', 'Sembako Premium');
      expect(onCategoriesChanged).toHaveBeenCalled();
    });
  });

  it('allows deleting a category', async () => {
    const onCategoriesChanged = vi.fn();
    render(
      <CategoryManagementModal
        isOpen={true}
        onClose={vi.fn()}
        onCategoriesChanged={onCategoriesChanged}
      />
    );

    await screen.findByText('Sembako');

    const deleteButtons = screen.getAllByTitle('Hapus Kategori');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/Hapus kategori "Sembako"\?/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /Ya, Hapus/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(inventoryApi.deleteCategory).toHaveBeenCalledWith('cat-1');
      expect(onCategoriesChanged).toHaveBeenCalled();
    });
  });
});
