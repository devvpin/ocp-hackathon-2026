import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SessionProvider } from './context/SessionContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AuthLayout from './layout/AuthLayout';
import AdminLayout from './layout/AdminLayout';
import EmployeeLayout from './layout/EmployeeLayout';
import KDSLayout from './layout/KDSLayout';

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
import ReservationsPage from './pages/backend/ReservationsPage';
import DashboardPage from './pages/backend/DashboardPage';

// POS Pages
import TableViewPage from './pages/pos/TableViewPage';
import OrderPage from './pages/pos/OrderPage';
import OrdersListPage from './pages/pos/OrdersListPage';
import CustomersPage from './pages/pos/CustomersPage';

// KDS
import KDSPage from './pages/kds/KDSPage';

// Customer
import CustomerMenuPage from './pages/customer/CustomerMenuPage';

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
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="payment-methods" element={<PaymentMethodsPage />} />
                  <Route path="tables" element={<TablesPage />} />
                  <Route path="promotions" element={<PromotionsPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="pos-session" element={<POSSessionPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="reservations" element={<ReservationsPage />} />
                </Route>

                {/* POS Routes (Authenticated) */}
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute>
                      <EmployeeLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="tables" replace />} />
                  <Route path="tables" element={<TableViewPage />} />
                  <Route path="order/:tableId" element={<OrderPage />} />
                  <Route path="orders" element={<OrdersListPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="reservations" element={<ReservationsPage />} />
                </Route>

                {/* KDS Route (Standalone) */}
                <Route path="/kds" element={<KDSLayout />}>
                  <Route index element={<KDSPage />} />
                </Route>

                {/* Customer Menu Route (Public) */}
                <Route path="/menu/:tableId" element={<CustomerMenuPage />} />

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
