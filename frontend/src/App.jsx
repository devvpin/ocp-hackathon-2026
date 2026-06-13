import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SessionProvider } from './context/SessionContext';
import { ToastProvider } from './context/ToastContext';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ProductsPlaceholder from './pages/backend/ProductsPlaceholder';
import POSPlaceholder from './pages/pos/POSPlaceholder';
import TablesPlaceholder from './pages/pos/TablesPlaceholder';
import KDSPlaceholder from './pages/kds/KDSPlaceholder';
import DevComponents from './pages/DevComponents';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <SessionProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                {/* Dev Route */}
                {import.meta.env.DEV && (
                  <Route path="/dev/components" element={<DevComponents />} />
                )}

                {/* Auth Routes */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />

                {/* Backend Routes (Admin Only) */}
                <Route path="/backend" element={
                  <AdminRoute>
                    <Navigate to="/backend/products" replace />
                  </AdminRoute>
                } />
                <Route path="/backend/products" element={
                  <AdminRoute>
                    <ProductsPlaceholder />
                  </AdminRoute>
                } />

                {/* POS Routes (Protected, but open to Employee/Admin) */}
                <Route path="/pos" element={
                  <ProtectedRoute>
                    <POSPlaceholder />
                  </ProtectedRoute>
                } />
                <Route path="/pos/tables" element={
                  <ProtectedRoute>
                    <TablesPlaceholder />
                  </ProtectedRoute>
                } />

                {/* KDS Route (Open per specification) */}
                <Route path="/kds" element={<KDSPlaceholder />} />

                {/* Default Redirect */}
                <Route path="*" element={<Navigate to="/auth/login" replace />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </SessionProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
