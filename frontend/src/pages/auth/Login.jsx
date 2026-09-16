import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, KeyRound, GraduationCap } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import PageTransition from '../../components/common/PageTransition';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'staff' ? 'staff' : 'student';
  const [loginRole, setLoginRole] = useState(initialTab);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const { hasActiveBooking, selectedTopic, selectedCounselor } = useCounselingFlow();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showError(
        loginRole === 'student'
          ? 'Silakan masukkan NIM dan kata sandi Portal Kampus Anda.'
          : 'Silakan masukkan Email / No. HP dan kata sandi Anda.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(
        identifier.trim(),
        password,
        loginRole === 'student' ? 'student' : null
      );
      showSuccess(`Selamat datang kembali, ${user.name}!`);

      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');

      // Role-based redirect
      if (user.role === 'TUTOR') {
        navigate('/tutor/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (redirectUrl) {
        navigate(redirectUrl);
      } else if (hasActiveBooking) {
        navigate('/app/counseling/wizard');
      } else {
        navigate('/app');
      }
    } catch (err) {
      showError(err.message || 'Login gagal. Periksa kembali kredensial Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (id, pass, roleType = 'staff') => {
    setLoginRole(roleType);
    setIdentifier(id);
    setPassword(pass);
  };

  return (
    <PageTransition>
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-softborder shadow-soft-lg">
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

        {/* Tab Role Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-gray-100/80 border border-gray-200/60 mb-6">
          <button
            type="button"
            onClick={() => {
              setLoginRole('student');
              setIdentifier('');
              setPassword('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              loginRole === 'student'
                ? 'bg-white text-emerald-900 shadow-soft-xs border border-emerald-150'
                : 'text-mutedtext hover:text-darktext'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${loginRole === 'student' ? 'text-emerald-700' : 'text-mutedtext'}`} />
            <span>Mahasiswa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginRole('staff');
              setIdentifier('');
              setPassword('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              loginRole === 'staff'
                ? 'bg-white text-darktext shadow-soft-xs border border-gray-200'
                : 'text-mutedtext hover:text-darktext'
            }`}
          >
            <User className={`w-4 h-4 ${loginRole === 'staff' ? 'text-emerald-700' : 'text-mutedtext'}`} />
            <span>Konselor / Umum / Staf</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-darktext mb-1.5">
              {loginRole === 'student' ? 'NIM (Nomor Induk Mahasiswa)' : 'Email / No. HP'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  loginRole === 'student'
                    ? 'Contoh: 2382130062'
                    : 'Contoh: nama@email.com atau 0812...'
                }
                className="w-full h-12 px-4 pl-10 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
              />
              {loginRole === 'student' ? (
                <GraduationCap className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2" />
              ) : (
                <User className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-darktext mb-1.5">
              {loginRole === 'student' ? 'Kata Sandi Portal Kampus' : 'Kata Sandi'}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  loginRole === 'student'
                    ? 'Masukkan kata sandi akun Portal Akademik'
                    : 'Masukkan kata sandi akun'
                }
                className="w-full h-12 px-4 pl-10 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <Lock className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            <span>
              {isSubmitting
                ? 'Menghubungkan ke Portal...'
                : loginRole === 'student'
                ? 'Masuk dengan Akun Portal'
                : 'Masuk Sekarang'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        {/* Demo Fast Logins */}
        <div className="mt-8 pt-6 border-t border-softborder">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-mutedtext mb-3">
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>Akun Demo Cepat (Siap Uji Coba Langsung):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Akun Real Portal UINSSC */}
            <button
              type="button"
              onClick={() => handleQuickLogin('2382130062', 'Abi342004', 'student')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-left transition-colors min-h-[48px]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-emerald-950">Portal Mhs (Real API UINSSC)</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">API Live</span>
              </div>
              <p className="text-[10px] text-emerald-800 font-mono">2382130062 (MARIJKY ABI M.)</p>
            </button>

            {/* Akun Demo Mahasiswa Lokal */}
            <button
              type="button"
              onClick={() => handleQuickLogin('student@example.test', 'password', 'student')}
              className="p-2.5 rounded-xl border border-teal-100 bg-teal-50/50 hover:bg-teal-100/60 text-left transition-colors min-h-[48px]"
            >
              <p className="text-[11px] font-bold text-teal-900">Mahasiswa (Demo Lokal)</p>
              <p className="text-[10px] text-teal-700 font-mono">student@example.test</p>
            </button>

            {/* Tutor BK */}
            <button
              type="button"
              onClick={() => handleQuickLogin('tutor@example.test', 'password', 'staff')}
              className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-left transition-colors min-h-[48px]"
            >
              <p className="text-[11px] font-bold text-darktext">Konselor / Tutor BK</p>
              <p className="text-[10px] text-mutedtext font-mono">tutor@example.test</p>
            </button>

            {/* Admin Sistem */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@example.test', 'password', 'staff')}
              className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/60 text-left transition-colors min-h-[48px]"
            >
              <p className="text-[11px] font-bold text-purple-900">Admin Sistem</p>
              <p className="text-[10px] text-purple-700 font-mono">admin@example.test</p>
            </button>
          </div>
        </div>

        {/* Signup CTA */}
        <div className="mt-6 text-center">
          <p className="text-xs text-mutedtext">
            Belum memiliki akun umum?{' '}
            <Link to="/" className="font-bold text-emerald-700 hover:underline">
              Lihat Informasi & Layanan
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
