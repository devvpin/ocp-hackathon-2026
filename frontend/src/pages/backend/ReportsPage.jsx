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
        <h1 className="font-display text-2xl font-semibold text-cafe-espresso">Reports</h1>
        <div className="grid grid-cols-3 gap-4"><Skeleton height={100} count={3} /></div>
        <Skeleton height={300} />
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-fade-in" ref={reportRef}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cafe-espresso">Reports & Analytics</h1>
          <p className="text-sm font-sans text-cafe-grounds/70 mt-1">Track your cafe's performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportPDF}>Export PDF</Button>
          <Button variant="secondary" size="sm" onClick={handleExportXLS}>Export XLS</Button>
        </div>
      </div>
      {/* Filter Bar */}
      <div className="sticky top-0 z-10 bg-cafe-foam py-3 -mx-6 px-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { val: 'today', label: 'Today' },
            { val: 'week', label: 'This Week' },
            { val: 'month', label: 'This Month' },
          ].map((p) => (
            <button
              key={p.val}
              onClick={() => setPeriod(p.val)}
              className={`px-4 py-2 rounded-cafe text-sm font-sans font-medium transition-all duration-150 ${period === p.val ? 'bg-cafe-roast text-cafe-foam shadow-cafe' : 'bg-white text-cafe-grounds border border-cafe-crema/30 hover:bg-cafe-foam'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-cafe border border-cafe-crema/30 p-5 shadow-cafe border-t-4 border-t-cafe-roast">
          <p className="text-xs font-sans text-cafe-grounds/70 font-medium mb-1 uppercase tracking-wide">Total Orders</p>
          <p className="text-3xl font-semibold tabular-nums text-cafe-grounds">{data?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-cafe border border-cafe-crema/30 p-5 shadow-cafe border-t-4 border-t-status-success">
          <p className="text-xs font-sans text-cafe-grounds/70 font-medium mb-1 uppercase tracking-wide">Revenue</p>
          <p className="text-3xl font-semibold tabular-nums text-status-success">{formatCurrency(data?.revenue)}</p>
        </div>
        <div className="bg-white rounded-cafe border border-cafe-crema/30 p-5 shadow-cafe border-t-4 border-t-cafe-espresso">
          <p className="text-xs font-sans text-cafe-grounds/70 font-medium mb-1 uppercase tracking-wide">Avg Order Value</p>
          <p className="text-3xl font-semibold tabular-nums text-cafe-espresso">{formatCurrency(data?.averageOrderValue)}</p>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-cafe border border-cafe-crema/30 p-5 shadow-cafe">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold text-cafe-espresso">Sales Trend</h3>
            <div className="flex gap-1 bg-cafe-foam p-0.5 rounded-cafe">
              <button onClick={() => setChartMode('revenue')} className={`px-3 py-1 rounded-cafe text-xs font-sans font-medium ${chartMode === 'revenue' ? 'bg-white shadow-cafe text-cafe-grounds' : 'text-cafe-grounds/60'}`}>Revenue</button>
              <button onClick={() => setChartMode('orders')} className={`px-3 py-1 rounded-cafe text-xs font-sans font-medium ${chartMode === 'orders' ? 'bg-white shadow-cafe text-cafe-grounds' : 'text-cafe-grounds/60'}`}>Orders</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8d3b0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8a6f52' }} />
              <YAxis tick={{ fontSize: 12, fill: '#8a6f52' }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e8d3b0', boxShadow: '0 4px 14px rgba(52, 17, 0, 0.12)', backgroundColor: '#fff7e8' }} />
              <Line type="monotone" dataKey={chartMode} stroke="#7f5e35" strokeWidth={2.5} dot={{ fill: '#7f5e35', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Top Categories Pie */}
        <div className="bg-white rounded-cafe border border-cafe-crema/30 p-5 shadow-cafe">
          <h3 className="text-sm font-display font-semibold text-cafe-espresso mb-4">Top Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data?.topCategories || []} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="revenue" nameKey="name" paddingAngle={3}>
                {(data?.topCategories || []).map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ borderRadius: 10, border: '1px solid #e8d3b0', backgroundColor: '#fff7e8' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(val) => <span className="text-xs text-cafe-grounds font-sans">{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-cafe border border-cafe-crema/30 overflow-hidden shadow-cafe">
          <div className="px-5 py-4 border-b border-cafe-crema/30">
            <h3 className="text-sm font-display font-semibold text-cafe-espresso">Top Products</h3>
          </div>
          <table className="w-full">
            <thead><tr className="bg-cafe-crema/30 text-left"><th className="px-5 py-2.5 text-xs font-display font-semibold text-cafe-grounds uppercase tracking-wide">Name</th><th className="px-5 py-2.5 text-xs font-display font-semibold text-cafe-grounds uppercase tracking-wide">Qty Sold</th><th className="px-5 py-2.5 text-xs font-display font-semibold text-cafe-grounds uppercase tracking-wide">Revenue</th></tr></thead>
            <tbody className="divide-y divide-cafe-crema/30">
              {(data?.topProducts || []).map((p, i) => (
                <tr key={i} className="hover:bg-cafe-foam"><td className="px-5 py-3 text-sm font-sans text-cafe-grounds">{p.name}</td><td className="px-5 py-3 text-sm font-sans text-cafe-grounds tabular-nums">{p.qtySold}</td><td className="px-5 py-3 text-sm font-sans font-medium text-cafe-espresso tabular-nums">{formatCurrency(p.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-cafe border border-cafe-crema/30 overflow-hidden shadow-cafe">
          <div className="px-5 py-4 border-b border-cafe-crema/30">
            <h3 className="text-sm font-display font-semibold text-cafe-espresso">Top Orders</h3>
          </div>
          <table className="w-full">
            <thead><tr className="bg-cafe-crema/30 text-left"><th className="px-5 py-2.5 text-xs font-display font-semibold text-cafe-grounds uppercase tracking-wide">Order #</th><th className="px-5 py-2.5 text-xs font-display font-semibold text-cafe-grounds uppercase tracking-wide">Date</th><th className="px-5 py-2.5 text-xs font-display font-semibold text-cafe-grounds uppercase tracking-wide">Customer</th><th className="px-5 py-2.5 text-xs font-display font-semibold text-cafe-grounds uppercase tracking-wide">Amount</th></tr></thead>
            <tbody className="divide-y divide-cafe-crema/30">
              {(data?.topOrders || []).map((o, i) => (
                <tr key={i} className="hover:bg-cafe-foam"><td className="px-5 py-3 text-sm font-mono text-cafe-roast">#{o.orderNumber}</td><td className="px-5 py-3 text-sm font-sans text-cafe-grounds">{o.date}</td><td className="px-5 py-3 text-sm font-sans text-cafe-grounds">{o.customer}</td><td className="px-5 py-3 text-sm font-sans font-medium text-cafe-espresso tabular-nums">{formatCurrency(o.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
