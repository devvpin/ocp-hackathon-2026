import { useState, useEffect, useReducer, useCallback } from 'react';
import kdsApi from '../../api/kds';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/SearchBar';
import Header from '../../components/layout/Header';
import useSocket from '../../hooks/useSocket';

const stages = [
  { key: 'to_cook', label: 'TO COOK', headerClass: 'bg-cafe-espresso text-cafe-foam', borderColor: '#713105' },
  { key: 'preparing', label: 'PREPARING', headerClass: 'bg-cafe-roast text-cafe-foam', borderColor: '#7f5e35' },
  { key: 'ready', label: 'READY', headerClass: 'bg-cafe-crema text-cafe-espresso', borderColor: '#cfab71' },
  { key: 'completed', label: 'COMPLETED', headerClass: 'bg-status-success text-white', borderColor: '#16a34a' },
];

function ordersReducer(state, action) {
  switch (action.type) {
    case 'SET_ORDERS':
      return action.payload || [];
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

  const fetchOrders = useCallback(async () => {
    try {
      const res = await kdsApi.getOrders();
      dispatch({ type: 'SET_ORDERS', payload: res });
    } catch { showError('Failed to load KDS orders'); }
    setLoading(false);
  }, [showError]);

  useSocket(null, (msg) => {
    if (['kds:order_received', 'kds:order_updated', 'kds:stage_changed', 'kds:item_done', 'order:sent_to_kitchen', 'order:preparing', 'order:kitchen_completed'].includes(msg.event)) {
      fetchOrders();
    }
  });

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (isAdmin) return; // Admins can use standard browser navigation
    
    // Prevent back navigation for KDS employees
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdmin]);

  const handleAdvanceStage = async (orderId, currentStage) => {
    const stageKeys = stages.map(s => s.key);
    const currentIdx = stageKeys.indexOf(currentStage);
    if (currentIdx >= stageKeys.length - 1) return;
    const newStage = stageKeys[currentIdx + 1];

    try {
      await kdsApi.advanceStage(orderId, newStage);
      dispatch({ type: 'ADVANCE_STAGE', payload: orderId });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Failed to update order';
      showError(msg);
      fetchOrders();
    }
  };

  const handleToggleItem = async (orderId, itemId, e) => {
    e.stopPropagation();
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.stage !== 'preparing') return;

    try {
      await kdsApi.toggleItemComplete(orderId, itemId);
      dispatch({ type: 'TOGGLE_ITEM', payload: { orderId, itemId } });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Failed to update item';
      showError(msg);
      fetchOrders();
    }
  };

  const handleToggleItemClick = (order, item, stageKey, e) => {
    if (stageKey === 'preparing') {
      handleToggleItem(order.id, item.id, e);
    }
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
      <Header pageTitle="Kitchen Display" />

      <div className="bg-cafe-grounds/5 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Search orders or items..." />
        </div>
      </div>

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
                        className={`bg-white rounded-cafe p-4 shadow-cafe border-l-4 transition-all duration-150 animate-slide-up ${isAdmin && stage.key === 'to_cook' ? 'hover:shadow-cafe-lg' : ''}`}
                        style={{ borderLeftColor: stage.borderColor }}
                      >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-display text-lg font-semibold text-cafe-espresso">#{order.orderNumber}</span>
                        {stage.key === 'to_cook' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAdvanceStage(order.id, order.stage); }}
                            className="text-xs font-sans font-bold uppercase tracking-wider bg-cafe-roast text-cafe-foam px-3 py-1.5 rounded-cafe hover:bg-cafe-espresso transition-colors"
                          >
                            Start Preparing
                          </button>
                        )}
                        {stage.key === 'preparing' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAdvanceStage(order.id, order.stage); }}
                            className="text-xs font-sans font-bold uppercase tracking-wider bg-cafe-crema text-cafe-espresso px-3 py-1.5 rounded-cafe hover:bg-cafe-crema/80 transition-colors"
                          >
                            Mark Ready
                          </button>
                        )}
                        {stage.key === 'ready' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAdvanceStage(order.id, order.stage); }}
                            className="text-xs font-sans font-bold uppercase tracking-wider bg-status-success text-white px-3 py-1.5 rounded-cafe hover:bg-status-success/80 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={(e) => handleToggleItemClick(order, item, stage.key, e)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-cafe transition-all duration-150 min-h-[44px] ${stage.key === 'preparing' ? 'cursor-pointer hover:bg-cafe-foam' : ''}`}
                          >
                            {stage.key === 'preparing' && (
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                item.completed ? 'bg-status-success border-status-success' : 'border-cafe-crema'
                              }`}>
                                {item.completed && (
                                  <svg className="w-3 h-3 text-cafe-foam" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            )}
                            <span className={`text-sm font-sans flex-1 ${stage.key === 'preparing' && item.completed ? 'line-through text-cafe-grounds/40' : 'text-cafe-grounds font-medium'}`}>
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
