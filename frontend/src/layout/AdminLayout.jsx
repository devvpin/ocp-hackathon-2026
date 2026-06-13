import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';

export default function AdminLayout() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const location = useLocation();

  const isExpanded = isHovered || isClicked;

  // Map route names to pretty titles
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/products')) return 'Products';
    if (path.includes('/categories')) return 'Categories';
    if (path.includes('/inventory')) return 'Inventory';
    if (path.includes('/reservations')) return 'Reservations';
    if (path.includes('/users')) return 'Employees';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/activity')) return 'Activity Logs';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/tables')) return 'Tables';
    if (path.includes('/orders')) return 'Orders';
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-cafe-foam flex flex-col md:flex-row">
      {/* Mobile Top Bar / Header is handled globally via Header component, but we'll use a hamburger for mobile side bar */}
      
      {/* Desktop/Tablet Sidebar */}
      <aside 
        className={`hidden md:flex flex-col sticky top-0 h-screen transition-all duration-300 z-30 flex-shrink-0 ${isExpanded ? 'w-64' : 'w-16'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsClicked(!isClicked)}
      >
        <Sidebar isExpanded={isExpanded} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header pageTitle={getPageTitle()} hamburgerAction={() => setHamburgerOpen(true)} />

        {/* Mobile Hamburger Drawer */}
        {hamburgerOpen && (
          <div className="fixed inset-0 z-[60] flex">
            <div className="absolute inset-0 bg-cafe-grounds/40 backdrop-blur-sm" onClick={() => setHamburgerOpen(false)} />
            <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col animate-slide-right">
              <div className="p-4 border-b border-cafe-crema/30 flex items-center justify-between">
                <span className="font-display font-semibold text-lg text-cafe-espresso">Menu</span>
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

        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
