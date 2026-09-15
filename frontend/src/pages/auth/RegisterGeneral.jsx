import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { useCounselingFlow } from '../../store/CounselingFlowContext';
import PageTransition from '../../components/common/PageTransition';

export const RegisterGeneral = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: '',
    // Optional additional demographic fields
    nik: '',
    birth_place: '',
    birth_date: '',
    gender: 'Laki-laki',
    address: '',
  });

  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerGeneral } = useAuth();
  const { showSuccess, showError } = useToast();
  const { hasActiveBooking, selectedTopic, selectedCounselor } = useCounselingFlow();
  const navigate = useNavigate();

  const updateField = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Harap masukkan nama lengkap Anda.');
      return;
    }
    if (!formData.phone.trim()) {
      showError('Harap masukkan nomor WhatsApp / ponsel aktif.');
      return;
    }
    if (!formData.email.trim()) {
      showError('Harap masukkan alamat email yang valid.');
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
    if (formData.nik && formData.nik.length < 16) {
      showError('Jika diisi, NIK harus berupa 16 digit angka.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerGeneral(formData);
      showSuccess('Pendaftaran berhasil! Akun Anda telah aktif.');

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
      showError(err.message || 'Pendaftaran gagal. Silakan periksa kembali data Anda.');
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
              Buat Akun untuk Melanjutkan Konsultasi
            </h3>
            <p className="text-xs text-emerald-800">
              Topik: <span className="font-bold">{selectedTopic?.title}</span> bersama{' '}
              <span className="font-bold">{selectedCounselor?.name}</span>
            </p>
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Klien Umum & Masyarakat</span>
          </div>
        </div>

        <div className="mb-6 space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pendaftaran Klien Umum
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Daftar dengan cepat menggunakan email dan nomor ponsel untuk mengakses konsultasi psikologis.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Nama lengkap Anda"
                className="w-full h-11 px-3.5 pl-10 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="Contoh: 081234567890"
                className="w-full h-11 px-3.5 pl-10 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Digunakan untuk konfirmasi jadwal konsultasi & pengingat sesi.
            </span>
          </div>

          {/* Alamat Email */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Alamat Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="nama@email.com"
                className="w-full h-11 px-3.5 pl-10 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Kata Sandi & Konfirmasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full h-11 px-3.5 pl-10 pr-9 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Ulangi Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password_confirmation}
                  onChange={(e) => updateField('password_confirmation', e.target.value)}
                  placeholder="Sama dengan sandi"
                  className="w-full h-11 px-3.5 pl-10 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Accordion: Data Tambahan (Opsional) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-slate-600 text-xs font-bold flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Lengkapi Data Identitas Tambahan (Opsional)</span>
              </span>
              {showOptionalFields ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <AnimatePresence>
              {showOptionalFields && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-3 pt-3"
                >
                  <p className="text-[11px] text-slate-400">
                    Data berikut opsional dan dapat Anda lengkapi kapan saja di halaman Profil.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      NIK (Nomor Induk Kependudukan)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => updateField('nik', e.target.value.replace(/\D/g, ''))}
                      placeholder="16 digit NIK (Opsional)"
                      className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        value={formData.birth_place}
                        onChange={(e) => updateField('birth_place', e.target.value)}
                        placeholder="Kota kelahiran"
                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => updateField('birth_date', e.target.value)}
                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Jenis Kelamin</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Laki-laki', 'Perempuan'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updateField('gender', g)}
                          className={`h-10 rounded-xl border text-xs font-semibold transition-all ${
                            formData.gender === g
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Alamat Tempat Tinggal</label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Alamat domisili atau tempat tinggal saat ini"
                      className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-all mt-3 disabled:opacity-50 min-h-[48px]"
          >
            {isSubmitting ? (
              <span>Membuat Akun...</span>
            ) : (
              <>
                <span>Daftar Akun Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="text-emerald-700 font-bold hover:underline">
              Masuk di sini
            </Link>
          </p>
          <div className="pt-1">
            <p className="text-[11px] text-slate-400">
              Apakah Anda Mahasiswa UINSSC?{' '}
              <Link to="/login?tab=student" className="text-teal-700 font-bold hover:underline">
                Masuk langsung dengan NIM
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default RegisterGeneral;
