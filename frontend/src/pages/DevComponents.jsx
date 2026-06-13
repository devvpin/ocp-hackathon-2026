import React, { useState } from 'react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Toggle from '../components/Toggle';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import ColorPicker from '../components/ColorPicker';
import QRCode from '../components/QRCode';
import Skeleton from '../components/Skeleton';

const DevComponents = () => {
  const { addToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toggleState, setToggleState] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [searchResult, setSearchResult] = useState('');

  const tableColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'role', label: 'Role', sortable: false },
  ];
  
  const tableData = [
    { id: 1, name: 'Alice', role: 'Admin' },
    { id: 2, name: 'Bob', role: 'Cashier' },
    { id: 3, name: 'Charlie', role: 'User' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold mb-8">Component Library Dev View</h1>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary" size="sm">Primary SM</Button>
          <Button variant="secondary" size="md">Secondary MD</Button>
          <Button variant="danger" size="lg">Danger LG</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading...</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Modals & Dialogs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Modals & Dialogs</h2>
        <div className="flex gap-4">
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setIsConfirmOpen(true)} variant="danger">Open Confirm Dialog</Button>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Sample Modal">
          <p className="text-gray-600 mb-4">This is a standard modal. Press Escape or click the backdrop to close.</p>
          <div className="flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </div>
        </Modal>

        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            addToast({ type: 'success', message: 'Action confirmed!' });
            setIsConfirmOpen(false);
          }}
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          isDanger={true}
          confirmText="Delete"
        />
      </section>

      {/* Badges & Toggles */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Badges & Toggles</h2>
        <div className="flex items-center gap-6">
          <div className="space-x-2">
            <Badge>Default</Badge>
            <Badge colorHex="#ef4444">Custom Red</Badge>
            <Badge colorHex="#10b981">Custom Green</Badge>
          </div>
          <div className="flex items-center gap-3 border-l pl-6">
            <span className="text-sm font-medium">Toggle Status: {toggleState ? 'ON' : 'OFF'}</span>
            <Toggle enabled={toggleState} onChange={setToggleState} />
          </div>
        </div>
      </section>

      {/* Toasts */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Toasts</h2>
        <div className="flex gap-4">
          <Button onClick={() => addToast({ type: 'success', message: 'Operation successful!' })} variant="primary">Success Toast</Button>
          <Button onClick={() => addToast({ type: 'error', message: 'Something went wrong.' })} variant="danger">Error Toast</Button>
          <Button onClick={() => addToast({ type: 'info', message: 'Here is some information.' })} variant="secondary">Info Toast</Button>
        </div>
      </section>

      {/* Inputs (Search & ColorPicker) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Inputs</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Search Bar (debounced 300ms)</p>
            <SearchBar onSearch={(val) => setSearchResult(val)} placeholder="Search something..." />
            <p className="text-sm text-gray-500">Searched for: {searchResult}</p>
          </div>
          <div>
            <ColorPicker value={color} onChange={setColor} label="Category Color" />
          </div>
        </div>
      </section>

      {/* QRCode & Skeleton */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Misc (QR & Skeleton)</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 mb-2">QR Code</p>
            <QRCode value="upi://pay?pa=cafe@ybl&am=150" />
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-2">Skeletons</p>
            <div className="flex items-center gap-4">
              <Skeleton type="circle" className="w-12 h-12" />
              <div className="space-y-2 flex-1">
                <Skeleton type="text" className="h-4 w-3/4" />
                <Skeleton type="text" className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton type="rect" className="h-24 w-full mt-4" />
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Table</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">With Data (Sortable)</h3>
            <Table columns={tableColumns} data={tableData} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Loading State</h3>
            <Table columns={tableColumns} data={[]} loading={true} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Empty State</h3>
            <Table columns={tableColumns} data={[]} />
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default DevComponents;
