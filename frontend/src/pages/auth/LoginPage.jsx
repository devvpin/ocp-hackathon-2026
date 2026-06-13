import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';

const inputBase = 'w-full px-4 py-2.5 rounded-cafe border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-cafe-roast focus:border-cafe-roast transition-all duration-150';
const inputNormal = `${inputBase} border-cafe-crema bg-white text-cafe-grounds`;
const inputError = `${inputBase} border-status-danger bg-status-danger/5`;

export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/pos', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/pos', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Invalid credentials';
      showError(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-cafe-espresso mb-1 tracking-wide">Welcome back</h2>
      <p className="text-sm font-sans text-cafe-grounds/70 mb-6">Sign in to your account to continue</p>
      {errors.general && (
        <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/30 rounded-cafe text-sm text-status-danger font-sans">
          {errors.general}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-cafe-grounds mb-1.5 font-sans">Email</label>
          <input
            id="login-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={errors.email ? inputError : inputNormal}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-xs text-status-danger font-sans">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-cafe-grounds mb-1.5 font-sans">Password</label>
          <input
            id="login-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={errors.password ? inputError : inputNormal}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {errors.password && <p className="mt-1 text-xs text-status-danger font-sans">{errors.password}</p>}
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In
        </Button>
      </form>
      <p className="mt-6 text-center text-sm font-sans text-cafe-grounds/70">
        Employees should use credentials provided by an admin.
      </p>
      <p className="mt-2 text-center text-sm font-sans text-cafe-grounds/70">
        Need an account?{' '}
        <Link to="/auth/signup" className="text-cafe-roast hover:text-cafe-espresso underline font-medium">
          Create one
        </Link>
      </p>
    </div>
  );
}
