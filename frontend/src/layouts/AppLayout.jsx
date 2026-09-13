import React from 'react';
import { Outlet } from 'react-router-dom';
import DesktopSidebar from '../components/common/DesktopSidebar';
import BottomNav from '../components/common/BottomNav';
import AppHeader from '../components/common/AppHeader';

export const AppLayout = ({ showHeader = true, title, subtitle }) => {
  return (
    <div className="min-h-screen flex bg-[#F6F8FA] text-darktext selection:bg-emerald-100 selection:text-emerald-900">
      {/* Desktop Navigation Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area with mobile BottomNav clearance */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-2">
        {showHeader && <AppHeader title={title} subtitle={subtitle} />}

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5">
          <Outlet />
        </main>

        {/* Mobile Sticky Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default AppLayout;
