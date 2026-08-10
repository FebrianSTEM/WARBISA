import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import type { CategoryDTO } from '../../api/inventoryApi';
import { Modal } from '../common/Modal';
import { Tag, Plus, Pencil, Trash2, Check, X, Loader2, AlertCircle } from 'lucide-react';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await inventoryApi.getCategories();
      if (data && Array.isArray(data)) {
        setCategories(data);
      }
    } catch {
      // Fallback default categories if offline / mock API
      if (categories.length === 0) {
        setCategories([
          { id: 'cat-1', warungId: 'w1', name: 'Sembako' },
          { id: 'cat-2', warungId: 'w1', name: 'Minuman' },
          { id: 'cat-3', warungId: 'w1', name: 'Makanan' },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setNewCategoryName('');
      setEditingId(null);
      setDeletingId(null);
      setError(null);
      fetchCategories();
    }
  }, [isOpen]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setError('Nama kategori tidak boleh kosong.');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Kategori dengan nama tersebut sudah ada.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      let createdCat: CategoryDTO;
      try {
        createdCat = await inventoryApi.createCategory(trimmed);
      } catch {
        // Fallback demo mode
        createdCat = {
          id: `cat-${Date.now()}`,
          warungId: 'w1',
          name: trimmed,
        };
      }
      setCategories((prev) => [...prev, createdCat]);
      setNewCategoryName('');
      onCategoriesChanged?.();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan kategori baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat: CategoryDTO) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setDeletingId(null);
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError('Nama kategori tidak boleh kosong.');
      return;
    }

    if (categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Kategori dengan nama tersebut sudah ada.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      try {
        await inventoryApi.updateCategory(id, trimmed);
      } catch {
        // Demo mode fallback
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );
      setEditingId(null);
      setEditingName('');
      onCategoriesChanged?.();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah nama kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      try {
        await inventoryApi.deleteCategory(id);
      } catch {
        // Demo mode fallback
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeletingId(null);
      onCategoriesChanged?.();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Kategori Produk" maxWidth="md">
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama Kategori Baru (misal: Sembako, Minuman)..."
              disabled={isSubmitting}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-60 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newCategoryName.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Tambah</span>
          </button>
        </form>

        {/* Categories List */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Daftar Kategori ({categories.length})</span>
            <span>Aksi</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Memuat kategori...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs font-medium">
              Belum ada kategori terdaftar. Silakan tambah kategori baru di atas.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;
                const isDeleting = deletingId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(cat.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={isSubmitting}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                          title="Simpan"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="Batal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isDeleting ? (
                      <div className="flex items-center justify-between w-full p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
                        <span>Hapus kategori "{cat.name}"?</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmDelete(cat.id)}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                          >
                            {isSubmitting ? 'Penghapusan...' : 'Ya, Hapus'}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                          <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Nama Kategori"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(cat.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
