import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tablesApi from '../../api/tables';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/Skeleton';
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
  const handleSelectTable = (table) => {
    setTable(table.id, table.number);
    navigate(`/pos/order/${table.id}`);
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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-900 mb-4">Select a Table</h1>
        {/* Floor Tabs */}
        <div className="flex gap-2 flex-wrap">
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
      </div>
      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {floorTables.map((table) => (
          <button
            key={table.id}
            onClick={() => handleSelectTable(table)}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg active:scale-[0.97] min-h-[120px] flex flex-col items-center justify-center ${
              table.status === 'occupied'
                ? 'border-warning-400 bg-gradient-to-br from-warning-50 to-warning-100 hover:border-warning-500'
                : 'border-surface-200 bg-white hover:border-primary-300 hover:bg-primary-50/30'
            }`}
          >
            {table.status === 'occupied' && (
              <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-warning-500 animate-pulse" />
            )}
            <div className={`text-3xl font-extrabold mb-1 ${table.status === 'occupied' ? 'text-warning-700' : 'text-surface-800'}`}>
              {table.number}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-surface-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">{table.seats} seats</span>
            </div>
            {table.status === 'occupied' && (
              <span className="mt-2 px-2.5 py-0.5 bg-warning-500 text-white text-[10px] rounded-full font-bold uppercase tracking-wider">
                Occupied
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
    </div>
  );
}
