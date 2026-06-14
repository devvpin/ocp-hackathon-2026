import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
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
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-cafe shadow-cafe-lg border border-cafe-crema/40 py-3 z-50 animate-slide-down">
          <div className="px-4 pb-3 border-b border-cafe-crema/20">
            <p className="text-sm font-semibold text-cafe-grounds truncate">{user?.name}</p>
            <p className="text-xs text-cafe-grounds/60 uppercase tracking-wider mt-0.5">{user?.role}</p>
          </div>
          <div className="pt-2 px-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm font-sans text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors font-medium"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
