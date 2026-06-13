import { Link } from 'react-router-dom';
import Logo from '../Logo';
import ProfileDropdown from './ProfileDropdown';
import NotificationDropdown from './NotificationDropdown';

export default function Header({ pageTitle, hamburgerAction, navLinks }) {
  return (
    <header className="bg-cafe-grounds text-cafe-foam h-16 flex items-center justify-between px-4 md:px-6 shadow-cafe z-40 sticky top-0 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4 flex-1">
        {hamburgerAction && (
          <button
            onClick={hamburgerAction}
            className="w-10 h-10 rounded-cafe hover:bg-cafe-roast/30 transition-colors duration-150 flex items-center justify-center"
            aria-label="Open Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link to="/pos" className={`flex items-center`} aria-label="Home">
          <Logo className="h-8" onDark compact />
        </Link>
        {navLinks && <nav className="hidden md:flex items-center gap-2 ml-4">{navLinks}</nav>}
      </div>

      {/* Center */}
      <div className="flex-1 text-center hidden sm:block">
        <h1 className="text-lg font-display font-semibold uppercase tracking-wider">{pageTitle}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center justify-end gap-3 flex-1">
        <NotificationDropdown />
        <ProfileDropdown />
      </div>
    </header>
  );
}
