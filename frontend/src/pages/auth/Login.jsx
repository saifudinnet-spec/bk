import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, GraduationCap, HeartHandshake, Info } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import PageTransition from '../../components/common/PageTransition';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const { hasActiveBooking, selectedTopic, selectedCounselor } = useCounselingFlow();
  const navigate = useNavigate();

  // Banner hanya muncul jika user diarahkan langsung dari halaman booking
  const showBookingBanner = hasActiveBooking && location.state?.fromBooking === true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      showError('Silakan masukkan NIM atau Email dan kata sandi Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-detect format NIM (8-14 digit angka) untuk integrasi portal
      const isNumericNim = /^[0-9]{8,14}$/.test(cleanId);
      const user = await login(
        cleanId,
        password,
        isNumericNim ? 'student' : null
      );
      showSuccess(`Selamat datang kembali, ${user.name}!`);

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
      showError(err.message || 'Login gagal. Periksa kembali NIM/Email dan kata sandi Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-softborder shadow-soft-lg">
        {showBookingBanner && (
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

        <div className="mb-6">
          <h2 className="text-xl font-black text-darktext tracking-tight">Masuk ke Ruang BK</h2>
          <p className="text-xs text-mutedtext mt-1">
            Gunakan akun Portal Akademik atau Email terdaftar Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-darktext mb-1.5">
              NIM atau Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan NIM Mahasiswa atau Email"
                className="w-full h-12 px-4 pl-10 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
              />
              <User className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-darktext mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun Anda"
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
              {isSubmitting ? 'Memproses Masuk...' : 'Masuk Sekarang'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        {/* Keterangan Login 2 Role */}
        <div className="mt-4 pt-4 border-t border-softborder/80">
          <p className="text-[10px] font-semibold text-mutedtext mb-1.5 flex items-center gap-1">
            <Info className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Petunjuk Akses Masuk:</span>
          </p>

          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 flex-1 px-2 py-1.5 rounded-lg bg-emerald-50/60 border border-emerald-100/80">
              <GraduationCap className="w-3 h-3 text-emerald-700 shrink-0" />
              <div className="text-[10px] leading-snug text-emerald-900">
                <span className="font-bold">Mahasiswa</span>
                <span className="text-emerald-700"> — Portal Akademik</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-1 px-2 py-1.5 rounded-lg bg-teal-50/50 border border-teal-100/80">
              <HeartHandshake className="w-3 h-3 text-teal-700 shrink-0" />
              <div className="text-[10px] leading-snug text-teal-900">
                <span className="font-bold">Konselor</span>
                <span className="text-teal-700"> — Email Ruang BK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bantuan Login */}
        <div className="mt-6 text-center">
          <p className="text-xs text-mutedtext">
            Tidak bisa login? Hubungi{' '}
            <a
              href="mailto:ruangbk@uinssc.ac.id"
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              ruangbk@uinssc.ac.id
            </a>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
