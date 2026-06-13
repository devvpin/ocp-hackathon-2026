import { useState, useEffect, useRef } from 'react';
import reportsApi from '../../api/reports';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import Skeleton from '../../components/Skeleton';
import Button from '../../components/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
export default function ReportsPage() {
  const { error: showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [chartMode, setChartMode] = useState('revenue');
  const reportRef = useRef(null);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getData({ period });
      setData(res.data);
    } catch { showError('Failed to load report data'); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [period]);
  const handleExportPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save('report.pdf');
    } catch { showError('Failed to export PDF'); }
  };
  const handleExportXLS = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      if (data?.topProducts) {
        const ws = XLSX.utils.json_to_sheet(data.topProducts);
        XLSX.utils.book_append_sheet(wb, ws, 'Top Products');
      }
      if (data?.topOrders) {
        const ws2 = XLSX.utils.json_to_sheet(data.topOrders);
        XLSX.utils.book_append_sheet(wb, ws2, 'Top Orders');
      }
      if (data?.salesTrend) {
        const ws3 = XLSX.utils.json_to_sheet(data.salesTrend);
        XLSX.utils.book_append_sheet(wb, ws3, 'Sales Trend');
      }
      XLSX.writeFile(wb, 'report.xlsx');
    } catch { showError('Failed to export XLS'); }
  };
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-surface-900">Reports</h1>
        <div className="grid grid-cols-3 gap-4"><Skeleton height={100} count={3} /></div>
        <Skeleton height={300} />
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-fade-in" ref={reportRef}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Reports & Analytics</h1>
          <p className="text-sm text-surface-500 mt-1">Track your cafe's performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportPDF}>Export PDF</Button>
          <Button variant="secondary" size="sm" onClick={handleExportXLS}>Export XLS</Button>
        </div>
      </div>
      {/* Filter Bar */}
      <div className="sticky top-0 z-10 bg-surface-50 py-3 -mx-6 px-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { val: 'today', label: 'Today' },
            { val: 'week', label: 'This Week' },
            { val: 'month', label: 'This Month' },
          ].map((p) => (
            <button
              key={p.val}
              onClick={() => setPeriod(p.val)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === p.val ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <p className="text-xs text-surface-500 font-medium mb-1">Total Orders</p>
          <p className="text-3xl font-extrabold text-surface-900">{data?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <p className="text-xs text-surface-500 font-medium mb-1">Revenue</p>
          <p className="text-3xl font-extrabold text-success-600">{formatCurrency(data?.revenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <p className="text-xs text-surface-500 font-medium mb-1">Avg Order Value</p>
          <p className="text-3xl font-extrabold text-primary-600">{formatCurrency(data?.averageOrderValue)}</p>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-surface-900">Sales Trend</h3>
            <div className="flex gap-1 bg-surface-100 p-0.5 rounded-lg">
              <button onClick={() => setChartMode('revenue')} className={`px-3 py-1 rounded-md text-xs font-medium ${chartMode === 'revenue' ? 'bg-white shadow text-surface-800' : 'text-surface-500'}`}>Revenue</button>
              <button onClick={() => setChartMode('orders')} className={`px-3 py-1 rounded-md text-xs font-medium ${chartMode === 'orders' ? 'bg-white shadow text-surface-800' : 'text-surface-500'}`}>Orders</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }} />
              <Line type="monotone" dataKey={chartMode} stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Top Categories Pie */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <h3 className="text-sm font-bold text-surface-900 mb-4">Top Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data?.topCategories || []} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="revenue" nameKey="name" paddingAngle={3}>
                {(data?.topCategories || []).map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(val) => <span className="text-xs text-surface-600">{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200">
            <h3 className="text-sm font-bold text-surface-900">Top Products</h3>
          </div>
          <table className="w-full">
            <thead><tr className="bg-surface-50 text-left"><th className="px-5 py-2.5 text-xs font-bold text-surface-500 uppercase">Name</th><th className="px-5 py-2.5 text-xs font-bold text-surface-500 uppercase">Qty Sold</th><th className="px-5 py-2.5 text-xs font-bold text-surface-500 uppercase">Revenue</th></tr></thead>
            <tbody className="divide-y divide-surface-100">
              {(data?.topProducts || []).map((p, i) => (
                <tr key={i} className="hover:bg-surface-50"><td className="px-5 py-3 text-sm text-surface-700">{p.name}</td><td className="px-5 py-3 text-sm text-surface-700">{p.qtySold}</td><td className="px-5 py-3 text-sm font-medium text-surface-800">{formatCurrency(p.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200">
            <h3 className="text-sm font-bold text-surface-900">Top Orders</h3>
          </div>
          <table className="w-full">
            <thead><tr className="bg-surface-50 text-left"><th className="px-5 py-2.5 text-xs font-bold text-surface-500 uppercase">Order #</th><th className="px-5 py-2.5 text-xs font-bold text-surface-500 uppercase">Date</th><th className="px-5 py-2.5 text-xs font-bold text-surface-500 uppercase">Customer</th><th className="px-5 py-2.5 text-xs font-bold text-surface-500 uppercase">Amount</th></tr></thead>
            <tbody className="divide-y divide-surface-100">
              {(data?.topOrders || []).map((o, i) => (
                <tr key={i} className="hover:bg-surface-50"><td className="px-5 py-3 text-sm font-mono text-primary-600">#{o.orderNumber}</td><td className="px-5 py-3 text-sm text-surface-700">{o.date}</td><td className="px-5 py-3 text-sm text-surface-700">{o.customer}</td><td className="px-5 py-3 text-sm font-medium text-surface-800">{formatCurrency(o.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
