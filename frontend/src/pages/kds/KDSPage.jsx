import { useState, useEffect, useReducer } from 'react';
import kdsApi from '../../api/kds';
import { useToast } from '../../context/ToastContext';
import SearchBar from '../../components/SearchBar';
const stages = [
  { key: 'to_cook', label: 'TO COOK', color: 'bg-warning-500', textColor: 'text-warning-900', bgLight: 'bg-warning-50' },
  { key: 'preparing', label: 'PREPARING', color: 'bg-primary-500', textColor: 'text-primary-900', bgLight: 'bg-primary-50' },
  { key: 'completed', label: 'COMPLETED', color: 'bg-success-500', textColor: 'text-success-900', bgLight: 'bg-success-50' },
];
function ordersReducer(state, action) {
  switch (action.type) {
    case 'SET_ORDERS':
      return action.payload;
    case 'ADVANCE_STAGE': {
      const stageKeys = stages.map((s) => s.key);
      return state.map((o) => {
        if (o.id !== action.payload) return o;
        const idx = stageKeys.indexOf(o.stage);
        if (idx < stageKeys.length - 1) {
          return { ...o, stage: stageKeys[idx + 1] };
        }
        return o;
      });
    }
    case 'TOGGLE_ITEM':
      return state.map((o) => {
        if (o.id !== action.payload.orderId) return o;
        return {
          ...o,
          items: o.items.map((i) =>
            i.id === action.payload.itemId ? { ...i, completed: !i.completed } : i
          ),
        };
      });
    case 'ADD_ORDER':
      return [action.payload, ...state];
    default:
      return state;
  }
}
export default function KDSPage() {
  const { error: showError } = useToast();
  const [orders, dispatch] = useReducer(ordersReducer, []);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await kdsApi.getOrders();
        dispatch({ type: 'SET_ORDERS', payload: res.data });
      } catch { showError('Failed to load KDS orders'); }
      setLoading(false);
    };
    fetchOrders();
    // Poll for new orders every 5 seconds (simulates real-time)
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);
  const handleAdvanceStage = async (orderId) => {
    try {
      dispatch({ type: 'ADVANCE_STAGE', payload: orderId });
      await kdsApi.advanceStage(orderId);
    } catch { showError('Failed to update order'); }
  };
  const handleToggleItem = async (orderId, itemId, e) => {
    e.stopPropagation();
    try {
      dispatch({ type: 'TOGGLE_ITEM', payload: { orderId, itemId } });
      await kdsApi.toggleItemComplete(orderId, itemId);
    } catch { showError('Failed to update item'); }
  };
  const filteredOrders = orders.filter((o) => {
    if (search) {
      const s = search.toLowerCase();
      const matchesOrder = o.orderNumber.toLowerCase().includes(s);
      const matchesItem = o.items.some((i) => i.name.toLowerCase().includes(s));
      if (!matchesOrder && !matchesItem) return false;
    }
    return true;
  });
  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* Header */}
      <header className="bg-surface-800 border-b border-surface-700 h-16 flex items-center px-6 gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Kitchen Display</h1>
            <p className="text-xs text-surface-400">Odoo Cafe</p>
          </div>
        </div>
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Search orders or items..." className="[&_input]:bg-surface-700 [&_input]:border-surface-600 [&_input]:text-white [&_input]:placeholder-surface-400" />
        </div>
      </header>
      {/* Board */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {stages.map((stage) => {
          const stageOrders = filteredOrders.filter((o) => o.stage === stage.key);
          return (
            <div key={stage.key} className="flex-1 flex flex-col min-w-[280px]">
              {/* Column Header */}
              <div className={`${stage.color} px-4 py-3 rounded-t-2xl flex items-center justify-between`}>
                <h2 className="text-sm font-extrabold text-white tracking-wider">{stage.label}</h2>
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {stageOrders.length}
                </span>
              </div>
              {/* Cards */}
              <div className={`flex-1 overflow-auto ${stage.bgLight} rounded-b-2xl p-3 space-y-3`}>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 h-28 animate-shimmer" />
                  ))
                ) : stageOrders.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-surface-400">
                    <p className="text-sm">No orders</p>
                  </div>
                ) : (
                  stageOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleAdvanceStage(order.id)}
                      className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] animate-slide-up`}
                      style={{ borderLeftColor: stage.color.replace('bg-', '').includes('warning') ? '#F59E0B' : stage.color.includes('primary') ? '#3B82F6' : '#22C55E' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-extrabold text-surface-900">#{order.orderNumber}</span>
                        {stage.key !== 'completed' && (
                          <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={(e) => handleToggleItem(order.id, item.id, e)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer hover:bg-surface-50 ${
                              item.completed ? 'opacity-50' : ''
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              item.completed ? 'bg-success-500 border-success-500' : 'border-surface-300'
                            }`}>
                              {item.completed && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm flex-1 ${item.completed ? 'line-through text-surface-400' : 'text-surface-700 font-medium'}`}>
                              {item.name}
                            </span>
                            <span className="text-xs text-surface-500 font-bold">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
