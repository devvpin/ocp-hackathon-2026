import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import publicApi from '../../api/public';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/Skeleton';
import Badge from '../../components/Badge';
import { CAFE_NAME } from '../../config/brand';

export default function CustomerMenuPage() {
  const { tableId } = useParams();
  const { success, error: showError } = useToast();
  
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const [cart, setCart] = useState([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestMenuOpen, setRequestMenuOpen] = useState(false);

  const handleTableRequest = async (type) => {
    try {
      await publicApi.createTableRequest(tableId, type);
      success(`Request for ${type} sent to staff.`);
      setRequestMenuOpen(false);
    } catch (err) {
      showError('Failed to send request. Please try again.');
    }
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [tableRes, menuRes] = await Promise.all([
          publicApi.getTableInfo(tableId),
          publicApi.getMenu()
        ]);
        setTable(tableRes.data);
        setCategories(menuRes.data.categories);
        setProducts(menuRes.data.products);
      } catch (err) {
        showError('Failed to load menu. Please make sure the QR code is correct.');
      }
      setLoading(false);
    };
    fetchMenu();
  }, [tableId, showError]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    success(`Added ${product.name} to cart`);
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => prev.map((item) => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        tableId,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity }))
      };
      await publicApi.createOrder(payload);
      setOrderPlaced(true);
      setCartModalOpen(false);
      setCart([]);
    } catch (err) {
      showError('Failed to place order. Please ask a staff member for help.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto h-screen bg-surface-50 flex flex-col">
        <Skeleton height={200} className="mb-4" />
        <Skeleton height={80} count={5} className="mb-2" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="p-8 max-w-md mx-auto text-center mt-20">
        <h1 className="text-2xl font-bold text-surface-800 mb-2">Invalid Table</h1>
        <p className="text-surface-500">Please scan the QR code on your table to view the menu.</p>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="p-8 max-w-md mx-auto text-center mt-20 animate-fade-in">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-800 mb-2">Order Received!</h1>
        <p className="text-surface-600 mb-8">The kitchen is preparing your order now. It will be brought to your table shortly.</p>
        <Button onClick={() => setOrderPlaced(false)} variant="secondary" className="w-full">
          Order More Items
        </Button>
      </div>
    );
  }

  const filteredProducts = products.filter(
    (p) => activeCategory === 'all' || p.categoryId === activeCategory
  );

  return (
    <div className="bg-surface-50 min-h-screen pb-24 font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm rounded-b-3xl">
        <h1 className="text-3xl font-display font-bold text-cafe-espresso text-center mb-1">{CAFE_NAME}</h1>
        <p className="text-center text-sm text-surface-500 font-medium uppercase tracking-widest">
          Table {table.number}
        </p>
      </div>

      {/* Categories */}
      <div className="px-4 mt-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === 'all' ? 'bg-cafe-roast text-white shadow-md' : 'bg-white text-surface-600 border border-surface-200'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id ? 'text-white shadow-md' : 'bg-white text-surface-600 border border-surface-200'
              }`}
              style={{
                backgroundColor: activeCategory === cat.id ? cat.color : undefined,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="px-4 mt-4 space-y-3">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-surface-100 flex justify-between items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-surface-900 truncate text-base">{product.name}</h3>
              <p className="text-surface-500 text-xs mt-0.5 line-clamp-2">{product.description || 'Delicious freshly made item'}</p>
              <div className="mt-2 text-primary-700 font-extrabold">{formatCurrency(product.price)}</div>
            </div>
            <button 
              onClick={() => addToCart(product)}
              className="w-12 h-12 rounded-full bg-cafe-foam text-cafe-roast flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform shadow-sm"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 animate-slide-up">
          <button 
            onClick={() => setCartModalOpen(true)}
            className="w-full bg-cafe-roast text-white rounded-2xl shadow-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                {cartCount}
              </div>
              <span className="font-bold text-lg">View Order</span>
            </div>
            <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      <Modal isOpen={cartModalOpen} onClose={() => setCartModalOpen(false)} title="Your Order" size="md">
        <div className="space-y-4 pb-20">
          <div className="space-y-3 max-h-[60vh] overflow-auto px-1">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center py-2 border-b border-surface-100 last:border-0">
                <div className="flex-1">
                  <div className="font-bold text-surface-800">{item.product.name}</div>
                  <div className="text-surface-500 text-sm">{formatCurrency(item.product.price)}</div>
                </div>
                <div className="flex items-center gap-3 bg-surface-100 rounded-full px-2 py-1">
                  <button onClick={() => item.quantity === 1 ? removeFromCart(item.product.id) : updateQuantity(item.product.id, -1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm text-surface-600 font-bold active:scale-90">-</button>
                  <span className="font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm text-surface-600 font-bold active:scale-90">+</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-surface-200 pt-4">
            <div className="flex justify-between items-center mb-6 text-xl">
              <span className="font-bold text-surface-900">Total</span>
              <span className="font-extrabold text-cafe-espresso">{formatCurrency(cartTotal)}</span>
            </div>
            <Button 
              className="w-full text-lg py-4 rounded-xl shadow-lg" 
              size="lg" 
              onClick={placeOrder}
              loading={submitting}
            >
              Send to Kitchen
            </Button>
          </div>
        </div>
      </Modal>
      {/* Customer Service Floating Button */}
      <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-3 animate-slide-up">
        {requestMenuOpen && (
          <div className="flex flex-col gap-2 mb-2 items-end">
            <button onClick={() => handleTableRequest('waiter')} className="bg-white text-surface-800 font-bold px-4 py-2 rounded-full shadow-lg border border-surface-200 text-sm flex items-center gap-2 hover:bg-surface-50">
              <span>🙋</span> Call Waiter
            </button>
            <button onClick={() => handleTableRequest('water')} className="bg-white text-surface-800 font-bold px-4 py-2 rounded-full shadow-lg border border-surface-200 text-sm flex items-center gap-2 hover:bg-surface-50">
              <span>💧</span> Water
            </button>
            <button onClick={() => handleTableRequest('clean')} className="bg-white text-surface-800 font-bold px-4 py-2 rounded-full shadow-lg border border-surface-200 text-sm flex items-center gap-2 hover:bg-surface-50">
              <span>🧹</span> Clean Table
            </button>
            <button onClick={() => handleTableRequest('bill')} className="bg-cafe-espresso text-white font-bold px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 hover:bg-cafe-roast">
              <span>💳</span> Request Bill
            </button>
          </div>
        )}
        <button 
          onClick={() => setRequestMenuOpen(!requestMenuOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${requestMenuOpen ? 'bg-surface-200 text-surface-700' : 'bg-white text-cafe-espresso border border-cafe-crema/50'}`}
        >
          {requestMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
