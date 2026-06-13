import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SearchBar from '../components/SearchBar';
import Logo from '../components/Logo';

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

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 text-sm font-sans font-semibold transition-all duration-150 border-b-2 ${
      isActive
        ? 'text-cafe-foam border-cafe-crema'
        : 'text-cafe-foam/80 border-transparent hover:text-cafe-foam'
    }`;

  return (
    <div className="min-h-screen bg-cafe-foam flex flex-col">
      <header className="bg-cafe-grounds text-cafe-foam h-16 flex items-center px-6 gap-3 flex-shrink-0 shadow-cafe z-50 sticky top-0">
        <Link to="/pos" className="flex items-center mr-4 flex-shrink-0">
          <Logo className="h-10" onDark />
        </Link>
        <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
          <NavLink to="/pos/tables" end className={navLinkClass}>
            Tables
          </NavLink>
          <NavLink to="/pos/orders" className={navLinkClass}>
            Orders
          </NavLink>
          <NavLink to="/pos/customers" className={navLinkClass}>
            Customers
          </NavLink>
        </nav>
        <div className="flex-1 max-w-sm mx-4">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search products..."
            dark
          />
        </div>
        {tableNumber && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cafe-roast/40 border border-cafe-crema/40 rounded-cafe flex-shrink-0">
            <svg className="w-4 h-4 text-cafe-foam" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
            </svg>
            <span className="text-xs font-sans font-bold uppercase tracking-wide text-cafe-foam">Table {tableNumber}</span>
          </div>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-cafe-roast rounded-full flex items-center justify-center border border-cafe-crema/40" title={user?.name || 'User'}>
            <span className="text-xs font-bold text-cafe-foam font-sans">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-cafe hover:bg-cafe-roast/30 transition-colors duration-150 text-cafe-foam/80 hover:text-cafe-foam min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-cafe shadow-cafe-lg border border-cafe-crema/40 py-2 z-50 animate-slide-down">
                  {menuLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-sans text-cafe-grounds hover:bg-cafe-foam transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <hr className="my-2 border-cafe-crema/30" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-sm font-sans text-status-danger hover:bg-status-danger/10 transition-colors duration-150"
                  >
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
