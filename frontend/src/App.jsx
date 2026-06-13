import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SessionProvider } from './context/SessionContext';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ProductsPlaceholder from './pages/backend/ProductsPlaceholder';
import POSPlaceholder from './pages/pos/POSPlaceholder';
import TablesPlaceholder from './pages/pos/TablesPlaceholder';
import KDSPlaceholder from './pages/kds/KDSPlaceholder';

const App = () => {
  return (
    <AuthProvider>
      <SessionProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />

              {/* Backend Routes */}
              <Route path="/backend" element={<Navigate to="/backend/products" replace />} />
              <Route path="/backend/products" element={<ProductsPlaceholder />} />

              {/* POS Routes */}
              <Route path="/pos" element={<POSPlaceholder />} />
              <Route path="/pos/tables" element={<TablesPlaceholder />} />

              {/* KDS Route */}
              <Route path="/kds" element={<KDSPlaceholder />} />

              {/* Default Redirect */}
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </SessionProvider>
    </AuthProvider>
  );
};

export default App;
