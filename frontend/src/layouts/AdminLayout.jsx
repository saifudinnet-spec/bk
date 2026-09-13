import React from 'react';
import { Outlet } from 'react-router-dom';
import DesktopSidebar from '../components/common/DesktopSidebar';
import AppHeader from '../components/common/AppHeader';

export const AdminLayout = () => {
  return (
    <div className="min-h-screen flex bg-[#F6F8FA] text-darktext">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <AppHeader showGreeting={false} title="Panel Administrasi BK" subtitle="Operasional & Tata Kelola Sistem" />

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
