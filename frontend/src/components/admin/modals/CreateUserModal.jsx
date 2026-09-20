import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  Award,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../store/ToastContext';

export const CreateUserModal = ({
  isOpen,
  onClose,
  onUserCreated,
  initialRole = 'TUTOR'
}) => {
  const { showSuccess, showError } = useToast();
  const [role, setRole] = useState(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    nip: '',
    specialization: '',
    bio: '',
  });

  // Sync initialRole when modal opens
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole === 'ADMIN' ? 'ADMIN' : 'TUTOR');
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        nip: '',
        specialization: '',
        bio: '',
      });
      setFormErrors({});
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Nama lengkap wajib diisi.';
    if (!formData.email.trim()) {
      errors.email = 'Email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format email tidak valid.';
    }
    if (!formData.password) {
      errors.password = 'Kata sandi wajib diisi.';
    } else if (formData.password.length < 6) {
      errors.password = 'Kata sandi minimal 6 karakter.';
    }
    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'Konfirmasi kata sandi tidak cocok.';
    }

    if (role === 'TUTOR') {
      if (!formData.specialization.trim()) {
        errors.specialization = 'Bidang spesialisasi wajib diisi untuk konselor.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        role,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        password: formData.password,
      };

      if (role === 'TUTOR') {
        payload.nip = formData.nip.trim() || null;
        payload.specialization = formData.specialization.trim();
        payload.bio = formData.bio.trim() || null;
      }

      const res = await api.post('/admin/users', payload);
      showSuccess(res.message || `Akun ${role === 'TUTOR' ? 'Konselor' : 'Admin'} berhasil dibuat.`);
      
      if (onUserCreated) {
        onUserCreated(res.user);
      }
      onClose();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      }
      showError(err.message || 'Gagal menambahkan data pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickSpecializations = [
    'Kesehatan Mental & Regulasi Emosi',
    'Bimbingan Karier & Perencanaan Masa Depan',
    'Stres Akademik & Burnout Mahasiswa',
    'Hubungan Sosial & Resolusi Konflik',
    'Kecemasan, Overthinking & Self-Compassion',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-softborder shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-softborder flex items-center justify-between gap-3 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black border transition-all ${
                role === 'TUTOR'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {role === 'TUTOR' ? (
                <GraduationCap className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-darktext">
                Tambah Akun {role === 'TUTOR' ? 'Konselor / Tutor BK' : 'Administrator'}
              </h3>
              <p className="text-xs text-mutedtext">
                {role === 'TUTOR'
                  ? 'Daftarkan praktisi konselor untuk melayani sesi konseling'
                  : 'Daftarkan pengelola sistem dengan hak akses administrasi'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-mutedtext hover:text-darktext hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Role Switcher Tabs */}
          <div>
            <label className="block text-xs font-bold text-darktext mb-1.5">
              Pilih Peran Akun <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setRole('TUTOR')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  role === 'TUTOR'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-mutedtext hover:text-darktext'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Konselor / Tutor BK
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  role === 'ADMIN'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-mutedtext hover:text-darktext'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Administrator Sistem
              </button>
            </div>
          </div>

          {/* Core User Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-darktext mb-1">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={role === 'TUTOR' ? 'Contoh: Dr. Ahmad Fauzi, M.Psi., Psikolog' : 'Contoh: Admin Layanan BK'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs text-darktext bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    formErrors.name
                      ? 'border-rose-300 ring-rose-200 focus:border-rose-500'
                      : 'border-softborder focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                  required
                />
              </div>
              {formErrors.name && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Alamat Email Resmi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@kampus.ac.id"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs text-darktext bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.email
                        ? 'border-rose-300 ring-rose-200 focus:border-rose-500'
                        : 'border-softborder focus:ring-emerald-500/20 focus:border-emerald-600'
                    }`}
                    required
                  />
                </div>
                {formErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Nomor WhatsApp / HP
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-softborder text-xs text-darktext bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Kata Sandi (Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs text-darktext bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.password
                        ? 'border-rose-300 ring-rose-200 focus:border-rose-500'
                        : 'border-softborder focus:ring-emerald-500/20 focus:border-emerald-600'
                    }`}
                    required
                  />
                </div>
                {formErrors.password && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => handleChange('password_confirmation', e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs text-darktext bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.password_confirmation
                        ? 'border-rose-300 ring-rose-200 focus:border-rose-500'
                        : 'border-softborder focus:ring-emerald-500/20 focus:border-emerald-600'
                    }`}
                    required
                  />
                </div>
                {formErrors.password_confirmation && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.password_confirmation}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tutor Specific Fields */}
          {role === 'TUTOR' && (
            <div className="pt-3 border-t border-gray-100 space-y-3.5">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block">
                Profil & Kualifikasi Konselor
              </span>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  NIP / ID Konselor (Opsional)
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => handleChange('nip', e.target.value)}
                    placeholder="198708222015042002"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-softborder text-xs text-darktext bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Bidang Spesialisasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder="Contoh: Bimbingan Karier, Kecemasan & Motivasi Belajar"
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs text-darktext bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    formErrors.specialization
                      ? 'border-rose-300 ring-rose-200 focus:border-rose-500'
                      : 'border-softborder focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                  required
                />
                {formErrors.specialization && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.specialization}
                  </p>
                )}

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-mutedtext font-semibold self-center mr-1">Rekomendasi:</span>
                  {quickSpecializations.map((spec, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('specialization', spec)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-100"
                    >
                      + {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Bio / Deskripsi Pendek Konselor
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={2}
                  placeholder="Ceritakan latar belakang pendekatan konseling, keramahan, dan dedikasi mendampingi klien..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-softborder text-xs text-darktext bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* Modal Footer CTA */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl border border-softborder text-xs font-bold text-mutedtext hover:text-darktext hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-soft-sm transition-all flex items-center gap-2 ${
                role === 'TUTOR'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Akun...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Buat Akun {role === 'TUTOR' ? 'Konselor' : 'Admin'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
