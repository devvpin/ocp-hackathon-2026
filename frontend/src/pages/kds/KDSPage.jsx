import { useState, useEffect, useReducer } from 'react';
import kdsApi from '../../api/kds';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';
import Logo from '../../components/Logo';
import { CAFE_NAME } from '../../config/brand';

const stages = [
  { key: 'to_cook', label: 'TO COOK', headerClass: 'bg-cafe-espresso text-cafe-foam', borderColor: '#713105' },
  { key: 'preparing', label: 'PREPARING', headerClass: 'bg-cafe-roast text-cafe-foam', borderColor: '#7f5e35' },
  { key: 'completed', label: 'COMPLETED', headerClass: 'bg-cafe-crema text-cafe-espresso', borderColor: '#cfab71' },
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

function CoffeeCupIcon({ className = 'w-12 h-12' }) {
  return (
    <svg className={`${className} text-cafe-crema/60`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 24h32v24a8 8 0 01-8 8H20a8 8 0 01-8-8V24z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M44 28h4a8 8 0 010 16h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function KDSPage() {
  const { error: showError } = useToast();
  const { isAdmin } = useAuth();
  const [orders, dispatch] = useReducer(ordersReducer, []);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await kdsApi.getOrders();
        dispatch({ type: 'SET_ORDERS', payload: res.data });
      } catch { showError('Failed to load KDS orders'); }
      setLoading(false);
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [showError]);

  const handleAdvanceStage = async (orderId, currentStage) => {
    if (!isAdmin) {
      showError('Employees have view-only access to KDS.');
      return;
    }
    const stageKeys = stages.map(s => s.key);
    const currentIdx = stageKeys.indexOf(currentStage);
    if (currentIdx >= stageKeys.length - 1) return;
    const newStage = stageKeys[currentIdx + 1];

    try {
      dispatch({ type: 'ADVANCE_STAGE', payload: orderId });
      await kdsApi.advanceStage(orderId, newStage);
    } catch { showError('Failed to update order'); }
  };

  const handleToggleItem = async (orderId, itemId, e) => {
    e.stopPropagation();
    if (!isAdmin) {
      showError('Employees have view-only access to KDS.');
      return;
    }
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
    <div className="min-h-screen bg-cafe-foam flex flex-col">
      <header className="bg-cafe-grounds text-cafe-foam h-16 flex items-center px-6 gap-4 flex-shrink-0 shadow-cafe">
        <div className="flex items-center gap-3">
          <Logo className="h-10" onDark />
          <div>
            <h1 className="font-display text-xl font-semibold text-cafe-foam">Kitchen Display</h1>
            <p className="text-xs font-sans text-cafe-foam/60">{CAFE_NAME}</p>
          </div>
        </div>
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Search orders or items..." dark />
        </div>
      </header>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {stages.map((stage) => {
          const stageOrders = filteredOrders.filter((o) => o.stage === stage.key);
          return (
            <div key={stage.key} className="flex-1 flex flex-col min-w-[280px]">
              <div className={`${stage.headerClass} px-4 py-3 rounded-t-cafe flex items-center justify-between`}>
                <h2 className="text-sm font-display font-semibold tracking-wider">{stage.label}</h2>
                <span className="bg-cafe-foam/20 text-cafe-foam text-xs font-sans font-bold px-2.5 py-0.5 rounded-cafe">
                  {stageOrders.length}
                </span>
              </div>
              <div className="flex-1 overflow-auto bg-cafe-foam rounded-b-cafe p-3 space-y-3 bg-cafe-texture">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-cafe p-4 h-28 animate-shimmer shadow-cafe" />
                  ))
                ) : stageOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-cafe-grounds/50">
                    <CoffeeCupIcon />
                    <p className="text-sm font-sans mt-2">No tickets</p>
                  </div>
                ) : (
                  stageOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => isAdmin && handleAdvanceStage(order.id, order.stage)}
                      className={`bg-white rounded-cafe p-4 shadow-cafe border-l-4 transition-all duration-150 animate-slide-up ${isAdmin ? 'cursor-pointer hover:shadow-cafe-lg active:scale-[0.98]' : ''}`}
                      style={{ borderLeftColor: stage.borderColor }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-display text-lg font-semibold text-cafe-espresso">#{order.orderNumber}</span>
                        {stage.key !== 'completed' && isAdmin && (
                          <svg className="w-5 h-5 text-cafe-grounds/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={(e) => isAdmin && handleToggleItem(order.id, item.id, e)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-cafe transition-all duration-150 min-h-[44px] ${isAdmin ? 'cursor-pointer hover:bg-cafe-foam' : ''}`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              item.completed ? 'bg-status-success border-status-success' : 'border-cafe-crema'
                            }`}>
                              {item.completed && (
                                <svg className="w-3 h-3 text-cafe-foam" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm font-sans flex-1 ${item.completed ? 'line-through text-cafe-grounds/40' : 'text-cafe-grounds font-medium'}`}>
                              {item.name}
                            </span>
                            <span className="text-xs font-sans text-cafe-grounds/60 font-semibold tabular-nums">×{item.quantity}</span>
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
