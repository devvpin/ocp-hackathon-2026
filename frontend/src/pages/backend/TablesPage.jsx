import { useState, useEffect } from 'react';
import tablesApi from '../../api/tables';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Toggle from '../../components/Toggle';
import ConfirmDialog from '../../components/ConfirmDialog';
export default function TablesPage() {
  const { success, error: showError } = useToast();
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFloor, setActiveFloor] = useState(null);
  const [floorModal, setFloorModal] = useState(false);
  const [tableModal, setTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [deleteTableId, setDeleteTableId] = useState(null);
  const [floorName, setFloorName] = useState('');
  const [tableForm, setTableForm] = useState({ number: '', seats: '', active: true });
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, tRes] = await Promise.all([tablesApi.getFloors(), tablesApi.getAllTables()]);
      setFloors(fRes.data);
      setTables(tRes.data);
      if (!activeFloor && fRes.data.length) setActiveFloor(fRes.data[0].id);
    } catch { showError('Failed to load data'); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const floorTables = tables.filter((t) => t.floorId === activeFloor);
  const handleCreateFloor = async () => {
    if (!floorName.trim()) return;
    try {
      const res = await tablesApi.createFloor({ name: floorName });
      setFloors((prev) => [...prev, res.data]);
      setActiveFloor(res.data.id);
      setFloorName('');
      setFloorModal(false);
      success('Floor created');
    } catch { showError('Failed to create floor'); }
  };
  const openCreateTable = () => {
    setEditingTable(null);
    setTableForm({ number: '', seats: '', active: true });
    setTableModal(true);
  };
  const openEditTable = (table) => {
    setEditingTable(table);
    setTableForm({ number: table.number, seats: table.seats, active: table.active });
    setTableModal(true);
  };
  const handleSaveTable = async () => {
    if (!tableForm.number || !tableForm.seats) { showError('Table number and seats are required'); return; }
    try {
      if (editingTable) {
        await tablesApi.updateTable(editingTable.id, { ...tableForm, number: Number(tableForm.number), seats: Number(tableForm.seats) });
        success('Table updated');
      } else {
        await tablesApi.createTable({ ...tableForm, floorId: activeFloor, number: Number(tableForm.number), seats: Number(tableForm.seats) });
        success('Table created');
      }
      setTableModal(false);
      fetchData();
    } catch { showError('Failed to save table'); }
  };
  const handleDeleteTable = async () => {
    try {
      await tablesApi.deleteTable(deleteTableId);
      success('Table deleted');
      setDeleteTableId(null);
      fetchData();
    } catch { showError('Failed to delete table'); }
  };
  const [deleteFloorId, setDeleteFloorId] = useState(null);
  const handleDeleteFloor = async () => {
    try {
      await tablesApi.deleteFloor(deleteFloorId);
      success('Floor deleted');
      setFloors(floors.filter(f => f.id !== deleteFloorId));
      if (activeFloor === deleteFloorId) {
        const remaining = floors.filter(f => f.id !== deleteFloorId);
        setActiveFloor(remaining.length > 0 ? remaining[0].id : null);
      }
      setDeleteFloorId(null);
    } catch { showError('Failed to delete floor'); }
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Floor & Tables</h1>
          <p className="text-sm text-surface-500 mt-1">Manage restaurant floors and table layout</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setFloorModal(true)}>+ Add Floor</Button>
          {activeFloor && <Button onClick={openCreateTable}>+ Add Table</Button>}
        </div>
      </div>
      {/* Floor Tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {floors.map((floor) => (
          <div key={floor.id} className="relative group flex items-center">
            <button
              onClick={() => setActiveFloor(floor.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeFloor === floor.id ? 'bg-primary-600 text-white shadow-md pr-9' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50 pr-9'}`}
            >
              {floor.name}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteFloorId(floor.id); }}
              className="absolute right-2 text-surface-400 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete floor"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {/* Table Grid */}
      {activeFloor && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {floorTables.map((table) => (
            <div
              key={table.id}
              className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${
                table.status === 'occupied' ? 'border-warning-400 bg-warning-50' : 'border-surface-200 bg-white'
              } ${!table.active ? 'opacity-50' : ''}`}
              onClick={() => openEditTable(table)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTableId(table.id); }}
                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-surface-200 text-surface-400 hover:text-danger-500 transition-colors"
                aria-label="Delete table"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-center">
                <div className="text-2xl font-bold text-surface-900 mb-1">{table.number}</div>
                <div className="flex items-center justify-center gap-1 text-xs text-surface-500">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {table.seats} seats
                </div>
                {table.status === 'occupied' && (
                  <span className="mt-2 inline-block px-2 py-0.5 bg-warning-500 text-white text-xs rounded-full font-medium">Occupied</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {activeFloor && floorTables.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center">
          <p className="text-surface-500 mb-4">No tables on this floor yet</p>
          <Button onClick={openCreateTable}>+ Add Table</Button>
        </div>
      )}
      {/* Floor Modal */}
      <Modal isOpen={floorModal} onClose={() => setFloorModal(false)} title="Create Floor" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Floor Name *</label>
            <input type="text" value={floorName} onChange={(e) => setFloorName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Ground Floor" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setFloorModal(false)}>Cancel</Button>
            <Button onClick={handleCreateFloor}>Create</Button>
          </div>
        </div>
      </Modal>
      {/* Table Modal */}
      <Modal isOpen={tableModal} onClose={() => setTableModal(false)} title={editingTable ? 'Edit Table' : 'Add Table'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Table Number *</label>
            <input type="number" value={tableForm.number} onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Number of Seats *</label>
            <input type="number" value={tableForm.seats} onChange={(e) => setTableForm({ ...tableForm, seats: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="4" />
          </div>
          <Toggle checked={tableForm.active} onChange={(v) => setTableForm({ ...tableForm, active: v })} label="Active" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setTableModal(false)}>Cancel</Button>
            <Button onClick={handleSaveTable}>{editingTable ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteTableId} onClose={() => setDeleteTableId(null)} onConfirm={handleDeleteTable} title="Delete Table" message="Remove this table from the floor plan?" confirmText="Delete" />
      <ConfirmDialog isOpen={!!deleteFloorId} onClose={() => setDeleteFloorId(null)} onConfirm={handleDeleteFloor} title="Delete Floor" message="Are you sure you want to delete this floor and all its tables? This action cannot be undone." confirmText="Delete" />
    </div>
  );
}