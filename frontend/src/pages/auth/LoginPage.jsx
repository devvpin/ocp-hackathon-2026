import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';
export default function LoginPage() {
  const { login } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
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
      navigate('/pos');
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
      <h2 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h2>
      <p className="text-sm text-surface-500 mb-6">Sign in to your account to continue</p>
      {errors.general && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-600">
          {errors.general}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
          <input
            id="login-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.email ? 'border-danger-500 bg-danger-50' : 'border-surface-200 bg-surface-50'} text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-xs text-danger-500">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
          <input
            id="login-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.password ? 'border-danger-500 bg-danger-50' : 'border-surface-200 bg-surface-50'} text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {errors.password && <p className="mt-1 text-xs text-danger-500">{errors.password}</p>}
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-surface-500">
        Employees should use credentials provided by an admin.
      </p>
    </div>
  );
}
