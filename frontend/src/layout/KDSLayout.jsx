import { Outlet } from 'react-router-dom';

export default function KDSLayout() {
  return (
    <div className="min-h-screen bg-cafe-foam flex flex-col">
      <Outlet />
    </div>
  );
}
