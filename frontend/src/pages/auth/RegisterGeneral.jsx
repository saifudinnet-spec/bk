import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import PageTransition from '../../components/common/PageTransition';

export const RegisterGeneral = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    birth_place: '',
    birth_date: '',
    gender: 'Laki-laki',
    email: '',
    phone: '',
    address: '',
    password: '',
    password_confirmation: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerGeneral } = useAuth();
  const { showSuccess, showError } = useToast();
  const { hasActiveBooking, selectedTopic, selectedCounselor } = useCounselingFlow();
  const navigate = useNavigate();

  const updateField = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!formData.nik || !formData.name || !formData.birth_place || !formData.birth_date) {
      showError('Harap lengkapi semua data identitas.');
      return;
    }
    if (formData.nik.length < 16) {
      showError('NIK minimal 16 digit angka.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.phone) {
      showError('Harap lengkapi email dan nomor WhatsApp / HP.');
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.address) {
      showError('Harap isi alamat tempat tinggal Anda.');
      return;
    }
    if (formData.password.length < 6) {
      showError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      showError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerGeneral(formData);
      showSuccess('Pendaftaran berhasil! Akun umum Anda telah aktif.');

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
      showError(err.message || 'Pendaftaran gagal.');
    } finally {
      setIsSubmitting(false);
    }
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
              Pendaftaran untuk Melanjutkan Konsultasi Anda
            </h3>
            <p className="text-xs text-emerald-800">
              Topik: <span className="font-bold">{selectedTopic?.title}</span> bersama{' '}
              <span className="font-bold">{selectedCounselor?.name}</span>
            </p>
          </div>
        )}

        {/* Top Header & Progress */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl border border-softborder flex items-center justify-center text-mutedtext hover:text-darktext hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-right">
            <span className="text-[11px] font-bold text-emerald-700 tracking-wide uppercase">
              Langkah {step} dari 3
            </span>
          </div>
        </div>

        {/* Wizard Progress Indicator */}
        <div className="flex items-center justify-between max-w-xs mx-auto mb-6 px-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step >= 1 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-mutedtext'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step >= 2 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-mutedtext'
          }`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${step >= 3 ? 'bg-emerald-600' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step >= 3 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-mutedtext'
          }`}>
            3
          </div>
        </div>

        {/* Wizard Step 1: Identitas */}
        {step === 1 && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleNextStep1}
            className="space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-darktext">Identitas Pribadi</h3>
              <p className="text-xs text-mutedtext">Data KTP digunakan untuk validasi profil aman.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">NIK (Nomor Induk Kependudukan)</label>
              <input
                type="text"
                required
                maxLength={16}
                value={formData.nik}
                onChange={(e) => updateField('nik', e.target.value.replace(/\D/g, ''))}
                placeholder="16 digit NIK sesuai KTP"
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Nama lengkap sesuai identitas"
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  required
                  value={formData.birth_place}
                  onChange={(e) => updateField('birth_place', e.target.value)}
                  placeholder="Kota kelahiran"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  required
                  value={formData.birth_date}
                  onChange={(e) => updateField('birth_date', e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Jenis Kelamin</label>
              <div className="grid grid-cols-2 gap-2">
                {['Laki-laki', 'Perempuan'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateField('gender', g)}
                    className={`h-11 rounded-2xl border text-xs font-semibold transition-all ${
                      formData.gender === g
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-softborder bg-gray-50 text-mutedtext hover:bg-gray-100'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-colors mt-4 min-h-[48px]"
            >
              <span>Lanjutkan ke Kontak</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.form>
        )}

        {/* Wizard Step 2: Kontak */}
        {step === 2 && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleNextStep2}
            className="space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-darktext">Informasi Kontak</h3>
              <p className="text-xs text-mutedtext">Digunakan untuk konfirmasi jadwal dan notifikasi konseling.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Alamat Email Aktif</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="nama@domain.com"
                  className="w-full h-12 px-4 pl-10 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <Mail className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Nomor WhatsApp / HP</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full h-12 px-4 pl-10 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <Phone className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 h-12 rounded-2xl border border-softborder text-xs font-semibold text-darktext hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-colors min-h-[48px]"
              >
                <span>Lanjutkan ke Alamat & Sandi</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.form>
        )}

        {/* Wizard Step 3: Alamat & Kata Sandi */}
        {step === 3 && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleFinalSubmit}
            className="space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-darktext">Alamat & Keamanan</h3>
              <p className="text-xs text-mutedtext">Langkah terakhir untuk menyelesaikan pembuatan akun Anda.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Alamat Domisili Lengkap</label>
              <textarea
                required
                rows={2}
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Jl. Nama Jalan No. XX, Kota / Kabupaten..."
                className="w-full p-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Buat Kata Sandi</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Konfirmasi Kata Sandi</label>
              <input
                type="password"
                required
                value={formData.password_confirmation}
                onChange={(e) => updateField('password_confirmation', e.target.value)}
                placeholder="Ketik ulang kata sandi"
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 focus:bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 h-12 rounded-2xl border border-softborder text-xs font-semibold text-darktext hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[48px]"
              >
                <span>{isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.form>
        )}
      </div>
    </PageTransition>
  );
};

export default RegisterGeneral;
