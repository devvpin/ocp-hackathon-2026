import { useState, useEffect } from 'react';
import paymentMethodsApi from '../../api/paymentMethods';
import { useToast } from '../../context/ToastContext';
import Toggle from '../../components/Toggle';
import Button from '../../components/Button';
import QRCode from '../../components/QRCode';
import Skeleton from '../../components/Skeleton';
export default function PaymentMethodsPage() {
  const { success, error: showError } = useToast();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upiId, setUpiId] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    paymentMethodsApi.getAll().then((res) => {
      setMethods(res.data);
      const upi = res.data.find((m) => m.type === 'upi');
      if (upi?.upiId) setUpiId(upi.upiId);
    }).catch(() => showError('Failed to load payment methods'))
    .finally(() => setLoading(false));
  }, []);
  const handleToggle = async (method) => {
    try {
      const res = await paymentMethodsApi.toggle(method.id);
      setMethods((prev) => prev.map((m) => m.id === method.id ? res.data : m));
      success(`${method.name} ${res.data.enabled ? 'enabled' : 'disabled'}`);
    } catch { showError('Failed to update payment method'); }
  };
  const handleSaveUpiId = async () => {
    const upiMethod = methods.find((m) => m.type === 'upi');
    if (!upiMethod) return;
    setSaving(true);
    try {
      await paymentMethodsApi.update(upiMethod.id, { upiId });
      success('UPI ID saved');
    } catch { showError('Failed to save UPI ID'); }
    setSaving(false);
  };
  const icons = {
    cash: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    card: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    upi: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  };
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-surface-900">Payment Methods</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rect" height={200} />)}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Payment Methods</h1>
        <p className="text-sm text-surface-500 mt-1">Configure accepted payment methods</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {methods.map((method) => (
          <div key={method.id} className={`bg-white rounded-2xl border-2 p-6 transition-all ${method.enabled ? 'border-primary-200 shadow-md' : 'border-surface-200 opacity-75'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${method.enabled ? 'bg-primary-50 text-primary-600' : 'bg-surface-100 text-surface-400'}`}>
                {icons[method.type]}
              </div>
              <Toggle checked={method.enabled} onChange={() => handleToggle(method)} label="" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 mb-1">{method.name}</h3>
            <p className="text-sm text-surface-500 mb-4">
              {method.type === 'cash' && 'Accept cash payments with change calculation'}
              {method.type === 'card' && 'Accept card and digital payments'}
              {method.type === 'upi' && 'Accept UPI payments via QR code'}
            </p>
            {method.type === 'upi' && method.enabled && (
              <div className="space-y-3 pt-3 border-t border-surface-200">
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="cafe@ybl"
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button size="sm" onClick={handleSaveUpiId} loading={saving}>Save UPI ID</Button>
                {upiId && (
                  <div className="flex justify-center pt-2">
                    <QRCode value={`upi://pay?pa=${upiId}&pn=OdooCafe`} size={140} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
