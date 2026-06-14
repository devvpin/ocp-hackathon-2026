import { useState, useEffect } from 'react';
import promotionsApi from '../../api/promotions';
import productsApi from '../../api/products';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatCurrency } from '../../utils/formatters';
export default function PromotionsPage() {
  const { success, error: showError } = useToast();
  const [tab, setTab] = useState('coupons');
  const [coupons, setCoupons] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percentage', discountValue: '' });
  const [promoForm, setPromoForm] = useState({ appliedTo: 'product', productId: '', minimumQuantity: '', minimumOrderAmount: '', discountType: 'percentage', discountValue: '' });
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, prodRes] = await Promise.all([
        promotionsApi.getCoupons(),
        promotionsApi.getPromotions(),
        productsApi.getAll(),
      ]);
      setCoupons(cRes.data);
      setPromotions(pRes.data);
      setProducts(prodRes.data);
    } catch { showError('Failed to load data'); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  // Coupon handlers
  const openCreateCoupon = () => {
    setEditing(null);
    setCouponForm({ code: '', discountType: 'percentage', discountValue: '' });
    setModalOpen(true);
  };
  const openEditCoupon = (coupon) => {
    setEditing(coupon);
    setCouponForm({ code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue });
    setModalOpen(true);
  };
  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim() || !couponForm.discountValue) { showError('Code and value are required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await promotionsApi.updateCoupon(editing.id, { ...couponForm, discountValue: Number(couponForm.discountValue) });
        success('Coupon updated');
      } else {
        await promotionsApi.createCoupon({ ...couponForm, discountValue: Number(couponForm.discountValue) });
        success('Coupon created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { showError(err?.response?.data?.message || 'Failed to save coupon'); }
    setSaving(false);
  };
  // Promotion handlers
  const openCreatePromo = () => {
    setEditing(null);
    setPromoForm({ appliedTo: 'product', productId: '', minimumQuantity: '', minimumOrderAmount: '', discountType: 'percentage', discountValue: '' });
    setModalOpen(true);
  };
  const openEditPromo = (promo) => {
    setEditing(promo);
    setPromoForm({
      appliedTo: promo.appliedTo,
      productId: promo.productId || '',
      minimumQuantity: promo.minimumQuantity || '',
      minimumOrderAmount: promo.minimumOrderAmount || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
    });
    setModalOpen(true);
  };
  const handleSavePromo = async () => {
    if (!promoForm.discountValue) { showError('Discount value is required'); return; }
    setSaving(true);
    const data = {
      ...promoForm,
      discountValue: Number(promoForm.discountValue),
      minimumQuantity: promoForm.minimumQuantity ? Number(promoForm.minimumQuantity) : undefined,
      minimumOrderAmount: promoForm.minimumOrderAmount ? Number(promoForm.minimumOrderAmount) : undefined,
      productName: products.find((p) => p.id === promoForm.productId)?.name,
    };
    try {
      if (editing) {
        await promotionsApi.updatePromotion(editing.id, data);
        success('Promotion updated');
      } else {
        await promotionsApi.createPromotion(data);
        success('Promotion created');
      }
      setModalOpen(false);
      fetchData();
    } catch { showError('Failed to save promotion'); }
    setSaving(false);
  };
  const handleDelete = async () => {
    try {
      if (deleteTarget.type === 'coupon') {
        await promotionsApi.deleteCoupon(deleteTarget.id);
        success('Coupon deleted');
      } else {
        await promotionsApi.deletePromotion(deleteTarget.id);
        success('Promotion deleted');
      }
      setDeleteTarget(null);
      fetchData();
    } catch { showError('Failed to delete'); }
  };
  const couponColumns = [
    { key: 'code', label: 'Code', sortable: true, render: (v) => <span className="font-mono font-bold text-primary-600">{v}</span> },
    { key: 'discountType', label: 'Type', render: (v) => v === 'percentage' ? 'Percentage' : 'Fixed Amount' },
    { key: 'discountValue', label: 'Value', render: (v, row) => row.discountType === 'percentage' ? `${v}%` : formatCurrency(v) },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => openEditCoupon(row)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
          <button onClick={() => setDeleteTarget({ id: row.id, type: 'coupon' })} className="text-danger-600 hover:text-danger-800 text-sm font-medium">Delete</button>
        </div>
      ),
    },
  ];
  const promoColumns = [
    { key: 'appliedTo', label: 'Applied To', render: (v) => v === 'product' ? 'Product' : 'Order' },
    { key: 'product', label: 'Product', render: (_, row) => row.appliedTo === 'product' ? (row.product?.name || '—') : '—' },
    { key: 'minQuantity', label: 'Min Qty', render: (_, row) => row.appliedTo === 'product' ? (row.minQuantity || '—') : '—' },
    { key: 'minOrderAmount', label: 'Min Order', render: (_, row) => row.appliedTo === 'order' ? formatCurrency(row.minOrderAmount) : '—' },
    { key: 'discountType', label: 'Type', render: (v) => v === 'percentage' ? 'Percentage' : 'Fixed' },
    { key: 'discountValue', label: 'Value', render: (v, row) => row.discountType === 'percentage' ? `${v}%` : formatCurrency(v) },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => openEditPromo(row)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
          <button onClick={() => setDeleteTarget({ id: row.id, type: 'promo' })} className="text-danger-600 hover:text-danger-800 text-sm font-medium">Delete</button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cafe-espresso">Coupons & Promotions</h1>
          <p className="text-sm text-surface-500 mt-1">Manage discount codes and automated promotions</p>
        </div>
        <Button onClick={tab === 'coupons' ? openCreateCoupon : openCreatePromo}>+ Create</Button>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('coupons')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'coupons' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}>
          Coupon Codes
        </button>
        <button onClick={() => setTab('promotions')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'promotions' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}>
          Automated Promotions
        </button>
      </div>
      {tab === 'coupons' ? (
        <Table columns={couponColumns} data={coupons} loading={loading} emptyMessage="No coupons created yet" emptyAction={{ label: '+ Create Coupon', onClick: openCreateCoupon }} />
      ) : (
        <Table columns={promoColumns} data={promotions} loading={loading} emptyMessage="No promotions created yet" emptyAction={{ label: '+ Create Promotion', onClick: openCreatePromo }} />
      )}
      {/* Coupon Modal */}
      {tab === 'coupons' && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Create Coupon'} size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Code *</label>
              <input type="text" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="WELCOME10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Discount Type</label>
              <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Value *</label>
              <input type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder={couponForm.discountType === 'percentage' ? '10' : '5.00'} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCoupon} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </Modal>
      )}
      {/* Promotion Modal */}
      {tab === 'promotions' && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Promotion' : 'Create Promotion'} size="md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Applied To</label>
              <select value={promoForm.appliedTo} onChange={(e) => setPromoForm({ ...promoForm, appliedTo: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="product">Product</option>
                <option value="order">Order</option>
              </select>
            </div>
            {promoForm.appliedTo === 'product' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Product</label>
                  <select value={promoForm.productId} onChange={(e) => setPromoForm({ ...promoForm, productId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Minimum Quantity</label>
                  <input type="number" value={promoForm.minimumQuantity} onChange={(e) => setPromoForm({ ...promoForm, minimumQuantity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="2" />
                </div>
              </>
            )}
            {promoForm.appliedTo === 'order' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Minimum Order Amount</label>
                <input type="number" step="0.01" value={promoForm.minimumOrderAmount} onChange={(e) => setPromoForm({ ...promoForm, minimumOrderAmount: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="50.00" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Discount Type</label>
                <select value={promoForm.discountType} onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Value *</label>
                <input type="number" value={promoForm.discountValue} onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="10" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePromo} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </Modal>
      )}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete" message="Are you sure you want to delete this item?" confirmText="Delete" />
    </div>
  );
}