import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, ArrowRight, ArrowLeft, ShieldCheck, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import PageTransition from '../../components/common/PageTransition';

export const RegisterStudent = () => {
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const { hasActiveBooking, selectedTopic, selectedCounselor } = useCounselingFlow();
  const navigate = useNavigate();

  const handleLoginPortal = async (e) => {
    e.preventDefault();
    if (!nim.trim() || !password) {
      showError('Silakan masukkan NIM dan kata sandi Portal Akademik Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(nim.trim(), password, 'student');
      showSuccess(`Autentikasi berhasil! Selamat datang, ${user.name || 'Mahasiswa'}.`);

      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');

      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (hasActiveBooking) {
        navigate('/app/counseling/wizard');
      } else {
        navigate('/app');
      }
    } catch (err) {
      showError(err.message || 'Autentikasi gagal. Periksa kembali NIM dan kata sandi Portal Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-soft-lg max-w-lg mx-auto">
        {hasActiveBooking && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
              Satu Langkah Lagi
            </span>
            <h3 className="text-sm font-black text-emerald-950">
              Masuk untuk Melanjutkan Konsultasi Anda
            </h3>
            <p className="text-xs text-emerald-800">
              Topik: <span className="font-bold">{selectedTopic?.title}</span> bersama{' '}
              <span className="font-bold">{selectedCounselor?.name}</span>
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Portal Mahasiswa
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              Masuk / Pendaftaran Mahasiswa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Login menggunakan akun Portal Akademik resmi kampus
            </p>
          </div>
        </div>

        {/* Portal Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 mb-5 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-950 leading-relaxed font-medium">
            Akun mahasiswa terintegrasi langsung dengan <strong>Portal Akademik Kampus</strong>. Masukkan NIM dan Password Portal Anda untuk verifikasi dan sinkronisasi otomatis ke database Ruang BK.
          </p>
        </div>

        {/* Form Login / Pendaftaran dengan NIM & Password Portal */}
        <form onSubmit={handleLoginPortal} className="space-y-4">
          {/* Input NIM */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Nomor Induk Mahasiswa (NIM)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Contoh: 202401001"
                className="w-full h-12 px-4 pl-10 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Input Password Portal */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Kata Sandi / Password Portal Akademik
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi portal kampus"
                className="w-full h-12 px-4 pl-10 pr-11 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Gunakan kata sandi yang sama persis dengan yang Anda gunakan di portal akademik kampus.
            </p>
          </div>

          {/* Demo Hint */}
          <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
            💡 <strong>Akun Uji Coba Demo:</strong> Gunakan NIM <span className="font-mono text-emerald-800 font-bold">202401001</span> dan password <span className="font-mono text-emerald-800 font-bold">password123</span> (atau kredensial portal aktif).
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-[#047857] to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[48px] ring-2 ring-emerald-600/20"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi Portal Kampus...</span>
              </span>
            ) : (
              <>
                <span>Masuk dengan Akun Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <Link
            to="/register/general"
            className="text-emerald-800 hover:text-emerald-950 font-bold hover:underline"
          >
            Bukan Mahasiswa? Daftar Masyarakat Umum
          </Link>

          <Link
            to="/login"
            className="text-slate-600 hover:text-slate-900 font-medium hover:underline"
          >
            Masuk Staf / Konselor
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};

export default RegisterStudent;
