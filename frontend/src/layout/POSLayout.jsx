import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SearchBar from '../components/SearchBar';
export default function POSLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { tableNumber } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };
  const handleSearch = (query) => {
    setSearchQuery(query);
    // Dispatch search via custom event so OrderPage can listen
    window.dispatchEvent(new CustomEvent('pos-search', { detail: query }));
  };
  const allMenuLinks = [
    { to: '/backend/products', label: 'Products', adminOnly: true },
    { to: '/backend/categories', label: 'Category', adminOnly: true },
    { to: '/backend/payment-methods', label: 'Payment Method', adminOnly: true },
    { to: '/backend/promotions', label: 'Coupon & Promotion', adminOnly: true },
    { to: '/backend/tables', label: 'Floor & Tables', adminOnly: true },
    { to: '/backend/users', label: 'User / Employee', adminOnly: true },
    { to: '/kds', label: 'KDS', adminOnly: false },
    { to: '/backend/reports', label: 'Reports', adminOnly: true },
  ];
  
  const menuLinks = allMenuLinks.filter(link => !link.adminOnly || isAdmin);
  return (
    <div className="min-h-screen bg-surface-100 flex flex-col">
      {/* Top Nav */}
      <header className="bg-white/80 backdrop-blur-md border-b border-surface-200/50 h-16 flex items-center px-6 gap-3 flex-shrink-0 shadow-sm z-50 sticky top-0 transition-all">
        <Link to="/pos" className="flex items-center gap-3 mr-6 flex-shrink-0 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-surface-900 to-surface-700 hidden sm:block tracking-tight">Odoo Cafe</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          <NavLink to="/pos/tables" end className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${isActive ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'}`}>
            Tables
          </NavLink>
          <NavLink to="/pos/orders" className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${isActive ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'}`}>
            Orders
          </NavLink>
          <NavLink to="/pos/customers" className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${isActive ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'}`}>
            Customers
          </NavLink>
        </nav>
        <div className="flex-1 max-w-sm mx-4">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search products..."
          />
        </div>
        {tableNumber && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-warning-50 border border-warning-500/30 rounded-xl flex-shrink-0">
            <svg className="w-4 h-4 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
            </svg>
            <span className="text-sm font-bold text-warning-700">Table {tableNumber}</span>
          </div>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center" title={user?.name || 'User'}>
            <span className="text-xs font-bold text-primary-700">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          {/* Hamburger Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl hover:bg-surface-100 transition-colors text-surface-600"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-surface-200 py-2 z-50 animate-slide-down">
                  {menuLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <hr className="my-2 border-surface-200" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}