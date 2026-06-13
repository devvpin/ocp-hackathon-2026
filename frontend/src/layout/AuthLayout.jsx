import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import { CAFE_NAME } from '../config/brand';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cafe-foam to-cafe-crema/40 bg-cafe-texture flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-3">
            <Logo className="h-20" alt={`${CAFE_NAME} logo`} />
            <p className="text-xs text-cafe-grounds/70 font-sans uppercase tracking-wide">Point of Sale</p>
          </div>
        </div>
        <div className="bg-white rounded-cafe shadow-cafe-lg p-8 animate-scale-in border border-cafe-crema/30">
          <Outlet />
        </div>
        <p className="text-center text-cafe-grounds/60 text-xs mt-6 font-sans">
          © 2026 {CAFE_NAME} POS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
