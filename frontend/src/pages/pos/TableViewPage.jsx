import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import tablesApi from '../../api/tables';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/Skeleton';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
export default function TableViewPage() {
  const navigate = useNavigate();
  const { setTable } = useCart();
  const { error: showError } = useToast();
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeFloor, setActiveFloor] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, tRes] = await Promise.all([tablesApi.getFloors(), tablesApi.getAllTables()]);
        setFloors(fRes.data);
        setTables(tRes.data);
        if (fRes.data.length) setActiveFloor(fRes.data[0].id);
      } catch { showError('Failed to load tables'); }
      setLoading(false);
    };
    fetchData();
  }, []);
  const floorTables = tables.filter((t) => t.floorId === activeFloor && t.active);
  const stats = useMemo(() => {
    const total = floorTables.length;
    const occupied = floorTables.filter((t) => t.status === 'occupied').length;
    const available = total - occupied;
    const totalSeats = floorTables.reduce((sum, t) => sum + (t.seats || 0), 0);
    return { total, occupied, available, totalSeats };
  }, [floorTables]);
  const [seatModal, setSeatModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [guests, setGuests] = useState(1);

  const handleSelectTable = (table) => {
    if (table.status === 'occupied') {
      setTable(table.id, table.number);
      navigate(`/pos/order/${table.id}${table.orderId ? `?orderId=${table.orderId}` : ''}`);
    } else {
      setSelectedTable(table);
      setGuests(table.seats || 1);
      setSeatModal(true);
    }
  };

  const confirmSeatGuests = () => {
    if (!selectedTable) return;
    setTable(selectedTable.id, selectedTable.number);
    navigate(`/pos/order/${selectedTable.id}`);
  };
  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="flex gap-2 mb-6">
          <Skeleton variant="rect" width={120} height={40} count={3} />
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={120} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 h-full overflow-auto animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900">Floor Map</h1>
            <p className="text-xs text-surface-500">Select a table to start or continue an order</p>
          </div>
        </div>
      </div>

      {/* Floor Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {floors.map((floor) => (
          <button
            key={floor.id}
            onClick={() => setActiveFloor(floor.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeFloor === floor.id
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50 hover:border-surface-300'
            }`}
          >
            {floor.name}
          </button>
        ))}
      </div>

      {/* Floor Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-surface-200 p-3.5">
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-0.5">Total Tables</p>
          <p className="text-2xl font-extrabold text-surface-800">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl border border-success-200 p-3.5">
          <p className="text-[10px] font-bold text-success-600 uppercase tracking-wider mb-0.5">Available</p>
          <p className="text-2xl font-extrabold text-success-700">{stats.available}</p>
        </div>
        <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl border border-warning-200 p-3.5">
          <p className="text-[10px] font-bold text-warning-600 uppercase tracking-wider mb-0.5">Occupied</p>
          <p className="text-2xl font-extrabold text-warning-700">{stats.occupied}</p>
        </div>
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 p-3.5">
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-0.5">Total Seats</p>
          <p className="text-2xl font-extrabold text-primary-700">{stats.totalSeats}</p>
        </div>
      </div>

      {/* Table Grid - Floor Map Style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {floorTables.map((table) => (
          <button
            key={table.id}
            onClick={() => handleSelectTable(table)}
            className={`relative p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-xl active:scale-[0.97] min-h-[140px] flex flex-col items-center justify-center group ${
              table.status === 'occupied'
                ? 'border-warning-400 bg-gradient-to-br from-warning-50 via-warning-100 to-orange-50 hover:border-warning-500 shadow-md shadow-warning-200/40'
                : 'border-surface-200 bg-white hover:border-primary-400 hover:bg-gradient-to-br hover:from-primary-50 hover:to-indigo-50'
            }`}
          >
            {/* Status indicator */}
            {table.status === 'occupied' ? (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning-500 animate-pulse" />
              </div>
            ) : (
              <div className="absolute top-2.5 right-2.5">
                <div className="w-2 h-2 rounded-full bg-success-400" />
              </div>
            )}

            {/* Table icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${
              table.status === 'occupied'
                ? 'bg-warning-200/60'
                : 'bg-surface-100 group-hover:bg-primary-100'
            }`}>
              <span className="text-2xl font-extrabold" style={{ color: table.status === 'occupied' ? '#b45309' : '#475569' }}>
                {table.number}
              </span>
            </div>

            {/* Seat count */}
            <div className="flex items-center gap-1.5 text-xs text-surface-500 mb-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">{table.seats} seats</span>
            </div>

            {/* Status badge */}
            {table.status === 'occupied' ? (
              <div className="flex flex-col items-center gap-1">
                <span className="px-2.5 py-0.5 bg-warning-500 text-white text-[10px] rounded-full font-bold uppercase tracking-wider">
                  Occupied
                </span>
                {table.customerName && (
                  <span className="text-[10px] font-bold text-warning-800 truncate max-w-full px-1">
                    {table.customerName}
                  </span>
                )}
              </div>
            ) : (
              <span className="px-2.5 py-0.5 bg-success-100 text-success-700 text-[10px] rounded-full font-bold uppercase tracking-wider">
                Available
              </span>
            )}
          </button>
        ))}
      </div>
      {floorTables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-surface-400">
          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
          </svg>
          <p className="text-lg font-medium">No tables on this floor</p>
        </div>
      )}

      {/* Seat Guests Modal */}
      <Modal isOpen={seatModal} onClose={() => setSeatModal(false)} title="Seat Guests" size="sm">
        <div className="space-y-4">
          <div className="text-center text-surface-500 text-sm mb-4">
            Table {selectedTable?.number} has a default capacity of {selectedTable?.seats} seats.
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Number of Guests</label>
            <input 
              type="number" 
              min="1"
              value={guests} 
              onChange={(e) => setGuests(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500" 
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setSeatModal(false)}>Cancel</Button>
            <Button onClick={confirmSeatGuests} className="w-full">Seat & Order</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
