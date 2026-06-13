import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';

const inputBase = 'w-full px-4 py-2.5 rounded-cafe border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-cafe-roast focus:border-cafe-roast transition-all duration-150';
const inputNormal = `${inputBase} border-cafe-crema bg-white text-cafe-grounds`;
const inputError = `${inputBase} border-status-danger bg-status-danger/5`;

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
      <h2 className="font-display text-2xl font-semibold text-cafe-espresso mb-1 tracking-wide">Create your account</h2>
      <p className="text-sm font-sans text-cafe-grounds/70 mb-6">Get started with Odoo Cafe POS</p>
      {errors.general && (
        <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/30 rounded-cafe text-sm text-status-danger font-sans">
          {errors.general}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-cafe-grounds mb-1.5 font-sans">Name</label>
          <input
            id="signup-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={errors.name ? inputError : inputNormal}
            placeholder="Your full name"
            autoComplete="name"
          />
          {errors.name && <p className="mt-1 text-xs text-status-danger font-sans">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-cafe-grounds mb-1.5 font-sans">Email</label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="block text-sm font-medium text-cafe-grounds mb-1.5 font-sans">Password</label>
          <input
            id="signup-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={errors.password ? inputError : inputNormal}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
          />
          {errors.password && <p className="mt-1 text-xs text-status-danger font-sans">{errors.password}</p>}
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create Account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm font-sans text-cafe-grounds/70">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-cafe-roast hover:text-cafe-espresso underline font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
}
