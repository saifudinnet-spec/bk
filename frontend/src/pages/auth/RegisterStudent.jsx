import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const RegisterStudent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    const target = redirect
      ? `/login?tab=student&redirect=${encodeURIComponent(redirect)}`
      : '/login?tab=student';
    navigate(target, { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      <p className="text-sm font-semibold text-slate-700">
        Mengalihkan ke Halaman Masuk Mahasiswa...
      </p>
      <p className="text-xs text-slate-400">
        Mahasiswa cukup masuk menggunakan NIM & Sandi Portal Akademik.
      </p>
    </div>
  );
};

export default RegisterStudent;
