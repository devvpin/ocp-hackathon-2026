import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';
export default function SignupPage() {
  const { signup } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/pos');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Signup failed';
      showError(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2 className="text-2xl font-bold text-surface-900 mb-1">Create account</h2>
      <p className="text-sm text-surface-500 mb-6">Get started with Odoo Cafe POS</p>
      {errors.general && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-600">
          {errors.general}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-surface-700 mb-1.5">Name</label>
          <input
            id="signup-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.name ? 'border-danger-500 bg-danger-50' : 'border-surface-200 bg-surface-50'} text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
            placeholder="Your full name"
            autoComplete="name"
          />
          {errors.name && <p className="mt-1 text-xs text-danger-500">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
          <input
            id="signup-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={`w-full px-4 py-2.5 rounded-xl border ${errors.password ? 'border-danger-500 bg-danger-50' : 'border-surface-200 bg-surface-50'} text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
          />
          {errors.password && <p className="mt-1 text-xs text-danger-500">{errors.password}</p>}
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create Account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-surface-500">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
          Sign In
        </Link>
      </p>
    </div>
  );
}
