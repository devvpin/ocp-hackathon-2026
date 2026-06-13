import { useState, useEffect } from 'react';
import productsApi from '../../api/products';
import categoriesApi from '../../api/categories';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import SearchBar from '../../components/SearchBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatCurrency } from '../../utils/formatters';
export default function ProductsPage() {
  const { success, error: showError } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', categoryId: '', price: '', tax: '', uom: 'Per Piece', description: '' });
  const [newCatForm, setNewCatForm] = useState({ name: '', color: '#3B82F6' });
  const [showNewCat, setShowNewCat] = useState(false);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([productsApi.getAll(), categoriesApi.getAll()]);
      setProducts(pRes.data);
      setCategories(cRes.data);
    } catch { showError('Failed to load products'); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '—';
  const getCategoryColor = (id) => categories.find((c) => c.id === id)?.color || '#94a3b8';
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    getCategoryName(p.categoryId).toLowerCase().includes(search.toLowerCase())
  );
  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', categoryId: '', price: '', tax: '', uom: 'Per Piece', description: '' });
    setShowNewCat(false);
    setModalOpen(true);
  };
  const openEdit = (product) => {
    setEditing(product);
    setForm({ name: product.name, categoryId: product.categoryId, price: product.price, tax: product.tax, uom: product.uom, description: product.description || '' });
    setShowNewCat(false);
    setModalOpen(true);
  };
  const handleSave = async () => {
    if (!form.name.trim() || !form.price) { showError('Name and Price are required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await productsApi.update(editing.id, { ...form, price: Number(form.price), tax: Number(form.tax || 0) });
        success('Product updated');
      } else {
        await productsApi.create({ ...form, price: Number(form.price), tax: Number(form.tax || 0) });
        success('Product created');
      }
      setModalOpen(false);
      fetchData();
    } catch { showError('Failed to save product'); }
    setSaving(false);
  };
  const handleCreateCategory = async () => {
    if (!newCatForm.name.trim()) return;
    try {
      const res = await categoriesApi.create(newCatForm);
      setCategories((prev) => [...prev, res.data]);
      setForm((prev) => ({ ...prev, categoryId: res.data.id }));
      setShowNewCat(false);
      setNewCatForm({ name: '', color: '#3B82F6' });
      success('Category created');
    } catch { showError('Failed to create category'); }
  };
  const handleDelete = async () => {
    try {
      await productsApi.delete(deleteId);
      success('Product deleted');
      setDeleteId(null);
      fetchData();
    } catch { showError('Failed to delete product'); }
  };
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'categoryId', label: 'Category', sortable: true, render: (_, row) => <Badge color={getCategoryColor(row.categoryId)}>{getCategoryName(row.categoryId)}</Badge> },
    { key: 'price', label: 'Price', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'tax', label: 'Tax', sortable: true, render: (v) => `${v || 0}%` },
    { key: 'uom', label: 'UoM' },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }} className="text-danger-600 hover:text-danger-800 text-sm font-medium">Delete</button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Products</h1>
          <p className="text-sm text-surface-500 mt-1">Manage your cafe menu items</p>
        </div>
        <Button onClick={openCreate}>+ Create</Button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
      <Table columns={columns} data={filteredProducts} loading={loading} emptyMessage="No products found" emptyAction={{ label: '+ Create Product', onClick: openCreate }} />
      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Create Product'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Product name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select category</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            {!showNewCat && (
              <button onClick={() => setShowNewCat(true)} className="mt-1 text-xs text-primary-600 hover:text-primary-700 font-medium">+ Create Category</button>
            )}
            {showNewCat && (
              <div className="mt-2 p-3 bg-surface-50 rounded-xl border border-surface-200 space-y-2">
                <input type="text" value={newCatForm.name} onChange={(e) => setNewCatForm({ ...newCatForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Category name" />
                <div className="flex items-center gap-2">
                  <input type="color" value={newCatForm.color} onChange={(e) => setNewCatForm({ ...newCatForm, color: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer" />
                  <Button size="sm" onClick={handleCreateCategory}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewCat(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Price *</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Tax (%)</label>
              <input type="number" step="0.1" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Unit of Measure</label>
            <select value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="Per Piece">Per Piece</option>
              <option value="Per Kg">Per Kg</option>
              <option value="Per Litre">Per Litre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Product description" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Product" message="Are you sure you want to delete this product? This action cannot be undone." confirmText="Delete" />
    </div>
  );
}
