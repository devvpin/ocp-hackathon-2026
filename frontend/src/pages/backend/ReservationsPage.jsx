import { useState, useEffect } from 'react';
import reservationsApi from '../../api/reservations';
import tablesApi from '../../api/tables';
import customersApi from '../../api/customers';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';
import SearchBar from '../../components/SearchBar';
import Modal from '../../components/Modal';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'daily', 'weekly'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    customerId: '',
    tableId: '',
    bookingDate: '',
    time: '',
    guestCount: 2,
    status: 'pending',
    notes: '',
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [resData, tabData, cusData] = await Promise.all([
        reservationsApi.getReservations(),
        tablesApi.getTables(),
        customersApi.getCustomers(),
      ]);
      setReservations(resData);
      setTables(tabData);
      setCustomers(cusData);
    } catch (err) {
      error('Failed to load reservations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openModal = (res = null) => {
    if (res) {
      setEditingId(res.id);
      const dt = new Date(res.bookingDate);
      const datePart = dt.toISOString().split('T')[0];
      const timePart = dt.toTimeString().slice(0, 5);
      
      setFormData({
        customerId: res.customerId || '',
        tableId: res.tableId || '',
        bookingDate: datePart,
        time: timePart,
        guestCount: res.guestCount,
        status: res.status,
        notes: res.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        customerId: '',
        tableId: '',
        bookingDate: '',
        time: '',
        guestCount: 2,
        status: 'pending',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const combinedDateTime = new Date(`${formData.bookingDate}T${formData.time}:00`);
      
      const payload = {
        customerId: formData.customerId || null,
        tableId: formData.tableId || null,
        bookingDate: combinedDateTime.toISOString(),
        guestCount: parseInt(formData.guestCount),
        status: formData.status,
        notes: formData.notes,
      };

      if (editingId) {
        await reservationsApi.updateReservation(editingId, payload);
        success('Reservation updated successfully');
      } else {
        await reservationsApi.createReservation(payload);
        success('Reservation created successfully');
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      error(err?.response?.data?.error?.message || 'Failed to save reservation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) return;
    try {
      await reservationsApi.deleteReservation(id);
      success('Reservation deleted');
      fetchAll();
    } catch (err) {
      error('Failed to delete reservation');
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const customerName = r.customer?.name?.toLowerCase() || '';
      if (!customerName.includes(s)) return false;
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'arrived': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-cafe-espresso">Reservations</h2>
          <p className="text-cafe-grounds/60 font-sans mt-1">Manage bookings and table assignments</p>
        </div>
        <Button onClick={() => openModal()}>New Reservation</Button>
      </div>

      <div className="bg-white rounded-cafe shadow-cafe p-4 flex flex-wrap gap-4 items-center justify-between border border-cafe-crema/20">
        <div className="flex gap-4 flex-1 min-w-[250px]">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by customer name..." />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48 px-3 py-2 bg-gray-50 border border-gray-200 rounded-cafe text-sm focus:outline-none focus:ring-2 focus:ring-cafe-roast font-sans"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="arrived">Arrived</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-cafe">
          <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 text-sm font-semibold rounded-cafe transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-cafe-espresso' : 'text-cafe-grounds/60 hover:text-cafe-grounds'}`}>List</button>
          <button onClick={() => setViewMode('daily')} className={`px-4 py-1.5 text-sm font-semibold rounded-cafe transition-colors ${viewMode === 'daily' ? 'bg-white shadow-sm text-cafe-espresso' : 'text-cafe-grounds/60 hover:text-cafe-grounds'}`}>Daily</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-cafe-roast border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-white rounded-cafe shadow-cafe border border-cafe-crema/20 overflow-hidden">
          {viewMode === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-xs font-semibold text-cafe-grounds uppercase tracking-wider">Date & Time</th>
                    <th className="p-4 text-xs font-semibold text-cafe-grounds uppercase tracking-wider">Customer</th>
                    <th className="p-4 text-xs font-semibold text-cafe-grounds uppercase tracking-wider">Party Size</th>
                    <th className="p-4 text-xs font-semibold text-cafe-grounds uppercase tracking-wider">Table</th>
                    <th className="p-4 text-xs font-semibold text-cafe-grounds uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-semibold text-cafe-grounds uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReservations.map(res => (
                    <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-cafe-espresso">{new Date(res.bookingDate).toLocaleDateString()}</div>
                        <div className="text-sm text-cafe-grounds/60">{new Date(res.bookingDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-cafe-grounds">{res.customer?.name || 'Walk-in / Unknown'}</td>
                      <td className="p-4 text-sm text-cafe-grounds">{res.guestCount} People</td>
                      <td className="p-4 text-sm text-cafe-grounds">{res.table ? `Table ${res.table.tableNumber}` : 'Unassigned'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(res.status)} uppercase tracking-wider`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => openModal(res)} className="text-cafe-roast hover:text-cafe-espresso font-semibold text-sm mr-3">Edit</button>
                        <button onClick={() => handleDelete(res.id)} className="text-status-danger hover:text-status-danger/80 font-semibold text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredReservations.length === 0 && (
                    <tr><td colSpan="6" className="p-8 text-center text-cafe-grounds/50">No reservations found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {viewMode === 'daily' && (
            <div className="p-8 text-center text-cafe-grounds/50">
              <p className="mb-4">Calendar view is currently in simplified mode.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReservations.map(res => (
                  <div key={res.id} className="border border-cafe-crema/40 p-4 rounded-cafe text-left hover:shadow-cafe transition-shadow bg-cafe-foam/20">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-display font-semibold text-lg">{new Date(res.bookingDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(res.status)} uppercase`}>{res.status}</span>
                    </div>
                    <p className="font-medium text-cafe-espresso">{res.customer?.name || 'Walk-in'}</p>
                    <p className="text-sm text-cafe-grounds/70 mb-3">{res.guestCount} Guests • {res.table ? `Table ${res.table.tableNumber}` : 'Unassigned'}</p>
                    <div className="flex justify-end gap-2">
                       <button onClick={() => openModal(res)} className="text-xs font-semibold text-cafe-roast">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Reservation' : 'New Reservation'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-cafe-grounds mb-1">Customer</label>
              <select 
                value={formData.customerId} 
                onChange={e => setFormData({...formData, customerId: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-cafe text-sm focus:outline-none focus:ring-2 focus:ring-cafe-roast"
              >
                <option value="">Select Customer (Optional)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-cafe-grounds mb-1">Table</label>
              <select 
                value={formData.tableId} 
                onChange={e => setFormData({...formData, tableId: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-cafe text-sm focus:outline-none focus:ring-2 focus:ring-cafe-roast"
              >
                <option value="">Unassigned</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>Table {t.tableNumber} (Seats: {t.seatCount})</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-cafe-grounds mb-1">Date</label>
              <input 
                type="date" 
                required 
                value={formData.bookingDate} 
                onChange={e => setFormData({...formData, bookingDate: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-cafe text-sm focus:outline-none focus:ring-2 focus:ring-cafe-roast"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-cafe-grounds mb-1">Time</label>
              <input 
                type="time" 
                required 
                value={formData.time} 
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-cafe text-sm focus:outline-none focus:ring-2 focus:ring-cafe-roast"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-cafe-grounds mb-1">Guests</label>
              <input 
                type="number" 
                min="1" 
                required 
                value={formData.guestCount} 
                onChange={e => setFormData({...formData, guestCount: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-cafe text-sm focus:outline-none focus:ring-2 focus:ring-cafe-roast"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-cafe-grounds mb-1">Status</label>
            <div className="flex flex-wrap gap-2">
              {['pending', 'confirmed', 'arrived', 'completed', 'cancelled'].map(s => (
                <label key={s} className={`cursor-pointer px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-colors ${formData.status === s ? getStatusColor(s) : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                  <input type="radio" name="status" value={s} checked={formData.status === s} onChange={e => setFormData({...formData, status: e.target.value})} className="hidden" />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-cafe-grounds mb-1">Notes</label>
            <textarea 
              rows="2" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-cafe text-sm focus:outline-none focus:ring-2 focus:ring-cafe-roast resize-none"
              placeholder="Any special requests?"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Reservation</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
