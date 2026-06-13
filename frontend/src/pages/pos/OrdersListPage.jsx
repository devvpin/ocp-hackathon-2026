import { useState, useEffect } from 'react';
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
  const filtered = orders.filter((o) =>
    (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    o.id.includes(search) ||
    (o.date || '').includes(search)
  );
  const statusColors = { draft: '#F59E0B', paid: '#22C55E', cancelled: '#EF4444' };
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
    { key: 'id', label: 'Order #', sortable: true, render: (v) => <span className="font-mono font-bold text-primary-600">#{v}</span> },
    { key: 'date', label: 'Date', sortable: true, render: (v) => formatDateTime(v) },
    { key: 'customerName', label: 'Customer', sortable: true, render: (v) => v || 'Walk-in' },
    { key: 'total', label: 'Amount', sortable: true, render: (v) => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge color={statusColors[v]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Badge> },
  ];
  return (
    <div className="p-6 space-y-6 animate-fade-in overflow-auto h-full">
      <div>
        <h1 className="text-xl font-bold text-surface-900">Orders</h1>
        <p className="text-sm text-surface-500 mt-1">View and manage all orders</p>
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
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.id}`} size="md">
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
