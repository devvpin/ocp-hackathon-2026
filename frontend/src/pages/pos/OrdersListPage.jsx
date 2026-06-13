import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ordersApi from '../../api/orders';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import Table from '../../components/Table';
import SearchBar from '../../components/SearchBar';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
export default function OrdersListPage() {
  const { success, error: showError } = useToast();
  const { loadOrder, setTable } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getAll();
      setOrders(res.data);
    } catch { showError('Failed to load orders'); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  // Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const draft = orders.filter((o) => o.status === 'draft').length;
    const paid = orders.filter((o) => o.status === 'paid').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const revenue = orders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { total, draft, paid, cancelled, revenue };
  }, [orders]);

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(o.orderNumber || o.id || '').includes(search) ||
      (o.date || '').includes(search);
    return matchesStatus && matchesSearch;
  });

  const statusColors = { draft: '#F59E0B', paid: '#22C55E', cancelled: '#EF4444' };
  const statusTabs = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'draft', label: 'Draft', count: stats.draft },
    { key: 'paid', label: 'Paid', count: stats.paid },
    { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ];

  const handleEditOrder = (order) => {
    loadOrder({
      items: order.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        tax: 0,
      })),
      customer: order.customerId ? { id: order.customerId, name: order.customerName } : null,
      orderId: order.id,
      tableId: order.tableId,
      tableNumber: order.tableNumber,
    });
    setTable(order.tableId, order.tableNumber);
    navigate(`/pos/order/${order.tableId}?orderId=${order.id}`);
  };
  const handleDelete = async () => {
    try {
      await ordersApi.delete(deleteId);
      success('Order deleted');
      setDeleteId(null);
      setSelectedOrder(null);
      fetchData();
    } catch { showError('Failed to delete order'); }
  };
  const columns = [
    { key: 'orderNumber', label: 'Order #', sortable: true, render: (v) => <span className="font-mono font-bold text-primary-600">#{v}</span> },
    { key: 'date', label: 'Date', sortable: true, render: (v) => formatDateTime(v) },
    { key: 'customerName', label: 'Customer', sortable: true, render: (v) => v || 'Walk-in' },
    { key: 'total', label: 'Amount', sortable: true, render: (v) => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge color={statusColors[v]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Badge> },
  ];
  return (
    <div className="p-6 space-y-5 animate-fade-in overflow-auto h-full">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-surface-900">Order Management</h1>
          <p className="text-xs text-surface-500">View, manage, and track all orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-surface-200 p-3.5">
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-0.5">Total Orders</p>
          <p className="text-2xl font-extrabold text-surface-800">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-warning-50 to-amber-50 rounded-xl border border-warning-200 p-3.5">
          <p className="text-[10px] font-bold text-warning-600 uppercase tracking-wider mb-0.5">Draft</p>
          <p className="text-2xl font-extrabold text-warning-700">{stats.draft}</p>
        </div>
        <div className="bg-gradient-to-br from-success-50 to-emerald-50 rounded-xl border border-success-200 p-3.5">
          <p className="text-[10px] font-bold text-success-600 uppercase tracking-wider mb-0.5">Paid</p>
          <p className="text-2xl font-extrabold text-success-700">{stats.paid}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-3.5">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Revenue</p>
          <p className="text-xl font-extrabold text-indigo-700">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === tab.key
                ? 'bg-surface-800 text-white shadow-md'
                : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${statusFilter === tab.key ? 'text-surface-300' : 'text-surface-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by customer, order #, or date..." />
      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No orders found"
        onRowClick={(row) => setSelectedOrder(row)}
      />
      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.orderNumber || selectedOrder?.id}`} size="md">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-surface-500">Date:</span> <span className="font-medium ml-1">{formatDateTime(selectedOrder.date)}</span></div>
              <div><span className="text-surface-500">Customer:</span> <span className="font-medium ml-1">{selectedOrder.customerName || 'Walk-in'}</span></div>
              <div><span className="text-surface-500">Table:</span> <span className="font-medium ml-1">{selectedOrder.tableNumber || '—'}</span></div>
              <div><span className="text-surface-500">Status:</span> <Badge color={statusColors[selectedOrder.status]} className="ml-1">{selectedOrder.status}</Badge></div>
            </div>
            <div className="bg-surface-50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-surface-500 uppercase mb-2">Items</h4>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-surface-700">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-surface-800">{formatCurrency(item.total || item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-surface-500">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Tax</span><span>{formatCurrency(selectedOrder.tax)}</span></div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatCurrency(selectedOrder.discount)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-surface-200"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
            </div>
            {selectedOrder.status === 'draft' && (
              <div className="flex gap-2 pt-2">
                <Button variant="danger" onClick={() => setDeleteId(selectedOrder.id)}>Delete</Button>
                <Button onClick={() => { handleEditOrder(selectedOrder); setSelectedOrder(null); }}>Edit Order</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Order" message="This will permanently delete the order. Continue?" confirmText="Delete" />
    </div>
  );
}
