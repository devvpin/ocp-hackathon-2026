import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import reportsApi from '../../api/reports';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/Skeleton';

export default function DashboardPage() {
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    reservations: 0,
    activeTables: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await reportsApi.getSummary({ period: 'today' });
        setStats({
          revenue: res.data?.revenue || 0,
          orders: res.data?.totalOrders || 0,
          reservations: 0,
          activeTables: 0,
        });
      } catch (err) {
        showError('Failed to load dashboard statistics');
      }
      setLoading(false);
    };

    fetchDashboardStats();
  }, [showError]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton height={120} className="rounded-cafe" />
          <Skeleton height={120} className="rounded-cafe" />
          <Skeleton height={120} className="rounded-cafe" />
          <Skeleton height={120} className="rounded-cafe" />
        </div>
        <Skeleton height={400} className="rounded-cafe" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-semibold text-cafe-espresso">Dashboard</h1>
        <p className="text-sm text-surface-500 mt-1">Overview of your cafe's daily performance</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-cafe shadow-cafe border border-cafe-crema/50">
          <h3 className="text-sm font-medium text-surface-500 mb-2">Today's Revenue</h3>
          <p className="text-3xl font-display font-bold text-cafe-espresso">{formatCurrency(stats.revenue)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-cafe shadow-cafe border border-cafe-crema/50">
          <h3 className="text-sm font-medium text-surface-500 mb-2">Orders Today</h3>
          <p className="text-3xl font-display font-bold text-cafe-espresso">{stats.orders}</p>
        </div>

        <div className="bg-white p-6 rounded-cafe shadow-cafe border border-cafe-crema/50">
          <h3 className="text-sm font-medium text-surface-500 mb-2">Active Tables</h3>
          <p className="text-3xl font-display font-bold text-cafe-espresso">{stats.activeTables}</p>
          <p className="text-xs text-surface-400 mt-1">Currently occupied</p>
        </div>

        <div className="bg-white p-6 rounded-cafe shadow-cafe border border-cafe-crema/50">
          <h3 className="text-sm font-medium text-surface-500 mb-2">Reservations</h3>
          <p className="text-3xl font-display font-bold text-cafe-espresso">{stats.reservations}</p>
          <p className="text-xs text-surface-400 mt-1">Scheduled for today</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-cafe shadow-cafe border border-cafe-crema/50 p-6 min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-cafe-grounds mb-2">Sales Overview</h3>
            <p className="text-surface-400 text-sm">More detailed charts will appear here as data accumulates.</p>
          </div>
        </div>
        
        <div className="bg-white rounded-cafe shadow-cafe border border-cafe-crema/50 p-6">
          <h3 className="font-medium text-cafe-espresso mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-xl bg-surface-50 hover:bg-cafe-foam/20 transition-colors border border-surface-100 flex items-center justify-between group">
              <span className="text-sm font-medium text-cafe-grounds group-hover:text-primary-600">Open POS Session</span>
              <span className="text-surface-400 group-hover:text-primary-600">→</span>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-surface-50 hover:bg-cafe-foam/20 transition-colors border border-surface-100 flex items-center justify-between group">
              <span className="text-sm font-medium text-cafe-grounds group-hover:text-primary-600">Manage Reservations</span>
              <span className="text-surface-400 group-hover:text-primary-600">→</span>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-surface-50 hover:bg-cafe-foam/20 transition-colors border border-surface-100 flex items-center justify-between group">
              <span className="text-sm font-medium text-cafe-grounds group-hover:text-primary-600">View Active Orders</span>
              <span className="text-surface-400 group-hover:text-primary-600">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
