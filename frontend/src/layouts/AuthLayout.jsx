import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const AuthLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Brand Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2 pb-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200/80 p-0.5 shadow-soft-xs flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
            <img src="/logobk.png" alt="Logo Ruang BK" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#164C53] tracking-wider uppercase leading-none">RUANG BK</h1>
            <span className="text-[11px] text-mutedtext mt-0.5 block">Bimbingan Konseling</span>
          </div>
        </Link>
      </div>

      {/* Form Container */}
      <div className="max-w-md w-full mx-auto my-auto py-4">
        <Outlet />
      </div>

      {/* Footer Disclaimer */}
      <div className="max-w-md w-full mx-auto text-center py-4">
        <div className="flex items-center justify-center gap-1.5 text-xs text-mutedtext">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Layanan Terproteksi & Terenkripsi</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
