import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

export default function ProfileDropdown() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const adminLinks = [
    { to: '/backend/dashboard', label: 'Dashboard' },
    { to: '/backend/products', label: 'Products' },
    { to: '/backend/categories', label: 'Categories' },
    { to: '/backend/promotions', label: 'Promotions' },
    { to: '/backend/tables', label: 'Tables' },
    { to: '/backend/reservations', label: 'Reservations' },
    { to: '/backend/pos-session', label: 'POS Sessions' },
    { to: '/backend/payment-methods', label: 'Payments' },
    { to: '/backend/users', label: 'Employees' },
    { to: '/backend/reports', label: 'Reports' },
  ];

  const employeeLinks = [
    { to: '/pos/profile', label: 'Profile' },
    { to: '/pos/orders', label: 'Orders' },
    { to: '/pos/session', label: 'Session Summary' },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-cafe-roast rounded-full flex items-center justify-center border-2 border-transparent hover:border-cafe-crema transition-all"
        aria-label="User menu"
      >
        <span className="text-sm font-bold text-cafe-foam">{user?.name?.charAt(0) || 'U'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-cafe shadow-cafe-lg border border-cafe-crema/40 py-2 z-50 animate-slide-down">
          <div className="px-4 py-2 border-b border-cafe-crema/20 mb-2">
            <p className="text-sm font-semibold text-cafe-grounds">{user?.name}</p>
            <p className="text-xs text-cafe-grounds/60 uppercase tracking-wider">{user?.role}</p>
          </div>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm font-sans text-cafe-grounds hover:bg-cafe-foam transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
          <hr className="my-2 border-cafe-crema/30" />
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm font-sans text-status-danger hover:bg-status-danger/10 transition-colors duration-150 font-medium"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
