import { Outlet } from 'react-router-dom';
export default function KDSLayout() {
  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      <Outlet />
    </div>
  );
}
