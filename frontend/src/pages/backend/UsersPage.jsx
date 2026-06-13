import { useState, useEffect } from 'react';
import usersApi from '../../api/users';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import SearchBar from '../../components/SearchBar';
import ConfirmDialog from '../../components/ConfirmDialog';
export default function UsersPage() {
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [newPassword, setNewPassword] = useState('');
  const fetchData = async () => {
    setLoading(true);
    try { const res = await usersApi.getAll(); setUsers(res.data); }
    catch { showError('Failed to load users'); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) { showError('All fields are required'); return; }
    setSaving(true);
    try {
      await usersApi.create(form);
      success('User created');
      setModalOpen(false);
      fetchData();
    } catch (err) { showError(err?.response?.data?.message || 'Failed to create user'); }
    setSaving(false);
  };
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) { showError('Password must be at least 8 characters'); return; }
    try {
      await usersApi.changePassword(passwordModal, newPassword);
      success('Password changed');
      setPasswordModal(null);
      setNewPassword('');
    } catch { showError('Failed to change password'); }
  };
  const handleArchive = async (user) => {
    try {
      await usersApi.toggleArchive(user.id);
      success(`User ${user.status === 'active' ? 'archived' : 'restored'}`);
      fetchData();
    } catch { showError('Failed to update user'); }
  };
  const handleDelete = async () => {
    try {
      await usersApi.delete(deleteId);
      success('User deleted');
      setDeleteId(null);
      fetchData();
    } catch { showError('Failed to delete user'); }
  };
  const roleColors = { admin: '#8B5CF6', employee: '#3B82F6' };
  const statusColors = { active: '#22C55E', archived: '#94A3B8' };
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', render: (v) => <Badge color={roleColors[v]}>{v === 'admin' ? 'Admin' : 'Employee'}</Badge> },
    { key: 'status', label: 'Status', render: (v) => <Badge color={statusColors[v]}>{v === 'active' ? 'Active' : 'Archived'}</Badge> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={(e) => { e.stopPropagation(); setPasswordModal(row.id); }} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Password</button>
          <button onClick={(e) => { e.stopPropagation(); handleArchive(row); }} className="text-warning-600 hover:text-warning-800 text-sm font-medium">
            {row.status === 'active' ? 'Archive' : 'Restore'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }} className="text-danger-600 hover:text-danger-800 text-sm font-medium">Delete</button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Users & Employees</h1>
          <p className="text-sm text-surface-500 mt-1">Manage team members and access</p>
        </div>
        <Button onClick={() => { setForm({ name: '', email: '', password: '', role: 'employee' }); setModalOpen(true); }}>+ Add User</Button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No users found" />
      {/* Create User Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add User" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="user@cafe.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Password *</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="employee">Employee / Cashier</option>
              <option value="admin">User / Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Create</Button>
          </div>
        </div>
      </Modal>
      {/* Change Password Modal */}
      <Modal isOpen={!!passwordModal} onClose={() => { setPasswordModal(null); setNewPassword(''); }} title="Change Password" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">New Password *</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Min 8 characters" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setPasswordModal(null); setNewPassword(''); }}>Cancel</Button>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete User" message="This action cannot be undone. Continue?" confirmText="Delete" />
    </div>
  );
}