import { useState, useEffect } from 'react';
import categoriesApi from '../../api/categories';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import SearchBar from '../../components/SearchBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import ColorPicker from '../../components/ColorPicker';
export default function CategoriesPage() {
    const { success, error: showError } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', color: '#3B82F6' });
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await categoriesApi.getAll();
            setCategories(res.data);
        } catch { showError('Failed to load categories'); }
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);
    const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    const openCreate = () => { setEditing(null); setForm({ name: '', color: '#3B82F6' }); setModalOpen(true); };
    const openEdit = (cat) => { setEditing(cat); setForm({ name: cat.name, color: cat.color }); setModalOpen(true); };
    const handleSave = async () => {
        if (!form.name.trim()) { showError('Name is required'); return; }
        setSaving(true);
        try {
            if (editing) {
                await categoriesApi.update(editing.id, form);
                success('Category updated');
            } else {
                await categoriesApi.create(form);
                success('Category created');
            }
            setModalOpen(false);
            fetchData();
        } catch { showError('Failed to save category'); }
        setSaving(false);
    };
    const handleDelete = async () => {
        try {
            await categoriesApi.delete(deleteId);
            success('Category deleted');
            setDeleteId(null);
            fetchData();
        } catch { showError('Failed to delete category'); }
    };
    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        {
            key: 'color', label: 'Colour',
            render: (v) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg border border-surface-200" style={{ backgroundColor: v }} />
                    <span className="text-xs font-mono text-surface-500">{v}</span>
                </div>
            ),
        },
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
                    <h1 className="text-2xl font-bold text-surface-900">Categories</h1>
                    <p className="text-sm text-surface-500 mt-1">Manage product categories and colors</p>
                </div>
                <Button onClick={openCreate}>+ Create</Button>
            </div>
            <SearchBar value={search} onChange={setSearch} placeholder="Search categories..." />
            <Table columns={columns} data={filtered} loading={loading} emptyMessage="No categories found" emptyAction={{ label: '+ Create Category', onClick: openCreate }} />
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Create Category'} size="sm">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Category name" />
                    </div>
                    <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} label="Colour" />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
                    </div>
                </div>
            </Modal>
            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Category" message="This will remove the category from all products. Continue?" confirmText="Delete" />
        </div>
    );
}