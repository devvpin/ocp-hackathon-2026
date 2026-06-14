import { useState, useEffect } from 'react';
import reservationsApi from '../../api/reservations';
import tablesApi from '../../api/tables';
import customersApi from '../../api/customers';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  arrived:   'bg-indigo-100 text-indigo-800 border-indigo-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const STATUSES = ['pending', 'confirmed', 'arrived', 'completed', 'cancelled'];

const todayStr = () => new Date().toISOString().split('T')[0];

export default function ReservationsPage() {
  const { success, error: showError } = useToast();
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [dailyDate, setDailyDate] = useState(todayStr());
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    customerId: '', tableId: '', bookingDate: '', time: '',
    guestCount: 2, status: 'pending', notes: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resData, tabData, cusData] = await Promise.all([
        reservationsApi.getReservations(),
        tablesApi.getAllTables(),
        customersApi.getAll(),
      ]);
      // reservations API now returns { data: [...] } via sendSuccess envelope
      setReservations(resData.data ?? resData);
      setTables(tabData.data ?? []);
      setCustomers(cusData.data ?? []);
    } catch {
      showError('Failed to load reservations');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openModal = (res = null) => {
    if (res) {
      const dt = new Date(res.bookingDate);
      setEditingId(res.id);
      setFormData({
        customerId: res.customerId || '',
        tableId: res.tableId || '',
        bookingDate: dt.toISOString().split('T')[0],
        time: dt.toTimeString().slice(0, 5),
        guestCount: res.guestCount,
        status: res.status,
        notes: res.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bookingDate || !formData.time) { showError('Date and time are required'); return; }
    setSaving(true);
    try {
      const bookingDate = new Date(`${formData.bookingDate}T${formData.time}:00`).toISOString();
      const payload = {
        customerId: formData.customerId || null,
        tableId: formData.tableId || null,
        bookingDate,
        guestCount: Number(formData.guestCount),
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingId) {
        await reservationsApi.updateReservation(editingId, payload);
        success('Reservation updated');
      } else {
        await reservationsApi.createReservation(payload);
        success('Reservation created');
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      showError(err?.response?.data?.error?.message || 'Failed to save reservation');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await reservationsApi.deleteReservation(deleteId);
      success('Reservation deleted');
      setDeleteId(null);
      fetchAll();
    } catch {
      showError('Failed to delete reservation');
    }
  };

  const filteredList = reservations.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search && !r.customer?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredDaily = reservations.filter((r) => {
    const d = new Date(r.bookingDate).toISOString().split('T')[0];
    return d === dailyDate;
  });

  const field = (key, value) => setFormData((f) => ({ ...f, [key]: value }));

  const inputCls = 'w-full px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cafe-espresso">Reservations</h1>
          <p className="text-sm text-surface-500 mt-1">Manage table bookings</p>
        </div>
        <Button onClick={() => openModal()}>+ New Reservation</Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-cafe shadow-cafe p-4 flex flex-wrap gap-3 items-center justify-between border border-cafe-crema/20">
        <div className="flex gap-3 flex-1 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name..."
            className="flex-1 min-w-[180px] px-3 py-2 border border-surface-200 rounded-xl text-sm bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls + ' w-44'}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          {viewMode === 'daily' && (
            <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className={inputCls + ' w-44'} />
          )}
        </div>
        <div className="flex bg-surface-100 p-1 rounded-xl">
          {['list', 'daily'].map((m) => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-xl transition-colors capitalize ${viewMode === m ? 'bg-white shadow-sm text-cafe-espresso' : 'text-surface-500 hover:text-surface-800'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-cafe-roast border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-cafe shadow-cafe border border-cafe-crema/20 overflow-hidden">
          {viewMode === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    {['Date & Time', 'Customer', 'Guests', 'Table', 'Status', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filteredList.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-cafe-espresso text-sm">{new Date(r.bookingDate).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs text-surface-500">{new Date(r.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-cafe-grounds">{r.customer?.name || <span className="text-surface-400 italic">Walk-in</span>}</td>
                      <td className="px-4 py-3 text-sm text-cafe-grounds">{r.guestCount}</td>
                      <td className="px-4 py-3 text-sm text-cafe-grounds">{r.table ? `Table ${r.table.tableNumber}` : <span className="text-surface-400 italic">Unassigned</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${STATUS_COLORS[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button onClick={() => openModal(r)} className="text-sm font-semibold text-cafe-roast hover:text-cafe-espresso">Edit</button>
                        <button onClick={() => setDeleteId(r.id)} className="text-sm font-semibold text-status-danger hover:opacity-80">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredList.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-surface-400">No reservations found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'daily' && (
            <div className="p-6">
              <p className="text-sm font-semibold text-cafe-grounds mb-4">
                {filteredDaily.length} reservation{filteredDaily.length !== 1 ? 's' : ''} on {new Date(dailyDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {filteredDaily.length === 0 ? (
                <p className="text-center py-10 text-surface-400">No reservations for this date</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDaily.map((r) => (
                    <div key={r.id} className="border border-cafe-crema/40 p-4 rounded-cafe bg-cafe-foam/20 hover:shadow-cafe transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-display font-bold text-lg text-cafe-espresso">
                          {new Date(r.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                      </div>
                      <p className="font-medium text-cafe-espresso">{r.customer?.name || 'Walk-in'}</p>
                      <p className="text-sm text-cafe-grounds/70 mt-0.5">
                        {r.guestCount} Guests · {r.table ? `Table ${r.table.tableNumber}` : 'Unassigned'}
                      </p>
                      {r.notes && <p className="text-xs text-surface-400 mt-2 italic">"{r.notes}"</p>}
                      <div className="flex gap-3 mt-3">
                        <button onClick={() => openModal(r)} className="text-xs font-semibold text-cafe-roast">Edit</button>
                        <button onClick={() => setDeleteId(r.id)} className="text-xs font-semibold text-status-danger">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Reservation' : 'New Reservation'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Customer</label>
              <select value={formData.customerId} onChange={(e) => field('customerId', e.target.value)} className={inputCls}>
                <option value="">Walk-in / No customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Table</label>
              <select value={formData.tableId} onChange={(e) => field('tableId', e.target.value)} className={inputCls}>
                <option value="">Unassigned</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>Table {t.number ?? t.tableNumber} ({t.seats ?? t.seatCount} seats)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Date *</label>
              <input type="date" required value={formData.bookingDate} onChange={(e) => field('bookingDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Time *</label>
              <input type="time" required value={formData.time} onChange={(e) => field('time', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Guests *</label>
              <input type="number" min="1" required value={formData.guestCount} onChange={(e) => field('guestCount', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <label key={s} className={`cursor-pointer px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide transition-colors ${formData.status === s ? STATUS_COLORS[s] : 'bg-surface-50 border-surface-200 text-surface-400 hover:bg-surface-100'}`}>
                  <input type="radio" name="status" value={s} checked={formData.status === s} onChange={() => field('status', s)} className="hidden" />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Notes</label>
            <textarea rows={2} value={formData.notes} onChange={(e) => field('notes', e.target.value)}
              className={inputCls + ' resize-none'} placeholder="Special requests, allergies, etc." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingId ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Reservation"
        message="This will permanently remove the reservation. Cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
