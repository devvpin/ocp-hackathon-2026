import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams, Link, useParams } from 'react-router-dom';
import productsApi from '../../api/products';
import categoriesApi from '../../api/categories';
import ordersApi from '../../api/orders';
import paymentMethodsApi from '../../api/paymentMethods';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import useSocket from '../../hooks/useSocket';
import QRCode from '../../components/QRCode';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import Logo from '../../components/Logo';
import { CAFE_NAME } from '../../config/brand';
import ConfirmDialog from '../../components/ConfirmDialog';
export default function OrderPage() {
  const { tableId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const {
    items, tableNumber, customer, totals, coupon, orderId, status, kitchenCompleted,
    addItem, removeItem, updateQuantity, setTable, setOrderId,
    setCustomer, setCoupon, removeCoupon, clearCart, loadOrder,
    orderType, setOrderType
  } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmFreeModal, setConfirmFreeModal] = useState(false);
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
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
            tax: i.tax || 0,
          })),
          customer: order.customerId ? { id: order.customerId, name: order.customerName } : null,
          orderId: order.id,
          tableId: order.tableId,
          tableNumber: order.tableNumber,
          status: order.status,
          kitchenCompleted: order.kitchenCompleted,
        });
      }).catch(() => {});
    }
  }, [tableId]);

  // Auto-save draft order when cart changes
  useEffect(() => {
    if (!tableId || items.length === 0 || status !== 'draft') return;

    const saveDraft = async () => {
      try {
        const editOrderId = searchParams.get('orderId') || orderId;
        const createPayload = {
          tableId: tableId || null,
          customerId: customer?.id || null,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        };
        if (coupon?.code) createPayload.couponCode = coupon.code;

        if (editOrderId) {
          await ordersApi.update(editOrderId, createPayload);
        } else {
          const res = await ordersApi.create(createPayload);
          setOrderId(res.data.id);
          setSearchParams({ orderId: res.data.id });
        }
      } catch (err) {
        console.error('Failed to auto-save draft order:', err);
      }
    };

    // Debounce auto-save to avoid spamming the backend
    const timer = setTimeout(() => {
      saveDraft();
    }, 1000);

    return () => clearTimeout(timer);
  }, [items, customer, coupon, tableId, orderId, searchParams, setSearchParams]);
  // Listen for global search from POS nav
  useEffect(() => {
    const handler = (e) => setProductSearch(e.detail || '');
    window.addEventListener('pos-search', handler);
    return () => window.removeEventListener('pos-search', handler);
  }, []);
  const getCategoryColor = useCallback((catId) => categories.find((c) => c.id === catId)?.color || '#94a3b8', [categories]);
  const getCategoryName = useCallback((catId) => categories.find((c) => c.id === catId)?.name || '', [categories]);
  
  useSocket(null, (msg) => {
    const activeOrderId = searchParams.get('orderId') || orderId;
    if (activeOrderId && ['kds:order_received', 'kds:stage_changed', 'kds:item_done', 'order:sent_to_kitchen', 'order:preparing', 'order:ready', 'order:served', 'order:kitchen_completed', 'order:completed', 'order:paid'].includes(msg.event)) {
      const p = msg.payload;
      if (p.orderId === activeOrderId) {
        ordersApi.getById(activeOrderId).then((res) => {
          const order = res.data;
          loadOrder({
            items: order.items.map((i) => ({
              productId: i.productId,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              tax: i.tax || 0,
            })),
            customer: order.customerId ? { id: order.customerId, name: order.customerName } : null,
            orderId: order.id,
            tableId: order.tableId,
            tableNumber: order.tableNumber,
            status: order.status,
            kitchenCompleted: order.kitchenCompleted,
          });
        }).catch(() => {});
      }
    }
  });

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const handleApplyCoupon = async () => {
    if (status !== 'draft') return showError('Cannot modify non-draft order');
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
      const editOrderId = searchParams.get('orderId') || orderId;
      const payload = {
        tableId: tableId || null,
        orderType,
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
      
      // Instantly update the local state so the UI reflects the sent_to_kitchen status
      const updatedOrder = await ordersApi.getById(savedOrder.data.id);
      const order = updatedOrder.data;
      loadOrder({
        items: order.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          tax: i.tax || 0,
        })),
        customer: order.customerId ? { id: order.customerId, name: order.customerName } : null,
        orderId: order.id,
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        status: order.status,
        kitchenCompleted: order.kitchenCompleted,
      });

      setOrderId(savedOrder.data.id);
      success('Order sent to kitchen!');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Failed to send to kitchen';
      showError(msg);
    }
  };

  const handleMarkServed = async () => {
    try {
      await ordersApi.markServed(orderId);
      success('Order marked as served');
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to serve order');
    }
  };

  const handleCancelOrder = async () => {
    if (status !== 'draft') return showError('Cannot cancel order that has been sent to kitchen');
    const editOrderId = searchParams.get('orderId') || orderId;
    if (!editOrderId) {
      clearCart();
      navigate('/pos/tables');
      return;
    }
    setConfirmFreeModal(true);
  };
  const handleConfirmFreeTable = async () => {
    const editOrderId = searchParams.get('orderId') || orderId;
    try {
      if (status === 'paid' || status === 'completed') {
        await ordersApi.freeTable(editOrderId);
        success('Table freed successfully');
      } else {
        await ordersApi.cancel(editOrderId);
        success('Order cancelled and table freed');
      }
      clearCart();
      setConfirmFreeModal(false);
      navigate('/pos/tables');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Failed to process table action';
      showError(msg);
    }
  };
  const loadRazorpayScript = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK.'));
    document.body.appendChild(script);
  });

  const handleCompletePayment = async () => {
    if (items.length === 0) { showError('Cart is empty'); return; }
    const editOrderId = searchParams.get('orderId') || orderId;
    if (!editOrderId) { showError('No order to pay'); return; }

    const canPay = kitchenCompleted || ['ready', 'served'].includes(status);
    if (!canPay) {
      showError('Order cannot be paid until kitchen preparation is completed.');
      return;
    }
    if (!selectedPayment) { showError('Select a payment method'); return; }
    setPaymentLoading(true);

    try {
      let paymentOrderId = editOrderId;
      let orderNumber;

      if (status === 'draft') {
        const createPayload = {
          tableId: tableId || null,
          orderType,
          customerId: customer?.id || null,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        };
        if (coupon?.code) createPayload.couponCode = coupon.code;
        const res = await ordersApi.update(editOrderId, createPayload);
        paymentOrderId = res.data.id;
        orderNumber = res.data.orderNumber;
      } else {
        const res = await ordersApi.getById(editOrderId);
        orderNumber = res.data.orderNumber;
      }

      if (selectedPayment === 'upi') {
        setPaymentLoading(false);
        return;
      }

      const { default: paymentsApi } = await import('../../api/payments');

      if (selectedPayment === 'card' && razorpayKeyId) {
        const orderRes = await paymentsApi.createRazorpayOrder({ orderId: paymentOrderId });
        await loadRazorpayScript();

        const options = {
          key: razorpayKeyId,
          amount: orderRes.data.amount,
          currency: orderRes.data.currency,
          order_id: orderRes.data.razorpayOrderId,
          name: CAFE_NAME,
          description: `Order #${orderNumber}`,
          handler: async (response) => {
            try {
              await paymentsApi.verifyRazorpay({
                orderId: paymentOrderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              finishPayment(paymentOrderId, orderNumber, 'card');
            } catch (err) {
              const msg = err?.response?.data?.error?.message || 'Razorpay verification failed';
              showError(msg);
            }
          },
          prefill: {
            name: customer?.name || 'Walk-in Customer',
            email: customer?.email || '',
          },
          theme: { color: '#4F46E5' },
          modal: {
            ondismiss: () => {
              setPaymentLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        setPaymentLoading(false);
        return;
      }

      // Cash / manual card fallback
      const payRef = selectedPayment === 'card' ? (cardRef || 'card-txn') : null;
      await paymentsApi.processPayment({
        orderId: paymentOrderId,
        amount: totals.total,
        paymentMethod: selectedPayment,
        transactionReference: payRef,
      });
      finishPayment(paymentOrderId, orderNumber, selectedPayment);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Payment failed';
      showError(msg);
    }
    setPaymentLoading(false);
  };

  const finishPayment = (paymentOrderId, orderNumber, method) => {
    setCompletedOrder({
      id: paymentOrderId,
      orderNumber,
      tableNumber: tableNumber || Number(tableId),
      customerName: customer?.name || 'Walk-in',
      paymentMethod: method,
      items: totals.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        total: i.price * i.quantity,
        discount: i.discount || 0,
      })),
      subtotal: totals.subtotal,
      tax: totals.taxTotal,
      discount: totals.totalDiscount,
      total: totals.total,
    });
    setReceiptModalOpen(true);
    setPaymentModalOpen(false);
    success('Payment completed!');
    clearCart();
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
      </div>
    );
  }
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* LEFT - Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-cafe-crema/30">
        {/* Category Tabs */}
        <div className="flex gap-2 p-3 overflow-x-auto flex-shrink-0 bg-white border-b border-cafe-crema/30">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-cafe text-sm font-display font-semibold whitespace-nowrap transition-all duration-150 ${
              activeCategory === 'all' ? 'bg-cafe-roast text-cafe-foam shadow-cafe' : 'bg-cafe-foam text-cafe-grounds hover:bg-cafe-crema/30'
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
            className="w-full px-4 py-2.5 rounded-cafe bg-white border border-cafe-crema text-sm font-sans focus:outline-none focus:ring-2 focus:ring-cafe-roast"
          />
        </div>
        {/* Product Cards */}
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  if (status === 'draft') addItem(product);
                  else showError('Cannot add items to non-draft order');
                }}
                className={`bg-white rounded-cafe border border-cafe-crema/30 p-4 text-left transition-all duration-150 group shadow-cafe ${status === 'draft' ? 'hover:shadow-cafe-lg hover:border-cafe-crema active:scale-[0.97]' : 'opacity-70 cursor-not-allowed'}`}
              >
                <div
                  className="w-full h-20 rounded-xl mb-3 flex items-center justify-center text-2xl opacity-70 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: `${getCategoryColor(product.categoryId)}12` }}
                >
                  ☕
                </div>
                <h3 className="text-sm font-sans font-medium text-cafe-grounds mb-1 truncate">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-base font-sans font-semibold tabular-nums text-cafe-espresso">{formatCurrency(product.price)}</span>
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
      <div className="w-80 flex flex-col bg-white border-r border-cafe-crema/30 flex-shrink-0">
        <div className="p-3 border-b border-cafe-crema/30">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-sans font-bold text-cafe-grounds flex items-center gap-1">
              Cart 
              {tableNumber ? (
                <>
                  <span className="text-cafe-roast uppercase text-xs tracking-wide">· Table {tableNumber}</span>
                  <button onClick={() => navigate('/pos/tables')} className="ml-1 text-surface-400 hover:text-primary-600 transition-colors" title="Back to Floor Plan">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </>
              ) : ''}
            </h2>
            {tableNumber && status === 'draft' && (
              <button
                onClick={handleCancelOrder}
                className="text-xs font-bold px-2 py-1 bg-danger-50 text-danger-600 rounded hover:bg-danger-100 transition-colors"
              >
                Cancel Order
              </button>
            )}
            {tableNumber && (status === 'paid' || status === 'completed') && (
              <button
                onClick={() => setConfirmFreeModal(true)}
                className="text-xs font-bold px-2 py-1 bg-status-success/10 text-status-success rounded hover:bg-status-success/20 transition-colors"
              >
                Free Table
              </button>
            )}
          </div>
          {customer && (
            <p className="text-xs text-surface-500 mt-0.5">Customer: {customer.name}</p>
          )}
          <div className="flex rounded-md mt-2 bg-surface-100 p-1 w-full">
            <button
              onClick={() => status === 'draft' && setOrderType('dine_in')}
              className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-colors ${orderType === 'dine_in' ? 'bg-white shadow text-cafe-espresso' : 'text-surface-500 hover:text-surface-800'}`}
              disabled={status !== 'draft'}
            >
              Dine-In
            </button>
            <button
              onClick={() => status === 'draft' && setOrderType('pickup')}
              className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-colors ${orderType === 'pickup' ? 'bg-white shadow text-cafe-espresso' : 'text-surface-500 hover:text-surface-800'}`}
              disabled={status !== 'draft'}
            >
              Pickup
            </button>
          </div>
        </div>
        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-400">
              <svg className="w-12 h-12 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            totals.items.map((item) => (
              <div key={item.productId} className="rounded-cafe p-3 animate-slide-up relative group border-b border-cafe-crema/30 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-800 truncate">{item.name}</p>
                    <p className="text-xs text-surface-500">{formatCurrency(item.price)} each</p>
                  </div>
                  <button
                    onClick={() => {
                      if (status === 'draft') removeItem(item.productId);
                    }}
                    className={`p-1 rounded-lg transition-colors flex-shrink-0 ${status === 'draft' ? 'hover:bg-danger-100 text-surface-400 hover:text-danger-500 cursor-pointer' : 'opacity-50 cursor-not-allowed text-surface-300'}`}
                    aria-label="Remove item"
                    disabled={status !== 'draft'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { if (status === 'draft') updateQuantity(item.productId, item.quantity - 1); }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 min-w-[44px] min-h-[44px] ${status === 'draft' ? 'bg-cafe-crema/40 hover:bg-cafe-crema text-cafe-espresso active:scale-95 cursor-pointer' : 'opacity-50 cursor-not-allowed text-surface-300'}`}
                      aria-label="Decrease quantity"
                      disabled={status !== 'draft'}
                    >−</button>
                    <span className="text-sm font-sans font-semibold tabular-nums text-cafe-grounds w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => { if (status === 'draft') updateQuantity(item.productId, item.quantity + 1); }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 min-w-[44px] min-h-[44px] ${status === 'draft' ? 'bg-cafe-crema/40 hover:bg-cafe-crema text-cafe-espresso active:scale-95 cursor-pointer' : 'opacity-50 cursor-not-allowed text-surface-300'}`}
                      aria-label="Increase quantity"
                      disabled={status !== 'draft'}
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
        </div>
        {/* Cart Totals & Discounts */}
        <div className="flex-shrink-0 bg-cafe-foam border-t border-cafe-crema/30 p-3 space-y-2">
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
        <div className="border-t border-cafe-crema/30 p-3 space-y-1.5 bg-cafe-foam">
          <div className="flex justify-between text-xs font-sans text-cafe-grounds/70 tabular-nums">
            <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs font-sans text-cafe-grounds/70 tabular-nums">
            <span>Tax</span><span>{formatCurrency(totals.taxTotal)}</span>
          </div>
          {totals.totalDiscount > 0 && (
            <div className="flex justify-between text-xs font-sans text-status-success tabular-nums">
              <span>Discount</span><span>-{formatCurrency(totals.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-display text-xl font-bold text-cafe-espresso pt-1 border-t border-dashed border-cafe-crema tabular-nums">
            <span>Total</span><span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="p-3 border-t border-surface-200 flex flex-col gap-2 bg-white">
          {status === 'draft' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" onClick={() => { handleLoadCustomers(); setCustomerModalOpen(true); }}>
                  Assign Customer
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setCouponModalOpen(true)}>
                  Discount
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button size="sm" variant="danger" onClick={handleCancelOrder}>
                  Cancel
                </Button>
                <Button size="sm" variant="success" onClick={handleSendToKitchen} disabled={items.length === 0}>
                  Send to Kitchen
                </Button>
              </div>
            </>
          ) : (
            <>
              {status === 'ready' && (
                <Button 
                  size="lg" 
                  variant="success" 
                  className="w-full py-3 text-lg font-bold shadow-cafe-lg mb-2"
                  onClick={handleMarkServed}
                >
                  Mark Served
                </Button>
              )}
              {(kitchenCompleted && ['ready', 'served'].includes(status)) || status === 'served' ? (
                <Button 
                  size="lg" 
                  variant="primary" 
                  className="w-full py-3 text-lg font-bold shadow-cafe-lg"
                  onClick={() => setPaymentModalOpen(true)}
                >
                  Pay Now
                </Button>
              ) : null}
              {status === 'ready' && !kitchenCompleted && (
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full py-3 text-lg font-bold shadow-cafe-lg opacity-70 cursor-not-allowed"
                  disabled
                >
                  Waiting for Kitchen...
                </Button>
              )}
              {['sent_to_kitchen', 'preparing'].includes(status) && (
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full py-3 text-lg font-bold shadow-cafe-lg opacity-70 cursor-not-allowed"
                  disabled
                >
                  Preparing in Kitchen...
                </Button>
              )}
              {['paid', 'completed'].includes(status) && (
                <Button 
                  size="lg" 
                  variant="primary" 
                  className="w-full py-3 text-lg font-bold shadow-cafe-lg mb-2"
                  onClick={() => {
                    // Try to load completed order details to show receipt
                    ordersApi.getById(orderId).then(res => {
                      setCompletedOrder(res.data);
                      setReceiptModalOpen(true);
                    }).catch(() => showError('Failed to load receipt'));
                  }}
                >
                  View Receipt
                </Button>
              )}
              {tableId && ['paid', 'completed', 'served', 'ready'].includes(status) && (
                <Button size="sm" variant="danger" onClick={() => setConfirmFreeModal(true)} className="mt-1 w-full">
                  Free Table
                </Button>
              )}
              {['sent_to_kitchen', 'preparing'].includes(status) && (
                <Button size="sm" variant="danger" onClick={handleCancelOrder} className="mt-1 w-full">
                  Cancel Order
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {/* Payment Modal */}
      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Complete Payment" size="md">
        <div className="space-y-4 max-h-[70vh] overflow-auto px-1">
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPayment(method.type)}
                className={`w-full p-4 rounded-cafe border-2 text-left transition-all duration-150 min-h-[44px] ${
                  selectedPayment === method.type
                    ? 'border-cafe-roast bg-cafe-roast/5 shadow-cafe'
                    : 'border-cafe-crema bg-white hover:border-cafe-roast/50'
                }`}
              >
                <p className="text-sm font-bold text-surface-900">{method.name}</p>
                <p className="text-xs text-surface-500 mt-0.5">
                  {method.type === 'cash' && 'Pay with cash'}
                  {method.type === 'card' && (razorpayKeyId ? 'Card via Razorpay test gateway' : 'Card / Digital payment')}
                  {method.type === 'upi' && 'Scan QR code'}
                </p>
              </button>
            ))}
          </div>
          
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
          
          {selectedPayment === 'upi' && upiMethod && (
            <div className="space-y-3 animate-slide-up">
              {upiMethod.upiId ? (
                <>
                  <div className="flex justify-center p-4 bg-white rounded-xl border border-surface-200">
                    <QRCode
                      value={`upi://pay?pa=${encodeURIComponent(upiMethod.upiId)}&pn=${encodeURIComponent(CAFE_NAME)}&am=${totals.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order payment')}`}
                      size={200}
                      showCaption={false}
                    />
                  </div>
                  <p className="text-center text-xs text-surface-500">
                    UPI ID: <span className="font-mono font-semibold text-surface-800">{upiMethod.upiId}</span>
                  </p>
                  <p className="text-center text-xl font-bold text-cafe-espresso tabular-nums">{formatCurrency(totals.total)}</p>
                  <p className="text-center text-xs text-surface-400">Ask customer to scan with any UPI app, then click Confirm once paid.</p>
                </>
              ) : (
                <div className="p-4 bg-warning-50 border border-warning-200 rounded-xl text-center">
                  <p className="text-sm font-medium text-warning-800">UPI ID not configured.</p>
                  <p className="text-xs text-warning-600 mt-1">Go to Admin → Payment Methods and set your UPI ID.</p>
                </div>
              )}
            </div>
          )}
          
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
          
          <div className="pt-4 border-t border-surface-200">
            <Button
              className="w-full text-lg py-3 shadow-cafe-lg"
              size="lg"
              onClick={handleCompletePayment}
              loading={paymentLoading}
              disabled={
                !selectedPayment ||
                (selectedPayment === 'cash' && cashTendered !== '' && Number(cashTendered) < totals.total) ||
                (selectedPayment === 'card' && !razorpayKeyId && !cardRef) ||
                (selectedPayment === 'upi' && !upiMethod?.upiId)
              }
            >
              Confirm Payment · {formatCurrency(totals.total)}
            </Button>
          </div>
        </div>
      </Modal>
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
          <div className="pt-2 text-center">
            <Link to="/backend/promotions" className="text-xs text-primary-600 hover:text-primary-800 font-medium hover:underline">
              Manage Coupons & Promotions
            </Link>
          </div>
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
        <div className="print-area font-sans">
          <div className="text-center mb-4 pb-4 border-b border-dashed border-cafe-crema">
            <Logo className="h-14 mx-auto mb-2" alt={`${CAFE_NAME} logo`} />
            <h2 className="font-display text-lg font-semibold text-cafe-espresso">{CAFE_NAME}</h2>
            <p className="text-xs text-cafe-grounds/60 mt-1">Order #{completedOrder?.orderNumber || completedOrder?.id}</p>
          </div>
          <div className="space-y-2 mb-4 text-sm tabular-nums">
            <div className="flex justify-between"><span className="text-cafe-grounds/70">Date</span><span className="text-cafe-grounds">{new Date().toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-cafe-grounds/70">Table</span><span className="text-cafe-grounds">{completedOrder?.tableNumber}</span></div>
            <div className="flex justify-between"><span className="text-cafe-grounds/70">Customer</span><span className="text-cafe-grounds">{completedOrder?.customerName || 'Walk-in'}</span></div>
            <div className="flex justify-between"><span className="text-cafe-grounds/70">Payment</span><span className="text-cafe-grounds capitalize">{completedOrder?.paymentMethod}</span></div>
          </div>
          <div className="border-t border-dashed border-cafe-crema py-2 space-y-1">
            {completedOrder?.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm tabular-nums">
                <span className="text-cafe-grounds">{item.name} ×{item.quantity}</span>
                <div className="text-right">
                  <span className="text-cafe-grounds block">{formatCurrency(item.total)}</span>
                  {item.discount > 0 && (
                    <span className="text-xs text-status-success block">-{formatCurrency(item.discount)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-cafe-crema pt-2 space-y-1 tabular-nums">
            <div className="flex justify-between text-sm"><span className="text-cafe-grounds/70">Subtotal</span><span className="text-cafe-grounds">{formatCurrency(completedOrder?.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-cafe-grounds/70">Tax</span><span className="text-cafe-grounds">{formatCurrency(completedOrder?.tax)}</span></div>
            {completedOrder?.discount > 0 && (
              <div className="flex justify-between text-sm text-status-success"><span>Discount</span><span>-{formatCurrency(completedOrder?.discount)}</span></div>
            )}
            <div className="flex justify-between font-display text-lg font-bold text-cafe-espresso pt-1 border-t border-dashed border-cafe-crema">
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
      <ConfirmDialog
        isOpen={confirmFreeModal}
        onClose={() => setConfirmFreeModal(false)}
        onConfirm={handleConfirmFreeTable}
        title="Free Table"
        message="Are you sure you want to cancel this order? This will free the table."
        confirmText="Free Table"
      />
    </div>
  );
}
