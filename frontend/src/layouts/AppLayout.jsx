import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DesktopSidebar from '../components/common/DesktopSidebar';
import BottomNav from '../components/common/BottomNav';

export const AppLayout = () => {
  const location = useLocation();
  const isSessionRoom = location.pathname.includes('/counseling/session') && !location.pathname.includes('/summary');

  return (
    <div className={`min-h-screen flex bg-[#F6F8FA] text-darktext selection:bg-emerald-100 selection:text-emerald-900 ${isSessionRoom ? 'h-screen overflow-hidden' : ''}`}>
      {/* Desktop Navigation Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isSessionRoom ? 'h-screen overflow-hidden' : 'pb-28 md:pb-6'}`}>
        <main className={`flex-1 w-full mx-auto ${isSessionRoom ? 'h-full max-w-none p-2 sm:p-3 flex flex-col overflow-hidden' : 'max-w-7xl px-3 sm:px-5 lg:px-6 py-4 sm:py-6'}`}>
          <Outlet />
        </main>

        {/* Mobile Sticky Bottom Navigation */}
        {!isSessionRoom && <BottomNav />}
      </div>
    </div>
  );
};

export default AppLayout;
