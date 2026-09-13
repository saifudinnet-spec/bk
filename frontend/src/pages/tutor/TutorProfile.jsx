import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ShieldCheck,
  Award,
  Mail,
  Phone,
  Camera,
  Check,
  Save,
  Plus,
  X,
  Sparkles,
  HeartHandshake,
  Brain,
  GraduationCap,
  Users,
  Compass,
  Home,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import PageTransition from '../../components/common/PageTransition';
import Modal from '../../components/common/Modal';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';

const TOPIC_ICONS = {
  GraduationCap,
  Brain,
  Sparkles,
  Users,
  Home,
  Compass,
  HeartHandshake,
};

// Preset avatar options for counselors
const PRESET_AVATARS = [
  { id: 'counselor_dian', label: 'Psikolog Dian (Hijab Formal)', url: '/images/counselor_dian.jpg' },
  { id: 'counselor_ahmad', label: 'Ahmad Fauzi (Jas Kampus)', url: '/images/counselor_ahmad.jpg' },
  { id: 'nara_formal', label: 'Nara (Blazer & Hijab)', url: '/images/guidance/nara_intro.jpg' },
  { id: 'hero_counseling', label: 'Ruang Konseling UINSSC', url: '/images/hero_counseling.jpg' },
];

// Recommended tags for counseling expertise
const RECOMMENDED_TAGS = [
  'Kesehatan Mental',
  'Adaptasi Kampus & Regulasi Emosi',
  'Manajemen Stres & Burnout',
  'Prokrastinasi & Skripsi',
  'Kecemasan & Overthinking',
  'Cognitive Behavioral Therapy (CBT)',
  'Mindfulness & Grounding',
  'Komunikasi & Relasi Sosial',
  'Perencanaan Karier Mahasiswa',
  'Resolusi Konflik Keluarga',
];

