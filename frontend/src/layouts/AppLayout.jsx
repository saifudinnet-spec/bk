import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DesktopSidebar from '../components/common/DesktopSidebar';
import BottomNav from '../components/common/BottomNav';

export const AppLayout = () => {
  const location = useLocation();
  const isSessionRoom = location.pathname.includes('/counseling/session');

  return (
    <div className={`${isSessionRoom ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'} flex bg-[#F6F8FA] text-darktext selection:bg-emerald-100 selection:text-emerald-900`}>
      {/* Desktop Navigation Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isSessionRoom ? 'h-screen max-h-screen overflow-hidden pb-0' : 'pb-20 md:pb-6'}`}>
        <main className={`flex-1 w-full mx-auto ${isSessionRoom ? 'h-full max-h-full overflow-hidden flex flex-col p-1.5 sm:p-2.5 lg:p-3 max-w-5xl' : 'max-w-7xl px-3 sm:px-5 lg:px-6 py-4 sm:py-6'}`}>
          <Outlet />
        </main>

        {/* Mobile Sticky Bottom Navigation */}
        {!isSessionRoom && <BottomNav />}
      </div>
    </div>
  );
};

export default AppLayout;
