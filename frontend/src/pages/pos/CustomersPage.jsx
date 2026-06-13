import { useState, useEffect } from 'react';
import customersApi from '../../api/customers';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
export default function CustomersPage() {
  const { success, error: showError } = useToast();
  const { setCustomer, setTable } = useCart();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await customersApi.getAll();
      setCustomers(res.data);
    } catch { showError('Failed to load customers'); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );
  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '' }); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || '' }); setModalOpen(true); };
  const handleSave = async () => {
    if (!form.name.trim()) { showError('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await customersApi.update(editing.id, form);
        success('Customer updated');
      } else {
        await customersApi.create(form);
        success('Customer created');
      }
      setModalOpen(false);
      fetchData();
    } catch { showError('Failed to save customer'); }
    setSaving(false);
  };
  const handleDelete = async () => {
    try {
      await customersApi.delete(deleteId);
      success('Customer deleted');
      setDeleteId(null);
      fetchData();
    } catch { showError('Failed to delete customer'); }
  };
  const [seatCustomer, setSeatCustomer] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const navigate = useNavigate();

  const handleSelect = async (c) => {
    setCustomer(c);
    setSeatCustomer(c);
    setLoadingTables(true);
    try {
      const { default: tablesApi } = await import('../../api/tables');
      const res = await tablesApi.getAllTables();
      setAvailableTables(res.data.filter(t => t.active && t.status !== 'occupied'));
    } catch { showError('Failed to load tables'); }
    setLoadingTables(false);
  };

  const assignToTable = (table) => {
    setCustomer(seatCustomer);
    setTable(table.id, table.number);
    success(`${seatCustomer.name} assigned to Table ${table.number}`);
    navigate(`/pos/order/${table.id}`);
  };
  return (
    <div className="p-6 space-y-6 animate-fade-in overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Customers</h1>
          <p className="text-sm text-surface-500 mt-1">Manage your customer base</p>
        </div>
        <Button onClick={openCreate}>+ Add Customer</Button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or phone..." />
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5 h-32 animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center">
          <p className="text-surface-500 mb-4">No customers found</p>
          <Button onClick={openCreate}>+ Add Customer</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-700">{c.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-surface-900 truncate">{c.name}</h3>
                  {c.email && <p className="text-xs text-surface-500 truncate">{c.email}</p>}
                  {c.phone && <p className="text-xs text-surface-500">{c.phone}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="ghost" onClick={() => handleSelect(c)}>Select</Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)} className="!text-danger-600">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Customer name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="customer@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="+1-555-0100" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!seatCustomer} onClose={() => setSeatCustomer(null)} title={`Seat ${seatCustomer?.name}`} size="md">
        <div className="space-y-4">
          <p className="text-sm text-surface-500">Select an available table to start their order.</p>
          {loadingTables ? (
            <div className="flex justify-center p-6"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : availableTables.length === 0 ? (
            <div className="text-center p-6 bg-surface-50 rounded-xl border border-surface-200 text-surface-500">
              No tables currently available.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
              {availableTables.map(t => (
                <button
                  key={t.id}
                  onClick={() => assignToTable(t)}
                  className="bg-white border-2 border-surface-200 hover:border-primary-500 hover:bg-primary-50 rounded-xl p-4 transition-all text-center group"
                >
                  <p className="text-lg font-bold text-surface-900 group-hover:text-primary-700">T{t.number}</p>
                  <p className="text-xs text-surface-500 font-medium mt-1">{t.seats} seats</p>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setSeatCustomer(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Customer" message="This action cannot be undone." confirmText="Delete" />
    </div>
  );
}
