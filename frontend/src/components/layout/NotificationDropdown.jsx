import { useState, useRef, useEffect, useCallback } from 'react';
import socket from '../../api/socket';
import { useToast } from '../../context/ToastContext';
import tableRequestsApi from '../../api/tableRequests';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [tableRequests, setTableRequests] = useState([]);
  const dropdownRef = useRef(null);
  const { success, info, error: showError } = useToast();

  const fetchTableRequests = useCallback(async () => {
    try {
      const res = await tableRequestsApi.getActiveRequests();
      setTableRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchTableRequests();
  }, [fetchTableRequests]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKitchenCompleted = () => {
      const msg = `Order is ready from the kitchen!`;
      success(msg);
      setNotifications(prev => [{ id: Date.now(), msg, time: new Date(), read: false }, ...prev].slice(0, 20));
    };
    
    const onTableStatusChanged = (data) => {
      if (data.tableStatus === 'READY_FOR_PAYMENT') {
        const msg = `Table is ready for payment.`;
        info(msg);
        setNotifications(prev => [{ id: Date.now() + 1, msg, time: new Date(), read: false }, ...prev].slice(0, 20));
      }
    };
    
    const onTableRequestCreated = (data) => {
      const msg = `Table ${data.tableNumber} requested ${data.type}`;
      info(msg);
      fetchTableRequests();
    };

    const onTableRequestResolved = () => {
      fetchTableRequests();
    };

    socket.on('order:kitchen_completed', onKitchenCompleted);
    socket.on('table:status_changed', onTableStatusChanged);
    socket.on('table:request_created', onTableRequestCreated);
    socket.on('table:request_resolved', onTableRequestResolved);
    return () => {
      socket.off('order:kitchen_completed', onKitchenCompleted);
      socket.off('table:status_changed', onTableStatusChanged);
      socket.off('table:request_created', onTableRequestCreated);
      socket.off('table:request_resolved', onTableRequestResolved);
    };
  }, [success, info, fetchTableRequests]);

  const unreadCount = notifications.filter(n => !n.read).length + tableRequests.length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleResolveRequest = async (id) => {
    try {
      await tableRequestsApi.resolveRequest(id);
      success('Request resolved');
      fetchTableRequests();
    } catch (err) {
      showError('Failed to resolve request');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full hover:bg-cafe-roast/30 flex items-center justify-center relative text-cafe-foam"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-status-danger rounded-full animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-cafe shadow-cafe-lg border border-cafe-crema/40 py-2 z-50 animate-slide-down">
          <div className="px-4 py-2 border-b border-cafe-crema/20 flex justify-between items-center">
            <p className="text-sm font-semibold text-cafe-grounds">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-cafe-roast hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {tableRequests.length > 0 && (
              <div className="bg-orange-50 border-b border-orange-100">
                <p className="px-4 py-1 text-xs font-bold text-orange-800 uppercase tracking-wide bg-orange-100/50">Active Requests</p>
                {tableRequests.map(tr => (
                  <div key={tr.id} className="px-4 py-3 border-b border-orange-100/50 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-orange-900">Table {tr.tableNumber}</p>
                      <p className="text-xs text-orange-800 capitalize mt-0.5">Needs {tr.type}</p>
                    </div>
                    <button 
                      onClick={() => handleResolveRequest(tr.id)}
                      className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-full transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
            {notifications.length === 0 && tableRequests.length === 0 ? (
              <p className="text-xs text-center text-cafe-grounds/50 py-4">No notifications</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-cafe-crema/10 text-sm ${n.read ? 'opacity-60' : 'bg-cafe-foam/50'}`}>
                  <p className="text-cafe-grounds">{n.msg}</p>
                  <p className="text-[10px] text-cafe-grounds/50 mt-1">{n.time.toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
