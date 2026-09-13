import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  FolderHeart,
  Video,
  ShieldAlert,
  Settings,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Power,
  LayoutTemplate,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  HelpCircle,
  MessageSquareHeart,
  Upload,
  Image as ImageIcon,
  BookOpen,
  Building2,
  Compass,
  Edit3,
  Eye,
  Clock,
  Calendar,
  X,
  FileText,
  Check
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import StatCard from '../../components/cards/StatCard';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({
    tutor_assignment_mode: 'student_select',
    crisis_flag_enabled: true,
    zoom_mock_mode: true,
  });

  // CMS Landing Content State
  const [landingContent, setLandingContent] = useState(null);
  const [isSavingCms, setIsSavingCms] = useState(false);

  // Article Manager State (WordPress Sederhana)
  const [editingArticle, setEditingArticle] = useState(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState('all');
  const [previewArticle, setPreviewArticle] = useState(null);

  const [activeTab, setActiveTab] = useState('overview'); // overview | users | articles | cms | audit | settings
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Priority load: Dashboard Overview statistics (instant display)
      const dashRes = await api.get('/admin/dashboard');
      setData(dashRes);
      setIsLoading(false);

      // 2. Preload remaining datasets asynchronously in the background
      api.get('/landing-content').then((res) => {
        if (res.data) setLandingContent(res.data);
      }).catch(() => {});

      api.get('/admin/users').then((res) => {
        setUsers(res.data || []);
      }).catch(() => {});

      api.get('/admin/audit-logs').then((res) => {
        setAuditLogs(res.data || []);
      }).catch(() => {});

      api.get('/admin/settings').then((res) => {
        if (res) setSettings(res);
      }).catch(() => {});
    } catch (err) {
      showError('Gagal memuat data administrasi.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-status`);
      showSuccess(res.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: res.user.status } : u))
      );
    } catch (err) {
      showError(err.message || 'Gagal mengubah status pengguna.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.put('/admin/settings', settings);
      showSuccess('Pengaturan sistem berhasil disimpan.');
    } catch (err) {
      showError(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // CMS Handlers
  const handleHeroChange = (field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      hero: {
        ...prev?.hero,
        [field]: value,
      },
    }));
  };

  const handleBannerFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Ukuran gambar maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        handleHeroChange('image_url', uploadEvent.target?.result);
        showSuccess('Gambar banner berhasil dimuat!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Services handlers
  const handleServiceChange = (index, field, value) => {
    setLandingContent((prev) => {
      const items = [...(prev?.services?.items || [])];
      items[index][field] = value;
      return {
        ...prev,
        services: {
          ...prev?.services,
          items,
        },
      };
    });
  };

  const handleAddService = () => {
    setLandingContent((prev) => ({
      ...prev,
      services: {
        ...prev?.services,
        items: [
          ...(prev?.services?.items || []),
          {
            id: Date.now(),
            title: 'Layanan Bimbingan Baru',
            desc: 'Deskripsi lengkap mengenai layanan konseling ini...',
            tag: 'Layanan',
            icon: 'Sparkles',
          },
        ],
      },
    }));
  };

  const handleRemoveService = (index) => {
    setLandingContent((prev) => ({
      ...prev,
      services: {
        ...prev?.services,
        items: prev?.services?.items?.filter((_, i) => i !== index),
      },
    }));
  };

  // Articles handlers
  const handleArticleChange = (index, field, value) => {
    setLandingContent((prev) => {
      const items = [...(prev?.articles?.items || [])];
      items[index][field] = value;
      return {
        ...prev,
        articles: {
          ...prev?.articles,
          items,
        },
      };
    });
  };

  const handleAddArticle = () => {
    setLandingContent((prev) => ({
      ...prev,
      articles: {
        ...prev?.articles,
        items: [
          ...(prev?.articles?.items || []),
          {
            id: Date.now(),
            title: 'Judul Artikel Baru',
            category: 'Kesehatan Mental',
            read_time: '3 min baca',
            date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            author: 'Konselor UINSSC',
            snippet: 'Ringkasan singkat artikel yang menarik perhatian pembaca...',
            content: 'Isi lengkap artikel edukasi psikologi kampus...',
          },
        ],
      },
    }));
  };

  const handleRemoveArticle = (index) => {
    setLandingContent((prev) => ({
      ...prev,
      articles: {
        ...prev?.articles,
        items: prev?.articles?.items?.filter((_, i) => i !== index),
      },
    }));
  };

  // WordPress-style Article Actions
  const handleOpenCreateArticle = () => {
    setEditingArticle({
      id: Date.now(),
      title: '',
      category: 'Tips Akademik',
      read_time: '3 min baca',
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      author: 'Tim Konselor UINSSC',
      image_url: '/images/banner1.jpg',
      snippet: '',
      content: '',
      status: 'published',
    });
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (art) => {
    setEditingArticle({ ...art });
    setIsArticleModalOpen(true);
  };

  const handleArticleFieldChange = (field, value) => {
    setEditingArticle((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArticleFeaturedImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Ukuran gambar maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        handleArticleFieldChange('image_url', uploadEvent.target?.result);
        showSuccess('Gambar utama artikel berhasil dimuat!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveArticleModal = async (e) => {
    if (e) e.preventDefault();
    if (!editingArticle?.title?.trim()) {
      showError('Judul artikel tidak boleh kosong.');
      return;
    }

    const currentArticles = landingContent?.articles?.items || [];
    const exists = currentArticles.some((a) => a.id === editingArticle.id);
    let updatedArticles;
    if (exists) {
      updatedArticles = currentArticles.map((a) => (a.id === editingArticle.id ? editingArticle : a));
    } else {
      updatedArticles = [editingArticle, ...currentArticles];
    }

    const updatedLandingContent = {
      ...landingContent,
      articles: {
        ...landingContent?.articles,
        items: updatedArticles,
      },
    };

    setLandingContent(updatedLandingContent);
    setIsArticleModalOpen(false);

    try {
      await api.put('/admin/landing-content', updatedLandingContent);
      showSuccess('Artikel berhasil disimpan & diterbitkan!');
    } catch (err) {
      showError(err.message || 'Gagal menyimpan artikel ke server.');
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;
    const currentArticles = landingContent?.articles?.items || [];
    const updatedArticles = currentArticles.filter((a) => a.id !== articleId);

    const updatedLandingContent = {
      ...landingContent,
      articles: {
        ...landingContent?.articles,
        items: updatedArticles,
      },
    };

    setLandingContent(updatedLandingContent);

    try {
      await api.put('/admin/landing-content', updatedLandingContent);
      showSuccess('Artikel berhasil dihapus!');
    } catch (err) {
      showError(err.message || 'Gagal memperbarui ke server.');
    }
  };

  const handleScreeningCtaChange = (field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      screening_cta: {
        ...prev?.screening_cta,
        [field]: value,
      },
    }));
  };

  // Top Navbar CMS Handlers
  const handleNavbarChange = (field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      navbar: {
        ...prev?.navbar,
        [field]: value,
      },
    }));
  };

  const handleNavbarMenuChange = (index, field, value) => {
    setLandingContent((prev) => {
      const menu = [...(prev?.navbar?.menu || [])];
      menu[index] = { ...menu[index], [field]: value };
      return {
        ...prev,
        navbar: {
          ...prev?.navbar,
          menu,
        },
      };
    });
  };

  const handleAddNavbarMenuItem = () => {
    setLandingContent((prev) => ({
      ...prev,
      navbar: {
        ...prev?.navbar,
        menu: [
          ...(prev?.navbar?.menu || []),
          { label: 'Menu Baru', href: '#layanan' },
        ],
      },
    }));
  };

  const handleRemoveNavbarMenuItem = (index) => {
    setLandingContent((prev) => ({
      ...prev,
      navbar: {
        ...prev?.navbar,
        menu: prev?.navbar?.menu?.filter((_, i) => i !== index),
      },
    }));
  };

  // Footer CMS Handlers
  const handleFooterChange = (field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      footer: {
        ...prev?.footer,
        [field]: value,
      },
    }));
  };

  const handleFooterQuickLinkChange = (index, field, value) => {
    setLandingContent((prev) => {
      const quick_links = [...(prev?.footer?.quick_links || [])];
      quick_links[index] = { ...quick_links[index], [field]: value };
      return {
        ...prev,
        footer: {
          ...prev?.footer,
          quick_links,
        },
      };
    });
  };

  const handleAddFooterQuickLink = () => {
    setLandingContent((prev) => ({
      ...prev,
      footer: {
        ...prev?.footer,
        quick_links: [
          ...(prev?.footer?.quick_links || []),
          { label: 'Tautan Baru', href: '#' },
        ],
      },
    }));
  };

  const handleRemoveFooterQuickLink = (index) => {
    setLandingContent((prev) => ({
      ...prev,
      footer: {
        ...prev?.footer,
        quick_links: prev?.footer?.quick_links?.filter((_, i) => i !== index),
      },
    }));
  };

  const handleFaqChange = (index, field, value) => {
    setLandingContent((prev) => {
      const faqs = [...(prev?.faqs || [])];
      faqs[index][field] = value;
      return { ...prev, faqs };
    });
  };

  const handleAddFaq = () => {
    setLandingContent((prev) => ({
      ...prev,
      faqs: [
        ...(prev?.faqs || []),
        { question: 'Pertanyaan baru?', answer: 'Jawaban penjelasan untuk mahasiswa...' },
      ],
    }));
  };

  const handleRemoveFaq = (index) => {
    setLandingContent((prev) => ({
      ...prev,
      faqs: prev?.faqs?.filter((_, i) => i !== index),
    }));
  };

  const handleProblemChange = (index, field, value) => {
    setLandingContent((prev) => {
      const items = [...(prev?.problems?.items || [])];
      items[index][field] = value;
      return {
        ...prev,
        problems: {
          ...prev?.problems,
          items,
        },
      };
    });
  };

  const handleAddProblem = () => {
    setLandingContent((prev) => ({
      ...prev,
      problems: {
        ...prev?.problems,
        items: [
          ...(prev?.problems?.items || []),
          {
            id: Date.now(),
            title: 'Topik Permasalahan Baru',
            desc: 'Deskripsi kendala atau situasi yang dihadapi mahasiswa.',
            tag: 'Konseling',
            icon: 'Sparkles',
          },
        ],
      },
    }));
  };

  const handleRemoveProblem = (index) => {
    setLandingContent((prev) => ({
      ...prev,
      problems: {
        ...prev?.problems,
        items: prev?.problems?.items?.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSaveLandingContent = async (e) => {
    e.preventDefault();
    setIsSavingCms(true);
    try {
      const res = await api.put('/admin/landing-content', landingContent);
      showSuccess(res.message || 'Konten landing page berhasil diperbarui!');
    } catch (err) {
      showError(err.message || 'Gagal menyimpan konten landing page.');
    } finally {
      setIsSavingCms(false);
    }
  };

  const handleResetLandingContent = async () => {
    if (!window.confirm('Kembalikan semua teks dan konten landing page ke pengaturan bawaan?')) return;
    setIsSavingCms(true);
    try {
      const res = await api.post('/admin/landing-content/reset');
      if (res.data) {
        setLandingContent(res.data);
      }
      showSuccess('Konten landing page berhasil dikembalikan ke default.');
    } catch (err) {
      showError('Gagal mereset konten.');
    } finally {
      setIsSavingCms(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = data?.stats || {};

  return (
    <PageTransition className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-darktext">Tata Kelola & Operasional</h2>
          <p className="text-xs text-mutedtext mt-0.5">Pantau aktivitas sistem, hak akses, dan manajemen konten landing page</p>
        </div>
        <button
          onClick={loadData}
          className="p-2.5 rounded-2xl bg-white border border-softborder text-mutedtext hover:text-darktext shadow-soft-sm"
          title="Segarkan Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-2xl max-w-2xl overflow-x-auto">
        {[
          { key: 'overview', label: 'Ringkasan' },
          { key: 'users', label: 'Pengguna' },
          { key: 'articles', label: 'Kelola Artikel' },
          { key: 'cms', label: 'Kelola Landing Page' },
          { key: 'audit', label: 'Audit Logs' },
          { key: 'settings', label: 'Pengaturan' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-mutedtext hover:text-darktext'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={GraduationCap}
              label="Total Mahasiswa"
              value={stats.total_students || 0}
              subtext="Akun terverifikasi"
              color="emerald"
            />
            <StatCard
              icon={Users}
              label="Pengguna Umum"
              value={stats.total_general || 0}
              subtext="Terdaftar NIK"
              color="teal"
            />
            <StatCard
              icon={FolderHeart}
              label="Kasus Konseling Aktif"
              value={stats.active_cases || 0}
              subtext="Sedang berjalan"
              color="blue"
            />
            <StatCard
              icon={ShieldAlert}
              label="Crisis Flags"
              value={stats.crisis_flag_count || 0}
              subtext="Perlu perhatian konselor"
              color="amber"
            />
          </div>

          {/* Recent Audit Logs Snapshot */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-3">
            <h3 className="text-sm font-bold text-darktext">Aktivitas Sistem Terkini (Audit)</h3>
            <div className="space-y-2">
              {data?.recent_logs?.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-darktext capitalize">{log.action}</span>
                    <span className="text-mutedtext">oleh {log.user?.name || 'Sistem'}</span>
                  </div>
                  <span className="text-[10px] text-mutedtext font-mono">
                    {new Date(log.created_at).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Users Tab */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
          <h3 className="text-sm font-bold text-darktext">Daftar Pengguna ({users.length})</h3>

          <div className="space-y-2.5">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl border border-softborder flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-darktext">{u.name}</h4>
                    <p className="text-mutedtext text-[11px]">{u.email}</p>
                    <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-1">
                      {u.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      u.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {u.status === 'active' ? 'Aktif' : 'Non-aktif'}
                  </span>

                  {u.role !== 'ADMIN' && (
                    <button
                      onClick={() => handleToggleUserStatus(u.id)}
                      className="p-2 rounded-xl border border-softborder text-mutedtext hover:text-darktext hover:bg-gray-50 transition-colors"
                      title="Ubah Status Pengguna"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2b. Tab Kelola Artikel Sendiri (WordPress Sederhana) */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          {/* Action Header Card */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-darktext">Kelola Artikel & Edukasi Psikologi</h3>
                <p className="text-xs text-mutedtext mt-0.5">
                  Tulis, edit, tambahkan foto cover (featured image), dan publikasikan artikel edukasi kampus ala WordPress.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenCreateArticle}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-soft-sm flex items-center gap-2 transition-all min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tulis Artikel Baru</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white border border-softborder shadow-soft-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul atau isi artikel..."
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-[11px] font-bold text-mutedtext">Kategori:</span>
              {['all', 'Tips Akademik', 'Kesehatan Mental', 'Tips Konseling', 'Karier'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setArticleCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    articleCategoryFilter === cat
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-gray-100 text-mutedtext hover:text-darktext hover:bg-gray-200/70'
                  }`}
                >
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Article List Cards */}
          <div className="space-y-3">
            {(!landingContent?.articles?.items ||
              landingContent.articles.items.filter((art) => {
                const matchSearch =
                  (art.title || '').toLowerCase().includes(articleSearch.toLowerCase()) ||
                  (art.snippet || '').toLowerCase().includes(articleSearch.toLowerCase());
                const matchCategory =
                  articleCategoryFilter === 'all' || art.category === articleCategoryFilter;
                return matchSearch && matchCategory;
              }).length === 0) ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-softborder space-y-3">
                <FileText className="w-12 h-12 text-mutedtext/40 mx-auto" />
                <p className="text-sm font-bold text-darktext">Tidak ada artikel yang sesuai</p>
                <p className="text-xs text-mutedtext">
                  Klik tombol <strong>"+ Tulis Artikel Baru"</strong> untuk mempublikasikan artikel pertama Anda.
                </p>
              </div>
            ) : (
              landingContent.articles.items
                .filter((art) => {
                  const matchSearch =
                    (art.title || '').toLowerCase().includes(articleSearch.toLowerCase()) ||
                    (art.snippet || '').toLowerCase().includes(articleSearch.toLowerCase());
                  const matchCategory =
                    articleCategoryFilter === 'all' || art.category === articleCategoryFilter;
                  return matchSearch && matchCategory;
                })
                .map((art) => (
                  <div
                    key={art.id}
                    className="p-4 sm:p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm hover:border-emerald-300 hover:shadow-soft-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Featured Image Thumbnail */}
                      <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 border border-softborder shrink-0 relative group/thumb">
                        <img
                          src={art.image_url || '/images/banner1.jpg'}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            {art.category || 'Artikel'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                            Terbit
                          </span>
                          <span className="text-[11px] text-mutedtext flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {art.read_time || '3 min baca'}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-darktext group-hover:text-emerald-800 transition-colors leading-snug line-clamp-1">
                          {art.title}
                        </h4>

                        <p className="text-xs text-mutedtext line-clamp-2 leading-relaxed">
                          {art.snippet || art.content}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-mutedtext font-medium pt-0.5">
                          <span className="font-semibold text-emerald-900">{art.author || 'Konselor UINSSC'}</span>
                          <span>•</span>
                          <span>{art.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewArticle(art)}
                        className="px-3 py-1.5 rounded-xl border border-softborder bg-gray-50 hover:bg-gray-100 text-darktext text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Pratinjau Artikel"
                      >
                        <Eye className="w-3.5 h-3.5 text-mutedtext" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditArticle(art)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Edit Artikel"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(art.id)}
                        className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-colors"
                        title="Hapus Artikel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* 3. CMS Tab: Kelola Konten Landing Page (Admin Gonta-Ganti Konten) */}
      {activeTab === 'cms' && landingContent && (
        <form onSubmit={handleSaveLandingContent} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-darktext flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-emerald-600" />
                <span>Manajemen Konten Landing Page (CMS)</span>
              </h3>
              <p className="text-xs text-mutedtext mt-0.5">
                Kustomisasi teks headline, gambar banner, area bimbingan, dan pertanyaan FAQ tanpa ubah kode.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetLandingContent}
                className="px-3 py-2 rounded-xl border border-softborder bg-white text-mutedtext hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
              <button
                type="submit"
                disabled={isSavingCms}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[40px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSavingCms ? 'Menyimpan...' : 'Simpan Konten'}</span>
              </button>
            </div>
          </div>

          {/* Section 0: Top Bar & Menu Navigasi (CMS) */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Top Bar & Menu Navigasi Halaman Utama</span>
              </h4>
              <span className="text-[11px] text-mutedtext">Kustomisasi header, identitas kampus, dan tautan menu</span>
            </div>

            {/* Sub-section 1: Pengumuman Bar Atas */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/70 space-y-3">
              <span className="text-xs font-bold text-emerald-900 block">
                Pengumuman Bar Atas (Institutional Accent Strip)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-darktext mb-1">Tag Institusi (Kiri)</label>
                  <input
                    type="text"
                    value={landingContent?.navbar?.top_badge ?? 'UINSSC CYBER CAMPUS'}
                    onChange={(e) => handleNavbarChange('top_badge', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-bold text-darktext"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-darktext mb-1">Teks Pengumuman Tengah</label>
                  <input
                    type="text"
                    value={landingContent?.navbar?.top_announcement ?? 'Pusat Layanan Bimbingan & Konseling Mahasiswa'}
                    onChange={(e) => handleNavbarChange('top_announcement', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-white text-xs text-darktext"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-darktext mb-1">Lencana Fasilitas (Kanan)</label>
                  <input
                    type="text"
                    value={landingContent?.navbar?.top_free_text ?? '100% Fasilitas Kampus Bebas Biaya'}
                    onChange={(e) => handleNavbarChange('top_free_text', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-bold text-emerald-800"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section 2: Logo Brand & Identitas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Nama Brand Aplikasi</label>
                <input
                  type="text"
                  value={landingContent?.navbar?.brand_name ?? 'Ruang BK'}
                  onChange={(e) => handleNavbarChange('brand_name', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs font-bold text-darktext focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Lencana Kampus (Badge)</label>
                <input
                  type="text"
                  value={landingContent?.navbar?.brand_campus ?? 'UINSSC'}
                  onChange={(e) => handleNavbarChange('brand_campus', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs font-bold text-emerald-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Tagline Singkat Brand</label>
                <input
                  type="text"
                  value={landingContent?.navbar?.brand_tagline ?? 'Bimbingan & Konseling Terpadu'}
                  onChange={(e) => handleNavbarChange('brand_tagline', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
                />
              </div>
            </div>

            {/* Sub-section 3: Daftar Menu Navigasi */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-darktext">
                    Daftar Item Menu Navigasi ({landingContent?.navbar?.menu?.length || 0})
                  </label>
                  <p className="text-[11px] text-mutedtext">Tautan menu yang tampil di navigasi atas desktop</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddNavbarMenuItem}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Menu</span>
                </button>
              </div>

              <div className="space-y-2">
                {(landingContent?.navbar?.menu || [
                  { label: 'Layanan', href: '#layanan' },
                  { label: 'Topik Bimbingan', href: '#masalah' },
                  { label: 'Artikel', href: '#artikel' },
                  { label: 'Konselor Kami', href: '#konselor' },
                  { label: 'Cara Kerja', href: '#cara-kerja' },
                  { label: 'FAQ', href: '#faq' },
                ]).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-3"
                  >
                    <span className="w-6 h-6 rounded-lg bg-white text-mutedtext font-mono text-[11px] font-bold flex items-center justify-center border border-gray-200 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Label Menu (misal: Artikel)"
                        value={item.label}
                        onChange={(e) => handleNavbarMenuChange(idx, 'label', e.target.value)}
                        className="h-9 px-3 rounded-xl border border-softborder bg-white text-xs font-semibold text-darktext"
                      />
                      <input
                        type="text"
                        placeholder="Tautan Anchor (misal: #artikel)"
                        value={item.href}
                        onChange={(e) => handleNavbarMenuChange(idx, 'href', e.target.value)}
                        className="h-9 px-3 rounded-xl border border-softborder bg-white text-xs font-mono text-mutedtext"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveNavbarMenuItem(idx)}
                      className="w-8 h-8 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0 transition-colors"
                      title="Hapus Menu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 1: Hero Banner */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            <h4 className="text-sm font-bold text-darktext border-b border-gray-100 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Bagian Utama (Hero Section)</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">
                Badge / Tagline Atas
              </label>
              <input
                type="text"
                value={landingContent?.hero?.tagline || ''}
                onChange={(e) => handleHeroChange('tagline', e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-medium text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">
                Judul Utama (Headline H1)
              </label>
              <textarea
                rows={2}
                value={landingContent?.hero?.title || ''}
                onChange={(e) => handleHeroChange('title', e.target.value)}
                placeholder="Beri Ruang untuk Dirimu.&#10;Ceritakan, Pulihkan, Lanjutkan."
                className="w-full p-3 rounded-2xl border border-softborder bg-gray-50 text-xs font-medium text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">
                Sub-Judul (Deskripsi Hero)
              </label>
              <textarea
                rows={2}
                value={landingContent?.hero?.subtitle || ''}
                onChange={(e) => handleHeroChange('subtitle', e.target.value)}
                className="w-full p-3 rounded-2xl border border-softborder bg-gray-50 text-xs font-medium text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Ganti Banner & Preview */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
              <label className="block text-xs font-bold text-darktext flex items-center justify-between">
                <span>Gambar Banner Utama</span>
                <span className="text-[11px] font-normal text-mutedtext">Ganti via URL, Preset, atau Upload File</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="URL Gambar (misal: /images/banner1.jpg atau https://...)"
                  value={landingContent?.hero?.image_url || ''}
                  onChange={(e) => handleHeroChange('image_url', e.target.value)}
                  className="flex-1 h-11 px-3.5 rounded-xl border border-softborder bg-white text-xs font-medium text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />

                <label className="px-4 py-2.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preset Pilihan Cepat */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-mutedtext font-medium">Pilihan Preset:</span>
                <button
                  type="button"
                  onClick={() => handleHeroChange('image_url', '/images/banner1.jpg')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    landingContent?.hero?.image_url === '/images/banner1.jpg'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-darktext border-softborder hover:border-emerald-400'
                  }`}
                >
                  Banner 1 (Ruang Konseling & Konselor)
                </button>
                <button
                  type="button"
                  onClick={() => handleHeroChange('image_url', '/images/hero_counseling.jpg')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    landingContent?.hero?.image_url === '/images/hero_counseling.jpg'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-darktext border-softborder hover:border-emerald-400'
                  }`}
                >
                  Banner 2 (Sesi Konseling Privat)
                </button>
              </div>

              {/* Preview Gambar Banner */}
              {landingContent?.hero?.image_url && (
                <div className="pt-2">
                  <div className="w-full h-36 rounded-2xl overflow-hidden border border-softborder bg-gray-100 relative group">
                    <img
                      src={landingContent.hero.image_url}
                      alt="Preview Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      Preview Banner Aktif
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Kartu Layanan Mode Hero */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
              <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pengaturan Kartu Layanan Mode Cepat (Hero Section)</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mode Online */}
                <div className="space-y-2 p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Mode 1: Konseling Online</span>
                  <div>
                    <label className="block text-[11px] font-bold text-darktext mb-1">Judul Layanan Online</label>
                    <input
                      type="text"
                      value={landingContent?.hero?.online_card_title || ''}
                      onChange={(e) => handleHeroChange('online_card_title', e.target.value)}
                      placeholder="Konseling Online via Zoom"
                      className="w-full h-9 px-3 rounded-lg border border-softborder text-xs text-darktext"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-darktext mb-1">Deskripsi Layanan Online</label>
                    <textarea
                      rows={2}
                      value={landingContent?.hero?.online_card_desc || ''}
                      onChange={(e) => handleHeroChange('online_card_desc', e.target.value)}
                      placeholder="Sesi video privat dari mana saja..."
                      className="w-full p-2 rounded-lg border border-softborder text-xs text-darktext"
                    />
                  </div>
                </div>

                {/* Mode Offline */}
                <div className="space-y-2 p-3 bg-white rounded-xl border border-teal-100">
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">Mode 2: Konseling Tatap Muka</span>
                  <div>
                    <label className="block text-[11px] font-bold text-darktext mb-1">Judul Layanan Offline</label>
                    <input
                      type="text"
                      value={landingContent?.hero?.offline_card_title || ''}
                      onChange={(e) => handleHeroChange('offline_card_title', e.target.value)}
                      placeholder="Konseling Offline di Kampus"
                      className="w-full h-9 px-3 rounded-lg border border-softborder text-xs text-darktext"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-darktext mb-1">Deskripsi Layanan Offline</label>
                    <textarea
                      rows={2}
                      value={landingContent?.hero?.offline_card_desc || ''}
                      onChange={(e) => handleHeroChange('offline_card_desc', e.target.value)}
                      placeholder="Pertemuan tatap muka langsung di Ruang BK..."
                      className="w-full p-2 rounded-lg border border-softborder text-xs text-darktext"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Comprehensive Services Manager ("Manajemen Seluruh Layanan Konseling") */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Seluruh Layanan Bimbingan ({landingContent?.services?.items?.length || 0})</span>
                </h4>
                <p className="text-[11px] text-mutedtext mt-0.5">
                  Kelola nama layanan, deskripsi, kategori/tag, dan ikon yang ditampilkan pada website.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddService}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Layanan</span>
              </button>
            </div>

            <div className="space-y-3">
              {landingContent?.services?.items?.map((srv, idx) => (
                <div key={srv.id || idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nama Layanan (misal: Konseling Individu Online)"
                      value={srv.title}
                      onChange={(e) => handleServiceChange(idx, 'title', e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-bold text-darktext"
                    />
                    <input
                      type="text"
                      placeholder="Tag (misal: Online / Offline)"
                      value={srv.tag}
                      onChange={(e) => handleServiceChange(idx, 'tag', e.target.value)}
                      className="w-full sm:w-28 h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-medium text-darktext"
                    />
                    <select
                      value={srv.icon || 'Sparkles'}
                      onChange={(e) => handleServiceChange(idx, 'icon', e.target.value)}
                      className="w-full sm:w-32 h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-medium text-darktext"
                    >
                      <option value="Video">Icon: Video</option>
                      <option value="Building2">Icon: Building</option>
                      <option value="Sparkles">Icon: Sparkles</option>
                      <option value="Compass">Icon: Compass</option>
                      <option value="GraduationCap">Icon: Topi Wisuda</option>
                      <option value="Brain">Icon: Brain</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(idx)}
                      className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi penjelasan layanan..."
                    value={srv.desc}
                    onChange={(e) => handleServiceChange(idx, 'desc', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-softborder bg-white text-xs text-darktext"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Problem Topics ("Sedang Menghadapi Masalah Apa?") */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                <MessageSquareHeart className="w-4 h-4 text-emerald-600" />
                <span>Daftar Topik Permasalahan ({landingContent?.problems?.items?.length || 0})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddProblem}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Topik</span>
              </button>
            </div>

            <div className="space-y-3">
              {landingContent?.problems?.items?.map((prob, idx) => (
                <div key={prob.id || idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Judul Topik (misal: Akademik & Skripsi)"
                      value={prob.title}
                      onChange={(e) => handleProblemChange(idx, 'title', e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-bold text-darktext"
                    />
                    <input
                      type="text"
                      placeholder="Tag (misal: Akademik)"
                      value={prob.tag}
                      onChange={(e) => handleProblemChange(idx, 'tag', e.target.value)}
                      className="w-32 h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-medium text-darktext"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveProblem(idx)}
                      className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi masalah..."
                    value={prob.desc}
                    onChange={(e) => handleProblemChange(idx, 'desc', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-softborder bg-white text-xs text-darktext"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section: Manajemen Artikel & Wawasan Edukasi */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Manajemen Artikel & Edukasi ({landingContent?.articles?.items?.length || 0})</span>
                </h4>
                <p className="text-[11px] text-mutedtext mt-0.5">
                  Publikasikan tips akademik, edukasi kesehatan mental, dan panduan konseling untuk mahasiswa.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddArticle}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Artikel</span>
              </button>
            </div>

            <div className="space-y-3">
              {landingContent?.articles?.items?.map((art, idx) => (
                <div key={art.id || idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Judul Artikel..."
                      value={art.title}
                      onChange={(e) => handleArticleChange(idx, 'title', e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-bold text-darktext"
                    />
                    <input
                      type="text"
                      placeholder="Kategori (misal: Tips Akademik)"
                      value={art.category}
                      onChange={(e) => handleArticleChange(idx, 'category', e.target.value)}
                      className="w-full sm:w-36 h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-medium text-darktext"
                    />
                    <input
                      type="text"
                      placeholder="Waktu baca (misal: 3 min baca)"
                      value={art.read_time}
                      onChange={(e) => handleArticleChange(idx, 'read_time', e.target.value)}
                      className="w-full sm:w-28 h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-medium text-darktext"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArticle(idx)}
                      className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Penulis (misal: Tim Konselor UINSSC)"
                      value={art.author || ''}
                      onChange={(e) => handleArticleChange(idx, 'author', e.target.value)}
                      className="h-9 px-3 rounded-xl border border-softborder bg-white text-xs text-darktext"
                    />
                    <input
                      type="text"
                      placeholder="Tanggal (misal: 02 Sep 2026)"
                      value={art.date || ''}
                      onChange={(e) => handleArticleChange(idx, 'date', e.target.value)}
                      className="h-9 px-3 rounded-xl border border-softborder bg-white text-xs text-darktext"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-mutedtext uppercase mb-1">Ringkasan / Snippet</label>
                    <textarea
                      rows={2}
                      placeholder="Ringkasan singkat yang memikat..."
                      value={art.snippet || ''}
                      onChange={(e) => handleArticleChange(idx, 'snippet', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-softborder bg-white text-xs text-darktext"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-mutedtext uppercase mb-1">Isi Lengkap Artikel</label>
                    <textarea
                      rows={3}
                      placeholder="Tuliskan isi lengkap artikel di sini..."
                      value={art.content || ''}
                      onChange={(e) => handleArticleChange(idx, 'content', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-softborder bg-white text-xs text-darktext"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: FAQs */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Pertanyaan yang Sering Diajukan (FAQ) ({landingContent?.faqs?.length || 0})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddFaq}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah FAQ</span>
              </button>
            </div>

            <div className="space-y-3">
              {landingContent?.faqs?.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Pertanyaan..."
                      value={faq.question}
                      onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-bold text-darktext"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Jawaban penjelasan..."
                    value={faq.answer}
                    onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-softborder bg-white text-xs text-darktext"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Screening CTA Banner */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            <h4 className="text-sm font-bold text-darktext border-b border-gray-100 pb-2">
              Banner Ajakan Screening
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={landingContent?.screening_cta?.tag || ''}
                  onChange={(e) => handleScreeningCtaChange('tag', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Teks Tombol</label>
                <input
                  type="text"
                  value={landingContent?.screening_cta?.button_text || ''}
                  onChange={(e) => handleScreeningCtaChange('button_text', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Judul Banner</label>
              <input
                type="text"
                value={landingContent?.screening_cta?.title || ''}
                onChange={(e) => handleScreeningCtaChange('title', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs font-bold text-darktext"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Deskripsi Banner</label>
              <textarea
                rows={2}
                value={landingContent?.screening_cta?.desc || ''}
                onChange={(e) => handleScreeningCtaChange('desc', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext"
              />
            </div>
          </div>

          {/* Section: Pengaturan Footer & Kontak Resmi Kampus */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Footer & Informasi Kontak Kampus</span>
              </h4>
              <span className="text-[11px] text-mutedtext">Kustomisasi brand footer, kontak hotline, alamat kantor, dan copyright</span>
            </div>

            {/* 1. Profil & Brand Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Judul Brand Footer</label>
                <input
                  type="text"
                  value={landingContent?.footer?.brand_title ?? 'Ruang BK UIN Siber Syekh Nurjati Cirebon'}
                  onChange={(e) => handleFooterChange('brand_title', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs font-bold text-darktext focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Teks Lencana Bebas Biaya</label>
                <input
                  type="text"
                  value={landingContent?.footer?.badge_text ?? 'Layanan 100% Bebas Biaya bagi Seluruh Sivitas Akademika'}
                  onChange={(e) => handleFooterChange('badge_text', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs font-semibold text-emerald-800 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">Deskripsi Ruang BK (Tentang Kami di Footer)</label>
              <textarea
                rows={2}
                value={landingContent?.footer?.description ?? 'Pusat Layanan Bimbingan Konseling & Pendampingan Psikologis Mahasiswa. Menghadirkan ruang aman digital yang inklusif untuk bertumbuh, merawat kesehatan mental, dan mendukung keberhasilan studi siber.'}
                onChange={(e) => handleFooterChange('description', e.target.value)}
                className="w-full p-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
              />
            </div>

            {/* 2. Hotline Darurat Kampus */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
              <span className="text-xs font-bold text-amber-900 block">
                Hotline Darurat & Krisis Kampus
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-darktext mb-1">Judul Seksi Hotline</label>
                  <input
                    type="text"
                    value={landingContent?.footer?.hotline_title ?? 'Hotline Darurat Kampus'}
                    onChange={(e) => handleFooterChange('hotline_title', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-bold text-darktext"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-darktext mb-1">Nomor Telepon / Hotline</label>
                  <input
                    type="text"
                    value={landingContent?.footer?.hotline_number ?? '119 Ext 8 (Sejiwa Kemenkes)'}
                    onChange={(e) => handleFooterChange('hotline_number', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-mono font-bold text-amber-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-darktext mb-1">Keterangan Ajakan Hotline</label>
                  <input
                    type="text"
                    value={landingContent?.footer?.hotline_desc ?? 'Jika membutuhkan dukungan krisis psikologis segera:'}
                    onChange={(e) => handleFooterChange('hotline_desc', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-white text-xs text-darktext"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-darktext mb-1">Sub-keterangan Tim Siaga</label>
                  <input
                    type="text"
                    value={landingContent?.footer?.hotline_subtext ?? 'Atau hubungi Tim Siaga Konseling UINSSC (0812-3456-7890)'}
                    onChange={(e) => handleFooterChange('hotline_subtext', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-white text-xs text-darktext"
                  />
                </div>
              </div>
            </div>

            {/* 3. Lokasi Kantor & Email Resmi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Lokasi Kantor / Ruang BK Fisik</label>
                <input
                  type="text"
                  placeholder="Gedung Pusat Layanan Kemahasiswaan Lt. 2..."
                  value={landingContent?.footer?.office_location ?? 'Gedung Pusat Layanan Kemahasiswaan Lt. 2, Kampus Siber UINSSC'}
                  onChange={(e) => handleFooterChange('office_location', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Email Resmi BK Kampus</label>
                <input
                  type="email"
                  placeholder="konseling@syekhnurjati.ac.id"
                  value={landingContent?.footer?.contact_email ?? 'bk-online@syekhnurjati.ac.id'}
                  onChange={(e) => handleFooterChange('contact_email', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
                />
              </div>
            </div>

            {/* 4. Hak Cipta & Kerahasiaan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Teks Hak Cipta (Copyright)</label>
                <input
                  type="text"
                  value={landingContent?.footer?.copyright ?? `© ${new Date().getFullYear()} UIN Siber Syekh Nurjati Cirebon (UINSSC). Hak Cipta Dilindungi.`}
                  onChange={(e) => handleFooterChange('copyright', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">Pernyataan Etika Kerahasiaan Data</label>
                <input
                  type="text"
                  value={landingContent?.footer?.confidentiality_notice ?? 'Kerahasiaan data bimbingan konseling dijamin kode etik profesional.'}
                  onChange={(e) => handleFooterChange('confidentiality_notice', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
                />
              </div>
            </div>

            {/* 5. Tautan Cepat Footer */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-darktext">
                    Daftar Tautan Cepat Footer ({landingContent?.footer?.quick_links?.length || 0})
                  </label>
                  <p className="text-[11px] text-mutedtext">Link navigasi cepat pada kolom footer</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFooterQuickLink}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Tautan</span>
                </button>
              </div>

              <div className="space-y-2">
                {(landingContent?.footer?.quick_links || [
                  { label: 'Pilihan Layanan', href: '#layanan' },
                  { label: 'Topik Bimbingan', href: '#masalah' },
                  { label: 'Artikel Edukasi', href: '#artikel' },
                  { label: 'Daftar Konselor', href: '#konselor' },
                  { label: 'Masuk Akun', href: '/login' },
                ]).map((link, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-3"
                  >
                    <span className="w-6 h-6 rounded-lg bg-white text-mutedtext font-mono text-[11px] font-bold flex items-center justify-center border border-gray-200 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Label Tautan"
                        value={link.label}
                        onChange={(e) => handleFooterQuickLinkChange(idx, 'label', e.target.value)}
                        className="h-9 px-3 rounded-xl border border-softborder bg-white text-xs font-semibold text-darktext"
                      />
                      <input
                        type="text"
                        placeholder="URL Tautan"
                        value={link.href}
                        onChange={(e) => handleFooterQuickLinkChange(idx, 'href', e.target.value)}
                        className="h-9 px-3 rounded-xl border border-softborder bg-white text-xs font-mono text-mutedtext"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFooterQuickLink(idx)}
                      className="w-8 h-8 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0 transition-colors"
                      title="Hapus Tautan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Save CTA */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={isSavingCms}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[48px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSavingCms ? 'Menyimpan Perubahan...' : 'Simpan Seluruh Perubahan Landing Page'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
          <h3 className="text-sm font-bold text-darktext">Audit Logs Keamanan & Aktivitas Sensitif</h3>
          <p className="text-xs text-mutedtext">
            Merekam akses data sensitif, login, submit screening, dan pembuatan catatan konseling.
          </p>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-800 capitalize">{log.action}</span>
                    <span className="text-mutedtext">oleh {log.user?.name || 'Anonim'} ({log.user?.role || 'Guest'})</span>
                  </div>
                  <span className="text-[10px] text-mutedtext font-mono">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </span>
                </div>

                {log.ip_address && (
                  <div className="text-[10px] text-mutedtext font-mono">
                    IP: {log.ip_address} {log.entity_type ? `• Target: ${log.entity_type} #${log.entity_id}` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Settings Tab */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5 max-w-xl"
        >
          <h3 className="text-sm font-bold text-darktext border-b border-gray-100 pb-2">
            Konfigurasi Sistem Bimbingan Konseling
          </h3>

          <div>
            <label className="block text-xs font-bold text-darktext mb-1">
              Mode Penugasan Tutor (Tutor Assignment Mode)
            </label>
            <select
              value={settings.tutor_assignment_mode}
              onChange={(e) =>
                setSettings({ ...settings, tutor_assignment_mode: e.target.value })
              }
              className="w-full h-11 px-3 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="student_select">Mahasiswa Memilih Tutor (student_select)</option>
              <option value="manual">Manual oleh Admin (manual)</option>
              <option value="automatic">Otomatis Berdasarkan Ketersediaan (automatic)</option>
            </select>
            <span className="text-[11px] text-mutedtext mt-1 block">
              Menentukan bagaimana tutor diasosiasikan dengan kasus konseling baru.
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <h4 className="text-xs font-bold text-darktext">Deteksi Crisis Flag Otomatis</h4>
              <p className="text-[11px] text-mutedtext">Tandai screening berisiko tinggi untuk evaluasi segera.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.crisis_flag_enabled}
              onChange={(e) =>
                setSettings({ ...settings, crisis_flag_enabled: e.target.checked })
              }
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <h4 className="text-xs font-bold text-darktext">Zoom SDK Mock Mode (Development)</h4>
              <p className="text-[11px] text-mutedtext">
                Simulasi panggilan video interaktif tanpa memblokir testing lokal.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.zoom_mock_mode}
              onChange={(e) =>
                setSettings({ ...settings, zoom_mock_mode: e.target.checked })
              }
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingSettings}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            <span>{isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </form>
      )}

      {/* WordPress-like Article Editor Modal */}
      {isArticleModalOpen && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-darktext">
                    {editingArticle.id && !editingArticle.title ? 'Tulis Artikel Baru' : 'Sunting Artikel'}
                  </h3>
                  <p className="text-[11px] text-mutedtext">Editor publikasi artikel kesehatan mental kampus (ala WordPress)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsArticleModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-mutedtext hover:text-darktext hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Form */}
            <form onSubmit={handleSaveArticleModal} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Judul Artikel */}
              <div>
                <label className="block text-xs font-bold text-darktext mb-1.5">
                  Judul Artikel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 5 Trik Mengatasi Burnout & Prokrastinasi Skripsi..."
                  value={editingArticle.title || ''}
                  onChange={(e) => handleArticleFieldChange('title', e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs sm:text-sm font-bold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Gambar Utama (Featured Image) */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <label className="block text-xs font-bold text-darktext flex items-center justify-between">
                  <span>Gambar Utama Artikel (Featured Image)</span>
                  <span className="text-[11px] font-normal text-mutedtext">Upload dari komputer atau pilih preset</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="URL Gambar (misal: /images/banner1.jpg atau https://...)"
                    value={editingArticle.image_url || ''}
                    onChange={(e) => handleArticleFieldChange('image_url', e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-softborder bg-white text-xs text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />

                  <label className="px-4 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleArticleFeaturedImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preset Gambar Cepat */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-mutedtext font-medium">Pilihan Preset:</span>
                  <button
                    type="button"
                    onClick={() => handleArticleFieldChange('image_url', '/images/banner1.jpg')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      editingArticle.image_url === '/images/banner1.jpg'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-darktext border-softborder hover:border-emerald-300'
                    }`}
                  >
                    Foto Ruang Konseling (banner1.jpg)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArticleFieldChange('image_url', '/images/hero_counseling.jpg')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      editingArticle.image_url === '/images/hero_counseling.jpg'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-darktext border-softborder hover:border-emerald-300'
                    }`}
                  >
                    Foto Sesi Privat (hero_counseling.jpg)
                  </button>
                </div>

                {/* Live Preview Box */}
                {editingArticle.image_url && (
                  <div className="pt-2">
                    <div className="w-full h-40 rounded-xl overflow-hidden border border-softborder bg-gray-100 relative group">
                      <img
                        src={editingArticle.image_url}
                        alt="Preview Featured Image"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                        Preview Gambar Utama Artikel
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2 Kolom: Kategori & Waktu Baca */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1">Kategori Artikel</label>
                  <input
                    type="text"
                    placeholder="misal: Tips Akademik, Kesehatan Mental..."
                    value={editingArticle.category || ''}
                    onChange={(e) => handleArticleFieldChange('category', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1">Estimasi Waktu Baca</label>
                  <input
                    type="text"
                    placeholder="misal: 3 min baca"
                    value={editingArticle.read_time || ''}
                    onChange={(e) => handleArticleFieldChange('read_time', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* 2 Kolom: Penulis & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1">Penulis</label>
                  <input
                    type="text"
                    placeholder="misal: Tim Konselor UINSSC"
                    value={editingArticle.author || ''}
                    onChange={(e) => handleArticleFieldChange('author', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1">Tanggal Publikasi</label>
                  <input
                    type="text"
                    placeholder="misal: 03 Sep 2026"
                    value={editingArticle.date || ''}
                    onChange={(e) => handleArticleFieldChange('date', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Ringkasan / Excerpt */}
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Ringkasan Singkat (Excerpt)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan pemikat pembaca untuk tampil di kartu artikel..."
                  value={editingArticle.snippet || ''}
                  onChange={(e) => handleArticleFieldChange('snippet', e.target.value)}
                  className="w-full p-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none"
                />
              </div>

              {/* Isi Lengkap Artikel */}
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Isi Lengkap Artikel (Konten Utama)
                </label>
                <textarea
                  rows={6}
                  placeholder="Tuliskan isi pembahasan edukasi psikologi lengkap di sini..."
                  value={editingArticle.content || ''}
                  onChange={(e) => handleArticleFieldChange('content', e.target.value)}
                  className="w-full p-3 rounded-xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-mutedtext hover:text-darktext hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft-sm flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Publikasikan Artikel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Artikel */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col">
            {previewArticle.image_url && (
              <div className="w-full h-52 sm:h-60 overflow-hidden bg-gray-100 relative shrink-0">
                <img
                  src={previewArticle.image_url}
                  alt={previewArticle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <button
                  type="button"
                  onClick={() => setPreviewArticle(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition-colors backdrop-blur-xs"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600/90 text-white backdrop-blur-xs uppercase tracking-wider">
                    {previewArticle.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black mt-2 leading-snug drop-shadow-sm">
                    {previewArticle.title}
                  </h3>
                </div>
              </div>
            )}

            <div className="p-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4 bg-emerald-50/40">
              <div>
                {!previewArticle.image_url && (
                  <h3 className="text-lg sm:text-xl font-black text-darktext leading-snug mb-2">
                    {previewArticle.title}
                  </h3>
                )}
                <div className="flex items-center gap-2 text-xs text-mutedtext">
                  <span className="font-semibold text-emerald-800">{previewArticle.author}</span>
                  <span>•</span>
                  <span>{previewArticle.date}</span>
                  <span>•</span>
                  <span>{previewArticle.read_time}</span>
                </div>
              </div>

              {!previewArticle.image_url && (
                <button
                  type="button"
                  onClick={() => setPreviewArticle(null)}
                  className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-mutedtext hover:text-darktext hover:bg-gray-100 flex items-center justify-center shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-darktext/90 leading-relaxed">
              <p className="font-medium text-emerald-950 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
                {previewArticle.snippet}
              </p>
              <div className="whitespace-pre-line space-y-3">
                {previewArticle.content}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-mutedtext">Pratinjau tampilan artikel untuk mahasiswa</span>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-xs font-bold text-darktext"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default AdminDashboard;
