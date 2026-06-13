import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Logo from '../components/Logo';
import Sidebar from '../components/layout/Sidebar';

export default function EmployeeLayout() {
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setHamburgerOpen(false);
  }, [location]);

  useEffect(() => {
    setHamburgerOpen(false);
  }, [location]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/orders')) return 'Orders';
    if (path.includes('/customers')) return 'Customers';
    if (path.includes('/tables')) return 'Tables';
    if (path.includes('/reservations')) return 'Reservations';
    if (path.includes('/notifications')) return 'Notifications';
    return 'POS';
  };

  const navLinks = (
    <>
      <NavLink to="/pos/orders" className={({isActive}) => `px-3 py-1.5 rounded text-sm font-medium transition-colors ${isActive ? 'bg-cafe-roast text-cafe-foam' : 'text-cafe-foam/70 hover:bg-cafe-roast/50 hover:text-cafe-foam'}`}>
        Orders
      </NavLink>
      <NavLink to="/kds" className={({isActive}) => `px-3 py-1.5 rounded text-sm font-medium transition-colors ${isActive ? 'bg-cafe-roast text-cafe-foam' : 'text-cafe-foam/70 hover:bg-cafe-roast/50 hover:text-cafe-foam'}`}>
        KDS
      </NavLink>
    </>
  );

  return (
    <div className="min-h-screen bg-cafe-foam flex flex-col relative">
      <Header 
        pageTitle={getPageTitle()} 
        hamburgerAction={() => setHamburgerOpen(true)}
        navLinks={navLinks}
      />

      {/* Hamburger Drawer */}
      {hamburgerOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-cafe-grounds/40 backdrop-blur-sm" onClick={() => setHamburgerOpen(false)} />
          <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col animate-slide-right">
            <div className="p-4 border-b border-cafe-crema/30 flex items-center justify-between">
              <Logo className="h-8" />
              <button onClick={() => setHamburgerOpen(false)} className="p-2 text-cafe-grounds/60 hover:text-cafe-grounds hover:bg-cafe-foam rounded-cafe">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto" onClick={(e) => {
              if (e.target.closest('a')) setHamburgerOpen(false);
            }}>
              <Sidebar isExpanded={true} />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col relative">
        <Outlet />
      </main>
    </div>
  );
}
