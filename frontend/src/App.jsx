import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SessionProvider } from './context/SessionContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AuthLayout from './layout/AuthLayout';
import BackendLayout from './layout/BackendLayout';
import POSLayout from './layout/POSLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Backend Pages
import ProductsPage from './pages/backend/ProductsPage';
import CategoriesPage from './pages/backend/CategoriesPage';
import PaymentMethodsPage from './pages/backend/PaymentMethodsPage';
import TablesPage from './pages/backend/TablesPage';
import PromotionsPage from './pages/backend/PromotionsPage';
import UsersPage from './pages/backend/UsersPage';
import POSSessionPage from './pages/backend/POSSessionPage';
import ReportsPage from './pages/backend/ReportsPage';

// POS Pages
import TableViewPage from './pages/pos/TableViewPage';
import OrderPage from './pages/pos/OrderPage';
import OrdersListPage from './pages/pos/OrdersListPage';
import CustomersPage from './pages/pos/CustomersPage';

// KDS
import KDSPage from './pages/kds/KDSPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <SessionProvider>
            <CartProvider>
              <Routes>
                {/* Auth Routes */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route path="login" element={<LoginPage />} />
                  <Route path="signup" element={<Navigate to="login" replace />} />
                  <Route index element={<Navigate to="login" replace />} />
                </Route>

                {/* Backend Routes (Admin Only) */}
                <Route
                  path="/backend"
                  element={
                    <ProtectedRoute requireAdmin>
                      <BackendLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="products" replace />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="payment-methods" element={<PaymentMethodsPage />} />
                  <Route path="tables" element={<TablesPage />} />
                  <Route path="promotions" element={<PromotionsPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="pos-session" element={<POSSessionPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                </Route>

                {/* POS Routes (Authenticated) */}
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute>
                      <POSLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="tables" replace />} />
                  <Route path="tables" element={<TableViewPage />} />
                  <Route path="order/:tableId" element={<OrderPage />} />
                  <Route path="orders" element={<OrdersListPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                </Route>

                {/* KDS Route (Standalone) */}
                <Route path="/kds" element={<KDSPage />} />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/auth/login" replace />} />
                <Route path="*" element={<Navigate to="/auth/login" replace />} />
              </Routes>
            </CartProvider>
          </SessionProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
