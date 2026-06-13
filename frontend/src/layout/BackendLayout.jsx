import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { CAFE_NAME } from '../config/brand';

const navItems = [
  { to: '/backend/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/backend/categories', label: 'Category', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
  { to: '/backend/payment-methods', label: 'Payment Method', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { to: '/backend/promotions', label: 'Coupon & Promotion', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
  { to: '/backend/tables', label: 'Floor & Tables', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z' },
  { to: '/backend/users', label: 'User / Employee', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
  { to: '/backend/pos-session', label: 'POS Session', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7' },
  { to: '/backend/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export default function BackendLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };
  return (
    <div className="min-h-screen bg-cafe-foam flex">
      <aside className="w-64 bg-cafe-grounds text-cafe-foam border-r border-cafe-espresso/30 flex flex-col flex-shrink-0 sticky top-0 h-screen shadow-cafe-lg">
        <div className="p-6 border-b border-cafe-espresso/30 flex flex-col items-center gap-3">
          <Logo className="h-14" alt={`${CAFE_NAME} logo`} onDark />
          <p className="text-[11px] font-sans font-medium text-cafe-foam/70 uppercase tracking-widest">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            to="/pos/tables"
            className="flex items-center gap-3 px-3 py-3 mb-2 rounded-cafe text-sm font-sans text-cafe-foam/80 hover:bg-cafe-roast/30 hover:text-cafe-foam border-l-4 border-transparent transition-all duration-150"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="truncate">Back to Dashboard</span>
          </Link>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-cafe text-sm font-sans transition-all duration-150 group border-l-4 ${
                  isActive
                    ? 'bg-cafe-roast text-cafe-foam font-medium border-cafe-crema'
                    : 'text-cafe-foam/80 hover:bg-cafe-roast/30 hover:text-cafe-foam border-transparent'
                }`
              }
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-cafe-espresso/30">
          <div className="flex items-center gap-3 px-2 py-2 mb-3 bg-cafe-espresso/30 rounded-cafe">
            <div className="w-9 h-9 bg-cafe-roast rounded-full flex items-center justify-center border border-cafe-crema/40">
              <span className="text-xs font-bold text-cafe-foam">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-cafe-foam truncate font-sans">{user?.name || 'Admin'}</p>
              <p className="text-xs text-cafe-foam/60 truncate font-sans">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-cafe text-sm font-semibold text-cafe-foam/80 hover:bg-status-danger/20 hover:text-cafe-foam transition-all duration-150 font-sans"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
