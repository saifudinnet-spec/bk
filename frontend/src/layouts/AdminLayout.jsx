import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';

export const AdminLayout = () => {
  return (
    <div className="min-h-screen flex bg-[#F6F8FA] text-darktext">
      {/* CMS-style Left Navigation Sidebar */}
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-12 overflow-x-hidden">
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
