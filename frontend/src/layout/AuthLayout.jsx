import { Outlet, Link } from 'react-router-dom';
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Odoo Cafe</h1>
              <p className="text-xs text-primary-200 font-medium">Point of Sale</p>
            </div>
          </Link>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-scale-in">
          <Outlet />
        </div>
        <p className="text-center text-primary-200 text-xs mt-6">
          © 2026 Odoo Cafe POS. All rights reserved.
        </p>
      </div>
    </div>
  );
}