export const TutorProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nip, setNip] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [avatar, setAvatar] = useState('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Topics & Expertise Tags
  const [allTopics, setAllTopics] = useState([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    total_sessions: 0,
    completed_sessions: 0,
    active_cases: 0,
    average_rating: 5.0,
    total_reviews: 0,
  });

  const fileInputRef = useRef(null);

  // Fetch counselor profile data from API
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tutor/my-profile');
      if (res) {
        const u = res.user || {};
        const t = res.tutor || {};

        setName(u.name || '');
        setPhone(u.phone || '');
        setNip(t.nip || '');
        setSpecialization(t.specialization || 'Konselor Spesialis Kesehatan Mental & Regulasi Emosi');
        setBio(t.bio || '');
        setIsAvailable(t.is_available !== undefined ? Boolean(t.is_available) : true);
        
        const photoSrc = t.photo || u.avatar || '/images/counselor_dian.jpg';
        setAvatar(photoSrc);
        setPhotoPreview(photoSrc);

        setAllTopics(res.all_topics || []);
        setSelectedTopicIds(res.assigned_topic_ids || []);
        
        // Initial tags: combine fetched tags or defaults
        const initialTags = res.expertise_tags && res.expertise_tags.length > 0
          ? res.expertise_tags
          : ['Kesehatan Mental', 'Adaptasi Kampus & Regulasi Emosi', 'Manajemen Stres & Burnout'];
        setExpertiseTags(initialTags);

        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      showError(err.message || 'Gagal memuat profil konselor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('File harus berupa format gambar (JPG, PNG, atau WebP).');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        showError('Ukuran foto maksimal adalah 3 MB.');
        return;
      }
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Topic selection
  const handleToggleTopic = (topicId) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  // Add custom tag
  const handleAddTag = (tagToAdd) => {
    const clean = (tagToAdd || customTagInput).trim();
    if (!clean) return;
    if (expertiseTags.includes(clean)) {
      showError('Tag ini sudah ada dalam daftar.');
      return;
    }
    if (expertiseTags.length >= 15) {
      showError('Maksimal 15 tag keahlian.');
      return;
    }
    setExpertiseTags((prev) => [...prev, clean]);
    setCustomTagInput('');
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove) => {
    setExpertiseTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Save all profile changes
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      showError('Nama konselor wajib diisi.');
      return;
    }
    if (!specialization.trim()) {
      showError('Bidang spesialisasi wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      formData.append('nip', nip.trim());
      formData.append('specialization', specialization.trim());
      formData.append('bio', bio.trim());
      formData.append('is_available', isAvailable ? '1' : '0');

      if (selectedPhotoFile) {
        formData.append('photo', selectedPhotoFile);
      } else if (avatar) {
        formData.append('avatar', avatar);
      }

      // Add selected topics
      selectedTopicIds.forEach((id) => {
        formData.append('topic_ids[]', id);
      });

      // Add expertise tags (comma-separated or multiple)
      formData.append('expertise_tags', expertiseTags.join(', '));

      const response = await api.post('/tutor/my-profile', formData);

      if (response && response.user) {
        updateUser(response.user);
        setAvatar(response.user.avatar || photoPreview);
        setSelectedPhotoFile(null);
        showSuccess('Profil konselor berhasil disimpan & diperbarui.');
      }
    } catch (err) {
      showError(err.message || 'Gagal menyimpan perubahan profil konselor.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. Header Hero Card with Photo, Stats & Availability */}
      <div className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-soft-sm overflow-hidden">
        {/* Subtle decorative background gradient accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/40 via-teal-50/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden ring-4 ring-emerald-500/20 shadow-soft-md bg-slate-100 relative">
              <img
                src={photoPreview || avatar || '/images/counselor_dian.jpg'}
                alt={name}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = '/images/counselor_dian.jpg';
                }}
              />
            </div>

            {/* Quick Change Photo Button */}
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft-md transition-transform hover:scale-110 flex items-center justify-center"
              title="Ganti Foto Profil"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Counselor Info & Badge Details */}
          <div className="flex-1 text-center md:text-left space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Konselor Resmi UINSSC</span>
              </span>

              {nip && (
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  NIP: {nip}
                </span>
              )}

              {/* Status Toggle Badge */}
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer border ${
                  isAvailable
                    ? 'bg-emerald-100/80 text-emerald-950 border-emerald-300 hover:bg-emerald-200/80'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
                title="Klik untuk mengubah status ketersediaan"
              >
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`} />
                <span>{isAvailable ? 'Tersedia Menerima Sesi' : 'Sedang Libur'}</span>
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {name || 'Nama Konselor'}
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-emerald-800 line-clamp-1">
              {specialization || 'Spesialisasi Konseling & Kesehatan Mental'}
            </p>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed max-w-2xl">
              {bio || 'Belum ada ringkasan bio profesional. Tuliskan deskripsi Anda di formulir di bawah ini.'}
            </p>

            {/* Stats Pills Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span><strong>{stats.average_rating}</strong> ({stats.total_reviews} ulasan)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span><strong>{stats.completed_sessions}</strong> Sesi Selesai</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
                <span><strong>{stats.active_cases}</strong> Kasus Berjalan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Edit Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Card A: Identitas & Informasi Kontak */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Identitas & Kontak Konselor</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Data resmi yang akan ditampilkan pada kartu konselor dan halaman detail bimbingan mahasiswa.
              </p>
            </div>
            <User className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Nama Lengkap & Gelar */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nama Lengkap & Gelar Profesional <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Dian Permatasari, M.Psi., Psikolog"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold transition-all"
                required
              />
            </div>

            {/* NIP */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                NIP / Nomor Identitas Pegawai
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Contoh: 198504122010122001"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Institusi (Akun Resmi)</span>
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-100 text-xs sm:text-sm text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            {/* No Telepon / WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>No. WhatsApp / Telepon Konseling</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Spesialisasi Utama */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700">
              Bidang Spesialisasi Utama <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="Contoh: Kesehatan Mental, Adaptasi Kampus & Regulasi Emosi"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold transition-all"
              required
            />
            <p className="text-[11px] text-slate-400">
              Ringkasan bidang keahlian konseling yang langsung tampak pada kartu beranda & pencarian mahasiswa.
            </p>
          </div>
        </div>

        {/* Card B: Bidang yang Dikuasai & Topik Konseling */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Bidang & Topik yang Dikuasai</h2>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih topik konseling resmi serta cantumkan tag keahlian spesifik seperti <strong>Kesehatan Mental</strong>, <strong>Adaptasi Kampus & Regulasi Emosi</strong>, dll.
            </p>
          </div>

          {/* 1. Official Topic Checkboxes */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              1. Topik Layanan Konseling Kampus (Pilih yang Anda tangani)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allTopics.map((topic) => {
                const isSelected = selectedTopicIds.includes(topic.id);
                const IconComponent = TOPIC_ICONS[topic.icon] || Sparkles;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleToggleTopic(topic.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-soft-xs text-emerald-950'
                        : 'bg-white border-slate-200/90 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{topic.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {topic.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Specific Expertise Tags */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                2. Tag Keahlian Khusus & Pendekatan Konseling
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {expertiseTags.length} tag aktif
              </span>
            </div>

            {/* Active Tags Chips */}
            <div className="flex flex-wrap items-center gap-2 min-h-[44px] p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80">
              {expertiseTags.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  Belum ada tag keahlian. Tambahkan tag dari rekomendasi di bawah atau tulis sendiri.
                </span>
              ) : (
                expertiseTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-200/90 text-emerald-900 text-xs font-bold shadow-2xs group"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-rose-50 transition-colors"
                      title="Hapus tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Custom Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Tulis keahlian khusus lainnya (misal: Regulasi Emosi, CBT, dll) lalu tekan Tambah..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            {/* Recommended Tag Suggestions */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                Rekomendasi Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {RECOMMENDED_TAGS.filter((t) => !expertiseTags.includes(t)).map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => handleAddTag(rec)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200/70 transition-all cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>{rec}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card C: Bio & Filosofi Konseling */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Bio & Pendekatan Konseling</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jelaskan latar belakang pengalaman, gaya konseling, dan pesan ramah untuk membuat mahasiswa nyaman berkonsultasi.
            </p>
          </div>

          <div className="space-y-1.5">
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan latar belakang profesional, pendekatan konseling yang digunakan, dan komitmen kerahasiaan Anda..."
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed shadow-inner"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Maksimal 2500 karakter</span>
              <span>{bio.length} / 2500</span>
            </div>
          </div>
        </div>

        {/* Card D: Pengaturan Status Ketersediaan */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-slate-900">Status Ketersediaan Konseling</h2>
              <p className="text-xs text-slate-500">
                Atur apakah jadwal Anda saat ini terbuka untuk reservasi sesi baru oleh mahasiswa.
              </p>
            </div>

            {/* Switch Toggle */}
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${
                isAvailable ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`bg-white w-6 h-6 rounded-full shadow-md ${
                  isAvailable ? 'ml-6' : 'ml-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/90 text-xs text-emerald-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Jika status disetel <strong>Aktif</strong>, mahasiswa dapat memilih nama Anda dan memesan slot konseling interaktif (Chat, Video Zoom, atau Tatap Muka Kampus).
            </span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors min-h-[46px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-soft-md flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 min-h-[48px]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}</span>
          </motion.button>
        </div>

      </form>

      {/* 3. Modal Edit Foto Profil */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="Ganti Foto Profil Konselor"
      >
        <div className="space-y-6">
          {/* Current / Preview Photo */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-emerald-500/20 shadow-soft-md bg-slate-100">
              <img
                src={photoPreview || '/images/counselor_dian.jpg'}
                alt="Preview"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <span className="text-xs font-bold text-slate-700">Preview Foto Profil Saat Ini</span>
          </div>

          {/* Option 1: Upload from Computer */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              1. Upload Foto dari Perangkat
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>{selectedPhotoFile ? selectedPhotoFile.name : 'Pilih File Gambar (JPG/PNG/WebP, Maks 3MB)'}</span>
            </button>
          </div>

          {/* Option 2: Choose Official Presets */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-800 block">
              2. Atau Pilih Foto Profil Resmi Konselor Kampus
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_AVATARS.map((p) => {
                const isChosen = photoPreview === p.url && !selectedPhotoFile;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPhotoFile(null);
                      setPhotoPreview(p.url);
                      setAvatar(p.url);
                    }}
                    className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                      isChosen
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={p.url}
                      alt={p.label}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-800 block truncate">
                        {p.label}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Pilih Preset</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setSelectedPhotoFile(null);
                setPhotoPreview(avatar);
                setShowPhotoModal(false);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPhotoModal(false);
                showSuccess('Foto profil dipilih. Klik "Simpan Perubahan Profil" untuk menerapkan.');
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft-sm"
            >
              Gunakan Foto Ini
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Logout Confirm Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Konfirmasi Keluar Akun"
      >
        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Apakah Anda yakin ingin mengakhiri sesi konselor di Ruang BK? Anda dapat masuk kembali kapan saja dengan email atau NIP.
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={() => {
              setShowLogoutModal(false);
              logout();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft-sm"
          >
            Ya, Keluar Akun
          </button>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default TutorProfile;
