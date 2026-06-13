import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import productsApi from '../../api/products';
import categoriesApi from '../../api/categories';
import ordersApi from '../../api/orders';
import paymentMethodsApi from '../../api/paymentMethods';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import QRCode from '../../components/QRCode';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
export default function OrderPage() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const {
    items, tableNumber, customer, totals, coupon,
    addItem, removeItem, updateQuantity, setTable,
    setCustomer, setCoupon, removeCoupon, clearCart, loadOrder,
  } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  // Payment state
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [cashTendered, setCashTendered] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  // Modals
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '' });
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes, pmRes] = await Promise.all([
          productsApi.getAll(),
          categoriesApi.getAll(),
          paymentMethodsApi.getAll(),
        ]);
        setProducts(pRes.data);
        setCategories(cRes.data);
        setPaymentMethods(pmRes.data.filter((m) => m.enabled));
      } catch { showError('Failed to load data'); }
      setLoading(false);
    };
    fetchData();
    // Set table from URL
    if (tableId && !tableNumber) {
      setTable(tableId, Number(tableId));
    }
    // Load existing order if editing
    const orderId = searchParams.get('orderId');
    if (orderId) {
      ordersApi.getById(orderId).then((res) => {
        const order = res.data;
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
      }).catch(() => {});
    }
  }, [tableId]);
  // Listen for global search from POS nav
  useEffect(() => {
    const handler = (e) => setProductSearch(e.detail || '');
    window.addEventListener('pos-search', handler);
    return () => window.removeEventListener('pos-search', handler);
  }, []);
  const getCategoryColor = useCallback((catId) => categories.find((c) => c.id === catId)?.color || '#94a3b8', [categories]);
  const getCategoryName = useCallback((catId) => categories.find((c) => c.id === catId)?.name || '', [categories]);
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { default: promotionsApi } = await import('../../api/promotions');
      const res = await promotionsApi.validateCoupon(couponCode.trim().toUpperCase());
      setCoupon(res.data);
      setCouponModalOpen(false);
      setCouponCode('');
      success('Coupon applied!');
    } catch (err) {
      showError(err?.response?.data?.message || 'Invalid coupon code');
    }
    setCouponLoading(false);
  };
  const handleSendToKitchen = async () => {
    if (items.length === 0) { showError('Cart is empty'); return; }
    try {
      // Create or update the order as a draft first, then send to kitchen
      const editOrderId = searchParams.get('orderId');
      const payload = {
        tableId: tableId || null,
        customerId: customer?.id || null,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };
      if (coupon?.code) payload.couponCode = coupon.code;

      let savedOrder;
      if (editOrderId) {
        savedOrder = await ordersApi.update(editOrderId, payload);
      } else {
        savedOrder = await ordersApi.create(payload);
      }

      await ordersApi.sendToKitchen(savedOrder.data.id);
      success('Order sent to kitchen!');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Failed to send to kitchen';
      showError(msg);
    }
  };
  const handleCompletePayment = async () => {
    if (items.length === 0) { showError('Cart is empty'); return; }
    if (!selectedPayment) { showError('Select a payment method'); return; }
    setPaymentLoading(true);
    try {
      // Build payload for real backend API
      const createPayload = {
        tableId: tableId || null,
        customerId: customer?.id || null,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };
      if (coupon?.code) createPayload.couponCode = coupon.code;

      const res = await ordersApi.create(createPayload);
      const orderId = res.data.id;

      // Build payment args
      const payRef = selectedPayment === 'card' ? (cardRef || 'card-txn') : (selectedPayment === 'upi' ? 'upi-txn' : null);
      const cashAmt = selectedPayment === 'cash' ? Number(cashTendered || totals.total) : null;
      await ordersApi.markPaid(orderId, selectedPayment, payRef, cashAmt);

      // Display receipt
      setCompletedOrder({
        id: orderId,
        orderNumber: res.data.orderNumber,
        tableNumber: tableNumber || Number(tableId),
        customerName: customer?.name || 'Walk-in',
        paymentMethod: selectedPayment,
        items: totals.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          total: i.price * i.quantity,
        })),
        subtotal: totals.subtotal,
        tax: totals.taxTotal,
        discount: totals.totalDiscount,
        total: totals.total,
      });
      setReceiptModalOpen(true);
      success('Payment completed!');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Payment failed';
      showError(msg);
    }
    setPaymentLoading(false);
  };
  const handlePrintReceipt = () => {
    window.print();
  };
  const handleSendReceipt = async () => {
    if (!emailValue) { showError('Enter an email address'); return; }
    try {
      await ordersApi.sendReceipt(completedOrder?.id, emailValue);
      success(`Receipt sent to ${emailValue}`);
      setEmailModalOpen(false);
    } catch { showError('Failed to send receipt'); }
  };
  const handleNewOrder = () => {
    clearCart();
    setReceiptModalOpen(false);
    setCompletedOrder(null);
    setSelectedPayment(null);
    setCashTendered('');
    setCardRef('');
    navigate('/pos/tables');
  };
  const handleLoadCustomers = async () => {
    try {
      const { default: customersApi } = await import('../../api/customers');
      const res = await customersApi.getAll();
      setCustomers(res.data);
    } catch { }
  };
  const handleCreateCustomer = async () => {
    if (!customerForm.name.trim()) { showError('Name is required'); return; }
    try {
      const { default: customersApi } = await import('../../api/customers');
      const res = await customersApi.create(customerForm);
      setCustomer(res.data);
      setCustomerModalOpen(false);
      success('Customer created and assigned');
    } catch { showError('Failed to create customer'); }
  };
  const changeDue = selectedPayment === 'cash' && cashTendered ? Math.max(0, Number(cashTendered) - totals.total) : 0;
  const upiMethod = paymentMethods.find((m) => m.type === 'upi');
  if (loading) {
    return (
      <div className="flex h-full gap-4 p-4">
        <div className="flex-1"><Skeleton height={600} /></div>
        <div className="w-80"><Skeleton height={600} /></div>
        <div className="w-72"><Skeleton height={600} /></div>
      </div>
    );
  }
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* LEFT - Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-surface-200">
        {/* Category Tabs */}
        <div className="flex gap-2 p-3 overflow-x-auto flex-shrink-0 bg-white border-b border-surface-200">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'all' ? 'bg-surface-800 text-white shadow' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id ? 'text-white shadow' : 'text-surface-600 hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeCategory === cat.id ? cat.color : `${cat.color}15`,
                color: activeCategory === cat.id ? '#fff' : cat.color,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="p-3 bg-white flex-shrink-0">
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {/* Product Cards */}
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addItem(product)}
                className="bg-white rounded-2xl border border-surface-200 p-4 text-left hover:shadow-lg hover:border-primary-300 transition-all active:scale-[0.97] group"
              >
                <div
                  className="w-full h-20 rounded-xl mb-3 flex items-center justify-center text-2xl opacity-70 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: `${getCategoryColor(product.categoryId)}12` }}
                >
                  ☕
                </div>
                <h3 className="text-sm font-bold text-surface-900 mb-1 truncate">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-primary-600">{formatCurrency(product.price)}</span>
                  <Badge color={getCategoryColor(product.categoryId)} className="text-[10px]">
                    {getCategoryName(product.categoryId)}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex items-center justify-center h-40 text-surface-400">
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>
      {/* CENTER - Cart */}
      <div className="w-80 flex flex-col bg-white border-r border-surface-200 flex-shrink-0">
        <div className="p-3 border-b border-surface-200">
          <h2 className="text-sm font-bold text-surface-900">
            Cart {tableNumber ? <span className="text-primary-600 ml-1">· Table {tableNumber}</span> : ''}
          </h2>
          {customer && (
            <p className="text-xs text-surface-500 mt-0.5">Customer: {customer.name}</p>
          )}
        </div>
        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-400">
              <svg className="w-12 h-12 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click products to add</p>
            </div>
          ) : (
            totals.items.map((item) => (
              <div key={item.productId} className="bg-surface-50 rounded-xl p-3 animate-slide-up">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-800 truncate">{item.name}</p>
                    <p className="text-xs text-surface-500">{formatCurrency(item.price)} each</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 rounded-lg hover:bg-danger-100 text-surface-400 hover:text-danger-500 transition-colors flex-shrink-0"
                    aria-label="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-100 transition-colors active:scale-95"
                      aria-label="Decrease quantity"
                    >−</button>
                    <span className="text-sm font-bold text-surface-800 w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-100 transition-colors active:scale-95"
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-surface-800">{formatCurrency(item.price * item.quantity)}</p>
                    {item.discount > 0 && (
                      <p className="text-xs text-success-600 font-medium">-{formatCurrency(item.discount)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Order-level discounts */}
          {totals.orderDiscount > 0 && (
            <div className="bg-success-50 rounded-xl p-3 border border-success-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-success-700 font-medium">Order Promotion</span>
                <span className="text-sm font-bold text-success-700">-{formatCurrency(totals.orderDiscount)}</span>
              </div>
            </div>
          )}
          {coupon && totals.couponDiscount > 0 && (
            <div className="bg-primary-50 rounded-xl p-3 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-primary-700 font-medium">Coupon: {coupon.code}</span>
                  <button onClick={removeCoupon} className="ml-2 text-xs text-danger-500 hover:text-danger-700">Remove</button>
                </div>
                <span className="text-sm font-bold text-primary-700">-{formatCurrency(totals.couponDiscount)}</span>
              </div>
            </div>
          )}
        </div>
        {/* Order Summary */}
        <div className="border-t border-surface-200 p-3 space-y-1.5">
          <div className="flex justify-between text-xs text-surface-500">
            <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-surface-500">
            <span>Tax</span><span>{formatCurrency(totals.taxTotal)}</span>
          </div>
          {totals.totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-success-600">
              <span>Discount</span><span>-{formatCurrency(totals.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold text-surface-900 pt-1 border-t border-surface-200">
            <span>Total</span><span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="p-3 border-t border-surface-200 grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" onClick={() => { handleLoadCustomers(); setCustomerModalOpen(true); }}>
            Assign Customer
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setCouponModalOpen(true)}>
            Discount
          </Button>
          <Button size="sm" variant="success" onClick={handleSendToKitchen}>
            Send to Kitchen
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setEmailValue(customer?.email || ''); setEmailModalOpen(true); }}>
            Send Receipt
          </Button>
        </div>
      </div>
      {/* RIGHT - Payment Panel */}
      <div className="w-72 flex flex-col bg-surface-50 flex-shrink-0">
        <div className="p-3 border-b border-surface-200 bg-white">
          <h2 className="text-sm font-bold text-surface-900">Payment</h2>
        </div>
        <div className="flex-1 p-3 space-y-3 overflow-auto">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.type)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                selectedPayment === method.type
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-surface-200 bg-white hover:border-surface-300'
              }`}
            >
              <p className="text-sm font-bold text-surface-900">{method.name}</p>
              <p className="text-xs text-surface-500 mt-0.5">
                {method.type === 'cash' && 'Pay with cash'}
                {method.type === 'card' && 'Card / Digital payment'}
                {method.type === 'upi' && 'Scan QR code'}
              </p>
            </button>
          ))}
          {/* Cash Input */}
          {selectedPayment === 'cash' && (
            <div className="space-y-3 animate-slide-up">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Amount Tendered</label>
                <input
                  type="number"
                  step="0.01"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
              {cashTendered && (
                <div className="p-3 bg-success-50 rounded-xl border border-success-200 text-center">
                  <p className="text-xs text-success-600">Change Due</p>
                  <p className="text-2xl font-extrabold text-success-700">{formatCurrency(changeDue)}</p>
                </div>
              )}
            </div>
          )}
          {/* UPI QR */}
          {selectedPayment === 'upi' && upiMethod && (
            <div className="space-y-3 animate-slide-up">
              <div className="flex justify-center">
                <QRCode
                  value={`upi://pay?pa=${upiMethod.upiId || 'cafe@ybl'}&pn=OdooCafe&am=${totals.total}&cu=INR`}
                  size={160}
                />
              </div>
              <p className="text-center text-sm font-bold text-surface-700">{formatCurrency(totals.total)}</p>
            </div>
          )}
          {/* Card Input */}
          {selectedPayment === 'card' && (
            <div className="animate-slide-up">
              <label className="block text-xs font-medium text-surface-600 mb-1">Transaction Reference</label>
              <input
                type="text"
                value={cardRef}
                onChange={(e) => setCardRef(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter reference #"
              />
            </div>
          )}
        </div>
        <div className="p-3 border-t border-surface-200 bg-white">
          <Button
            className="w-full"
            size="lg"
            onClick={handleCompletePayment}
            loading={paymentLoading}
            disabled={items.length === 0 || !selectedPayment}
          >
            Complete Payment
          </Button>
        </div>
      </div>
      {/* Coupon Modal */}
      <Modal isOpen={couponModalOpen} onClose={() => setCouponModalOpen(false)} title="Apply Coupon" size="sm">
        <div className="space-y-4">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button onClick={handleApplyCoupon} loading={couponLoading} className="w-full">Apply</Button>
        </div>
      </Modal>
      {/* Customer Modal */}
      <Modal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title="Assign Customer" size="md">
        <div className="space-y-4">
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="max-h-48 overflow-auto space-y-1">
            {customers.filter((c) => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email?.toLowerCase().includes(customerSearch.toLowerCase())).map((c) => (
              <button
                key={c.id}
                onClick={() => { setCustomer(c); setCustomerModalOpen(false); success('Customer assigned'); }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-surface-100 transition-colors"
              >
                <p className="text-sm font-medium text-surface-800">{c.name}</p>
                <p className="text-xs text-surface-500">{c.email} · {c.phone}</p>
              </button>
            ))}
          </div>
          <hr className="border-surface-200" />
          <p className="text-xs font-medium text-surface-500 uppercase">Or create new</p>
          <div className="grid grid-cols-1 gap-3">
            <input type="text" placeholder="Name *" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input type="email" placeholder="Email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} className="px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input type="tel" placeholder="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <Button size="sm" onClick={handleCreateCustomer}>Create & Assign</Button>
          </div>
        </div>
      </Modal>
      {/* Email Receipt Modal */}
      <Modal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Send Receipt" size="sm">
        <div className="space-y-4">
          <input
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder="customer@email.com"
            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button onClick={handleSendReceipt} className="w-full">Send</Button>
        </div>
      </Modal>
      {/* Receipt Modal (post-payment) */}
      <Modal isOpen={receiptModalOpen} onClose={() => {}} title="" size="sm">
        <div className="print-area">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-surface-900">Payment Successful</h2>
            <p className="text-sm text-surface-500">Order #{completedOrder?.id}</p>
          </div>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between"><span className="text-surface-500">Date</span><span className="text-surface-800">{new Date().toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Table</span><span className="text-surface-800">{completedOrder?.tableNumber}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Customer</span><span className="text-surface-800">{completedOrder?.customerName || 'Walk-in'}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Payment</span><span className="text-surface-800 capitalize">{completedOrder?.paymentMethod}</span></div>
          </div>
          <div className="border-t border-surface-200 py-2 space-y-1">
            {completedOrder?.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-surface-700">{item.name} ×{item.quantity}</span>
                <span className="text-surface-800">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-200 pt-2 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-surface-500">Subtotal</span><span>{formatCurrency(completedOrder?.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-surface-500">Tax</span><span>{formatCurrency(completedOrder?.tax)}</span></div>
            {completedOrder?.discount > 0 && (
              <div className="flex justify-between text-sm text-success-600"><span>Discount</span><span>-{formatCurrency(completedOrder?.discount)}</span></div>
            )}
            <div className="flex justify-between text-base font-extrabold text-surface-900 pt-1 border-t border-surface-200">
              <span>Total</span><span>{formatCurrency(completedOrder?.total)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 no-print">
          <Button variant="secondary" onClick={handlePrintReceipt} className="flex-1">Print</Button>
          <Button variant="secondary" onClick={() => { setEmailValue(customer?.email || ''); setEmailModalOpen(true); }} className="flex-1">Email</Button>
          <Button onClick={handleNewOrder} className="flex-1">New Order</Button>
        </div>
      </Modal>
    </div>
  );
}
