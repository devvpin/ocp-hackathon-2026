import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import tablesApi from '../../api/tables';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/Skeleton';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import useSocket from '../../hooks/useSocket';
import reservationsApi from '../../api/reservations';

export default function TableViewPage() {
  const navigate = useNavigate();
  const { setTable } = useCart();
  const { error: showError } = useToast();
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeFloor, setActiveFloor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaysReservations, setTodaysReservations] = useState([]);

  useSocket(null, (msg) => {
    if (msg.event === 'table:status_changed') {
      const { tableId, occupied, orderId, orderStatus } = msg.payload;
      setTables((prev) =>
        prev.map((t) => {
          if (t.id === tableId) {
            return {
              ...t,
              status: occupied ? 'occupied' : 'available',
              tableStatus: msg.payload.tableStatus,
              orderId: occupied ? orderId : null,
              orderStatus: occupied ? orderStatus : null,
            };
          }
          return t;
        })
      );
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [fRes, tRes, rRes] = await Promise.all([
          tablesApi.getFloors(),
          tablesApi.getAllTables(),
          reservationsApi.getReservations({ date: today }),
        ]);
        setFloors(fRes.data);
        setTables(tRes.data);
        setTodaysReservations(rRes);
        if (fRes.data.length && !activeFloor) setActiveFloor(fRes.data[0].id);
      } catch { showError('Failed to load tables'); }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [activeFloor]);

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
      <div className="mb-6 flex items-center">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-cafe-roast rounded-cafe flex items-center justify-center shadow-cafe">
            <svg className="w-5 h-5 text-cafe-foam" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-cafe-espresso">Floor Map</h1>
            <p className="text-xs font-sans text-cafe-grounds/70">Select a table to start or continue an order</p>
          </div>
        </div>
      </div>

      {/* Floor Tabs */}
      <div className="flex gap-2 flex-wrap mb-5 border-b border-cafe-crema/30 pb-1">
        {floors.map((floor) => (
          <button
            key={floor.id}
            onClick={() => setActiveFloor(floor.id)}
            className={`px-5 py-2.5 text-sm font-display font-semibold transition-all duration-150 border-b-2 -mb-px ${
              activeFloor === floor.id
                ? 'border-cafe-roast text-cafe-espresso'
                : 'border-transparent text-cafe-grounds/70 hover:text-cafe-espresso'
            }`}
          >
            {floor.name}
          </button>
        ))}
      </div>

      {floors.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-cafe border border-cafe-crema/30 shadow-cafe p-8 text-center mt-6">
          <h2 className="text-xl font-display font-semibold text-cafe-espresso mb-2">No Floors Set Up</h2>
          <p className="text-cafe-grounds/70 mb-4 max-w-md">You need to create a floor layout before you can add tables or take orders.</p>
          <p className="text-sm text-cafe-roast font-medium">Please ask an administrator to set up floors in the Admin Dashboard.</p>
        </div>
      ) : (
        <>
          {/* Floor Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-cafe border border-cafe-crema/30 p-3.5 shadow-cafe">
              <p className="text-[10px] font-sans font-bold text-cafe-grounds/60 uppercase tracking-wide mb-0.5">Total Tables</p>
              <p className="text-2xl font-semibold tabular-nums text-cafe-grounds">{stats.total}</p>
            </div>
            <div className="bg-white rounded-cafe border border-cafe-crema/30 p-3.5 shadow-cafe">
              <p className="text-[10px] font-sans font-bold text-status-success uppercase tracking-wide mb-0.5">Available</p>
              <p className="text-2xl font-semibold tabular-nums text-status-success">{stats.available}</p>
            </div>
            <div className="bg-white rounded-cafe border border-cafe-crema/30 p-3.5 shadow-cafe">
              <p className="text-[10px] font-sans font-bold text-cafe-espresso uppercase tracking-wide mb-0.5">Occupied</p>
              <p className="text-2xl font-semibold tabular-nums text-cafe-espresso">{stats.occupied}</p>
            </div>
            <div className="bg-white rounded-cafe border border-cafe-crema/30 p-3.5 shadow-cafe">
              <p className="text-[10px] font-sans font-bold text-cafe-roast uppercase tracking-wide mb-0.5">Total Seats</p>
              <p className="text-2xl font-semibold tabular-nums text-cafe-roast">{stats.totalSeats}</p>
            </div>
          </div>

          {/* Table Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {floorTables.map((table) => {
              const statusColors = {
                available: 'border-cafe-crema/50 bg-white text-cafe-grounds hover:border-cafe-roast',
                occupied: 'border-yellow-500 bg-yellow-50 text-yellow-900',
                preparing: 'border-orange-500 bg-orange-50 text-orange-900',
                ready_to_serve: 'border-blue-500 bg-blue-50 text-blue-900',
                completed: 'border-purple-500 bg-purple-50 text-purple-900',
              };
              const statusNumColors = {
                available: 'bg-cafe-foam group-hover:bg-cafe-crema/30',
                occupied: 'bg-yellow-200 text-yellow-800',
                preparing: 'bg-orange-200 text-orange-800',
                ready_to_serve: 'bg-blue-200 text-blue-800',
                completed: 'bg-purple-200 text-purple-800',
              };
              const statusLabels = {
                available: 'Available',
                occupied: 'Occupied',
                preparing: 'Preparing',
                ready_to_serve: 'Ready To Serve',
                completed: 'Completed',
              };

              const tStatus = table.tableStatus || 'available';
              const isOccupied = tStatus !== 'available';

              const hasReservation = todaysReservations.some(
                r => r.tableId === table.id && ['pending', 'confirmed', 'arrived'].includes(r.status)
              );

              return (
                <button
                  key={table.id}
                  onClick={() => handleSelectTable(table)}
                  className={`relative p-5 rounded-cafe border-2 transition-all duration-150 hover:shadow-cafe hover:scale-[1.02] active:scale-[0.98] min-h-[140px] flex flex-col items-center justify-center group ${statusColors[tStatus]}`}
                >
                  {isOccupied && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full animate-pulse bg-current opacity-70" />
                    </div>
                  )}

                  {hasReservation && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] rounded font-bold uppercase tracking-wide shadow-sm">
                        Reserved
                      </span>
                    </div>
                  )}

                  <div className={`w-12 h-12 rounded-cafe flex items-center justify-center mb-2 transition-all ${statusNumColors[tStatus]}`}>
                    <span className="text-2xl font-display font-semibold tabular-nums">{table.number}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs mb-1.5 font-sans opacity-80">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{table.seats - (table.occupiedSeats || 0)} available seats</span>
                  </div>

                  {isOccupied ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="px-2.5 py-0.5 bg-current text-white text-[10px] rounded-cafe font-sans font-medium uppercase tracking-wide opacity-80">
                        {statusLabels[tStatus]}
                      </span>
                      {table.customerName && (
                        <span className="text-[10px] font-sans font-medium truncate max-w-full px-1">
                          {table.customerName}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-cafe-crema/40 text-cafe-espresso text-[10px] rounded-cafe font-sans font-medium uppercase tracking-wide">
                      Available
                    </span>
                  )}
                </button>
              );
            })}
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
        </>
      )}
    </div>
  );
}
