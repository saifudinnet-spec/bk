import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
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
  EyeOff,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Clock,
  Calendar,
  X,
  FileText,
  Check,
  Globe,
  SlidersHorizontal,
  Mail,
  Phone,
  MapPin,
  Megaphone,
  Bell,
  Info,
  ArrowRight,
  UserCheck,
  UserX,
  HeartHandshake,
  Filter,
  ChevronRight,
  Code,
  Mic,
  Zap
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import StatCard from '../../components/cards/StatCard';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';
import NaraVoiceManager from '../../components/admin/NaraVoiceManager';

export const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({
    // Web CMS Settings
    site_title: 'Ruang BK - Layanan Bimbingan & Konseling Kampus',
    site_tagline: 'Ruang Aman untuk Tumbuh dan Bercerita',
    site_meta_description: 'Layanan bimbingan dan konseling online & offline terpadu untuk civitas akademika.',
    site_meta_keywords: 'konseling online, bimbingan mahasiswa, kesehatan mental, konselor kampus',
    contact_email: 'bk@kampus.ac.id',
    contact_whatsapp: '+62 812-3456-7890',
    campus_address: 'Gedung Pusat Kegiatan Mahasiswa Lt. 2, Kampus Terpadu',
    operating_hours: 'Senin - Jumat, 08:00 - 16:00 WIB',
    announcement_bar_enabled: false,
    announcement_text: 'Layanan Konseling Tatap Muka & Online tetap beroperasi penuh.',

    // BK Online Application Settings
    default_session_duration: 60,
    max_active_sessions_per_student: 2,
    cancellation_buffer_hours: 6,
    auto_approve_counseling: false,
    tutor_assignment_mode: 'student_select',
    crisis_flag_enabled: true,
    crisis_alert_email: 'crisis-center@kampus.ac.id',
    reminder_notifications_enabled: true,

    // Zoom Server-to-Server OAuth & Permanent Link
    zoom_mock_mode: true,
    zoom_account_id: '',
    zoom_client_id: '',
    zoom_client_secret: '',
    zoom_client_secret_masked: '',
    zoom_has_client_secret: false,
    zoom_host_email: '',
    zoom_is_configured: false,
    zoom_permanent_meeting_url: '',
    zoom_permanent_meeting_id: '',
    zoom_permanent_meeting_password: '',
  });
  const [isTestingZoom, setIsTestingZoom] = useState(false);
  const [zoomTestResult, setZoomTestResult] = useState(null);
  const [showZoomSecret, setShowZoomSecret] = useState(false);
  const [showZoomGuide, setShowZoomGuide] = useState(false);

  // CMS Landing Content State
  const [landingContent, setLandingContent] = useState(null);
  const [isSavingCms, setIsSavingCms] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Article Manager State (WordPress Sederhana)
  const [editingArticle, setEditingArticle] = useState(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState('all');
  const [previewArticle, setPreviewArticle] = useState(null);
  const [articleEditorMode, setArticleEditorMode] = useState('text'); // 'text' | 'html' | 'preview'

  // User Management State (Filter Peran, Tab Konseli/Konselor/Admin, Sub-Filter, Pencarian, Modal)
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // 'ALL' | 'COUNSELEE' | 'TUTOR' | 'ADMIN'
  const [counseleeSubFilter, setCounseleeSubFilter] = useState('ALL'); // 'ALL' | 'STUDENT' | 'GENERAL'
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL'); // 'ALL' | 'active' | 'inactive'
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Active tab driven exclusively from URL search params or route path
  const getActiveTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'settings') return 'counseling_settings';
      return tabParam;
    }
    if (location.pathname.includes('/admin/users')) return 'users';
    if (location.pathname.includes('/admin/audit-logs')) return 'audit';
    if (location.pathname.includes('/admin/settings')) return 'counseling_settings';
    return 'overview';
  };

  const activeTab = getActiveTab();
  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Priority load: Dashboard Overview statistics & System Settings in parallel
      const [dashRes, settingsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/settings').catch(() => null),
      ]);
      setData(dashRes);
      if (settingsRes) {
        setSettings((prev) => ({
          ...prev,
          ...settingsRes,
          default_session_duration: Number(settingsRes.default_session_duration || 60),
          max_active_sessions_per_student: Number(settingsRes.max_active_sessions_per_student || 2),
          cancellation_buffer_hours: Number(settingsRes.cancellation_buffer_hours || 6),
          auto_approve_counseling: Boolean(settingsRes.auto_approve_counseling),
          crisis_flag_enabled: Boolean(settingsRes.crisis_flag_enabled),
          reminder_notifications_enabled: Boolean(settingsRes.reminder_notifications_enabled),
          announcement_bar_enabled: Boolean(settingsRes.announcement_bar_enabled),
          zoom_mock_mode: settingsRes.zoom_mock_mode === true || settingsRes.zoom_mock_mode === 'true',
          zoom_is_configured: Boolean(settingsRes.zoom_is_configured),
        }));
      }
      setIsLoading(false);

      // 2. Preload remaining datasets asynchronously in the background
      api.get('/landing-content').then((res) => {
        if (res.data) setLandingContent(res.data);
      }).catch(() => {});

      api.get('/admin/users?per_page=100').then((res) => {
        setUsers(res.data || []);
      }).catch(() => {});

      api.get('/admin/audit-logs').then((res) => {
        setAuditLogs(res.data || []);
      }).catch(() => {});
    } catch (err) {
      showError('Gagal memuat data administrasi.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reloadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get('/admin/users?per_page=100');
      setUsers(res.data || []);
      showSuccess('Data pengguna berhasil diperbarui.');
    } catch (err) {
      showError('Gagal memuat ulang data pengguna.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-status`);
      showSuccess(res.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: res.user.status } : u))
      );
      if (selectedUserDetail?.id === userId) {
        setSelectedUserDetail((prev) => ({ ...prev, status: res.user.status }));
      }
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

  const [isStartingInstantZoom, setIsStartingInstantZoom] = useState(false);

  const handleStartInstantZoomSession = async () => {
    setIsStartingInstantZoom(true);
    try {
      const res = await api.post('/sessions/instant', { method: 'ZOOM' });
      const sessionData = res.data?.data || res.data;
      showSuccess('Sesi simulasi Zoom langsung aktif! Mengalihkan ke ruang konseling...');
      navigate(`/counseling/session/${sessionData.id}`);
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal memulai simulasi sesi Zoom.');
    } finally {
      setIsStartingInstantZoom(false);
    }
  };

  const handleAutoFillPmi = (customUrl, customId) => {
    const pmiUrl = customUrl || zoomTestResult?.data?.personal_meeting_url || 'https://us06web.zoom.us/j/3404109926?pwd=DL7dEt2btM2sQUcOA7o3AEhF7VajJr.1';
    const pmiId = customId || zoomTestResult?.data?.pmi || '3404109926';
    setSettings((prev) => ({
      ...prev,
      zoom_permanent_meeting_url: pmiUrl,
      zoom_permanent_meeting_id: pmiId,
      zoom_permanent_meeting_password: 'Tersemat di link (?pwd=...)',
    }));
    showSuccess('Tautan Personal Room akun Pasca UINSSC berhasil disinkronkan!');
  };

  const handleTestZoomConnection = async () => {
    setIsTestingZoom(true);
    setZoomTestResult(null);
    try {
      const res = await api.post('/admin/zoom/test-connection', {
        zoom_account_id: settings.zoom_account_id,
        zoom_client_id: settings.zoom_client_id,
        zoom_client_secret: settings.zoom_client_secret || undefined,
        zoom_host_email: settings.zoom_host_email,
      });
      setZoomTestResult(res);
      if (res.success) {
        showSuccess('Koneksi ke Akun Zoom berhasil terverifikasi!');
        if (res.data?.personal_meeting_url) {
          setSettings((prev) => ({
            ...prev,
            zoom_permanent_meeting_url: res.data.personal_meeting_url,
            zoom_permanent_meeting_id: res.data.pmi || prev.zoom_permanent_meeting_id,
          }));
        }
      } else {
        showError(res.message || 'Koneksi ke Zoom gagal.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghubungi server Zoom.';
      setZoomTestResult({ success: false, message: msg });
      showError(msg);
    } finally {
      setIsTestingZoom(false);
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

  const handleBannerFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showError('Ukuran gambar maksimal 10MB.');
      return;
    }

    setIsUploadingBanner(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      showSuccess('Mengunggah gambar ke server...');
      const res = await api.post('/admin/landing-content/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res?.url) {
        handleHeroChange('image_url', res.url);
        showSuccess('Foto banner berhasil diunggah & disimpan!');
      } else {
        showError('Gagal mendapatkan URL foto dari server.');
      }
    } catch (err) {
      console.error('Upload banner error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Gagal mengunggah foto ke server.';
      showError(msg);
    } finally {
      setIsUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleClearBannerImage = () => {
    handleHeroChange('image_url', '');
    showSuccess('Foto banner telah dihapus. Silakan upload foto lain atau pilih preset.');
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
    setArticleEditorMode('text');
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (art) => {
    setEditingArticle({ ...art });
    // If article content contains HTML tags, auto-select 'html' mode
    if (art.content && /<\/?[a-z][\s\S]*>/i.test(art.content)) {
      setArticleEditorMode('html');
    } else {
      setArticleEditorMode('text');
    }
    setIsArticleModalOpen(true);
  };

  const handleInsertHtmlTag = (openTag, closeTag = '') => {
    const textarea = document.getElementById('article-content-textarea');
    if (!textarea) {
      setEditingArticle((prev) => ({
        ...prev,
        content: (prev?.content || '') + openTag + closeTag,
      }));
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentText = editingArticle?.content || '';
    const selectedText = currentText.substring(start, end);

    const replacement = openTag + selectedText + closeTag;
    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);

    setEditingArticle((prev) => ({
      ...prev,
      content: newContent,
    }));

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText ? start + replacement.length : start + openTag.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
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

  const getSectionInfo = (tab) => {
    switch (tab) {
      case 'overview':
        return {
          badge: 'Dashboard Utama',
          title: 'Ringkasan & Analitik Operasional',
          desc: 'Statistik real-time, antrean kasus konseling aktif, dan ringkasan aktivitas sistem.'
        };
      case 'users':
        return {
          badge: 'Manajemen Pengguna',
          title: 'Data & Hak Akses Pengguna',
          desc: 'Kelola akun mahasiswa, pengguna umum, konselor/tutor, dan administrator.'
        };
      case 'articles':
        return {
          badge: 'CMS Artikel',
          title: 'Kelola Artikel & Edukasi Psikologi',
          desc: 'Tulis, sunting, dan publikasikan materi edukasi kesehatan mental untuk mahasiswa.'
        };
      case 'cms':
        return {
          badge: 'CMS Landing Page',
          title: 'Editor Konten Website Publik',
          desc: 'Kustomisasi tampilan hero banner, topik bimbingan, layanan, FAQ, dan footer website.'
        };
      case 'web_settings':
        return {
          badge: 'Pengaturan Web',
          title: 'Identitas, SEO & Kontak Website',
          desc: 'Konfigurasi judul portal, deskripsi Google SERP, hotline WhatsApp, dan banner pengumuman atas.'
        };
      case 'counseling_settings':
        return {
          badge: 'Aplikasi BK Online',
          title: 'Aturan & Operasional Konseling',
          desc: 'Konfigurasi durasi konseling, batas kuota mahasiswa, alur persetujuan, dan penugasan tutor.'
        };
      case 'zoom_settings':
        return {
          badge: 'Integrasi Eksternal',
          title: 'Integrasi Akun Zoom Meeting (Server-to-Server OAuth)',
          desc: 'Sinkronisasi otomatis pembuatan link video call konseling ke kalender akun Zoom resmi.'
        };
      case 'voice':
        return {
          badge: 'Asisten Virtual Nara',
          title: 'Rekaman Suara Asisten Nara 🎙️',
          desc: 'Manajemen file rekaman suara sambutan, panduan skrining, dan afirmasi Nara.'
        };
      case 'crisis_settings':
        return {
          badge: 'Keselamatan & Darurat',
          title: 'Deteksi Krisis & Skrining Mental',
          desc: 'Protokol deteksi otomatis risiko tinggi dan notifikasi darurat penanganan krisis kampus.'
        };
      case 'audit':
        return {
          badge: 'Keamanan Sistem',
          title: 'Audit Logs & Jejak Aktivitas',
          desc: 'Riwayat aktivitas sensitif, perubahan status akun, dan rekaman akses data konseling.'
        };
      case 'general_settings':
        return {
          badge: 'Konfigurasi Sistem',
          title: 'Pengaturan Umum & Status Server',
          desc: 'Status environment aplikasi, database, dan pembersihan cache sistem.'
        };
      default:
        return {
          badge: 'Admin Panel',
          title: 'Panel Administrasi BK',
          desc: 'Tata kelola sistem bimbingan konseling dan konten web.'
        };
    }
  };

  const currentSection = getSectionInfo(activeTab);

  // User Counts by Role & Status
  const userCounts = {
    all: users.length,
    counselee: users.filter((u) => u.role === 'STUDENT' || u.role === 'GENERAL').length,
    student: users.filter((u) => u.role === 'STUDENT').length,
    general: users.filter((u) => u.role === 'GENERAL').length,
    tutor: users.filter((u) => u.role === 'TUTOR').length,
    admin: users.filter((u) => u.role === 'ADMIN').length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status !== 'active').length,
  };

  // Filtered Users List based on Tab, Sub-filter, Status, and Search Query
  const filteredUsers = users.filter((u) => {
    // 1. Role Filter Tab
    if (userRoleFilter === 'COUNSELEE') {
      if (u.role !== 'STUDENT' && u.role !== 'GENERAL') return false;
      if (counseleeSubFilter === 'STUDENT' && u.role !== 'STUDENT') return false;
      if (counseleeSubFilter === 'GENERAL' && u.role !== 'GENERAL') return false;
    } else if (userRoleFilter === 'TUTOR') {
      if (u.role !== 'TUTOR') return false;
    } else if (userRoleFilter === 'ADMIN') {
      if (u.role !== 'ADMIN') return false;
    }

    // 2. Status Filter
    if (userStatusFilter !== 'ALL' && u.status !== userStatusFilter) {
      return false;
    }

    // 3. Search Query (name, email, phone, NIM, NIK, NIP, prodi, specialization)
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      const phoneMatch = u.phone?.toLowerCase().includes(q);
      const nimMatch = u.student_profile?.nim?.toLowerCase().includes(q);
      const prodiMatch = u.student_profile?.program_study?.toLowerCase().includes(q);
      const nikMatch = u.general_profile?.nik?.toLowerCase().includes(q);
      const nipMatch = u.tutor_profile?.nip?.toLowerCase().includes(q);
      const specMatch = u.tutor_profile?.specialization?.toLowerCase().includes(q);

      return nameMatch || emailMatch || phoneMatch || nimMatch || prodiMatch || nikMatch || nipMatch || specMatch;
    }

    return true;
  });

  return (
    <PageTransition className="space-y-6">
      {/* Top Section Header (All navigation is in the Left Sidebar - No top tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-softborder">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              {currentSection.badge}
            </span>
            <h2 className="text-xl font-black text-darktext tracking-tight">
              {currentSection.title}
            </h2>
          </div>
          <p className="text-xs text-mutedtext mt-1">
            {currentSection.desc}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-2xl bg-white border border-softborder text-xs font-bold text-slate-700 hover:text-darktext hover:bg-slate-50 shadow-soft-xs flex items-center gap-2 transition-all min-h-[38px]"
            title="Segarkan Seluruh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Admin Control Center Hero Banner */}
          <div className="relative overflow-hidden p-6 md:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white shadow-soft-md border border-emerald-900/30">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Control Center Ruang BK</span>
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  Dashboard Administrasi & Operasional Kampus
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pantau metrik kasus konseling mahasiswa, kelola akun pengguna & konselor, integrasi Zoom Meeting, dan kepatuhan audit sistem secara terpusat.
                </p>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('users');
                    setUserRoleFilter('ALL');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center justify-between gap-3 min-w-[170px]"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span>Kelola Pengguna</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('zoom_settings')}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center justify-between gap-3 min-w-[170px]"
                >
                  <span className="flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-sky-400" />
                    <span>Integrasi Zoom</span>
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${settings.zoom_is_configured ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'}`}>
                    {settings.zoom_is_configured ? 'Siap' : 'Setup'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('articles')}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center justify-between gap-3 min-w-[170px]"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                    <span>Artikel Edukasi</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Glowing background orbs */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* 4 Colored Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={GraduationCap}
              label="Konseli Mahasiswa"
              value={stats.total_students || 0}
              subtext="Akun kampus terverifikasi"
              color="emerald"
              badge="Kampus"
              onClick={() => {
                setActiveTab('users');
                setUserRoleFilter('COUNSELEE');
                setCounseleeSubFilter('STUDENT');
              }}
            />
            <StatCard
              icon={Globe}
              label="Klien Masyarakat"
              value={stats.total_general || 0}
              subtext="Terdaftar NIK resmi"
              color="purple"
              badge="Umum"
              onClick={() => {
                setActiveTab('users');
                setUserRoleFilter('COUNSELEE');
                setCounseleeSubFilter('GENERAL');
              }}
            />
            <StatCard
              icon={FolderHeart}
              label="Kasus Konseling Aktif"
              value={stats.active_cases || 0}
              subtext="Sedang dalam pendampingan"
              color="indigo"
              badge="Berjalan"
            />
            <StatCard
              icon={ShieldAlert}
              label="Deteksi Krisis"
              value={stats.crisis_flag_count || 0}
              subtext="Prioritas penanganan konselor"
              color="rose"
              badge={stats.crisis_flag_count > 0 ? 'Perhatian' : 'Aman'}
              onClick={() => setActiveTab('crisis_settings')}
            />
          </div>

          {/* Recent Audit Logs Snapshot */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-darktext flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Aktivitas Sistem Terkini (Audit)
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Lihat Seluruh Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {data?.recent_logs?.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-gray-50/80 hover:bg-gray-50 border border-gray-100 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span className="font-bold text-darktext capitalize px-2 py-0.5 rounded-lg bg-white border border-gray-200">
                      {log.action}
                    </span>
                    <span className="text-mutedtext">oleh <strong className="text-darktext">{log.user?.name || 'Sistem'}</strong></span>
                  </div>
                  <span className="text-[10px] text-mutedtext font-mono bg-white px-2 py-0.5 rounded-md border border-gray-100">
                    {new Date(log.created_at).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Users Tab (Kelola Pengguna: Konseli Mahasiswa & Umum, Konselor/Tutor, Administrator) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => setUserRoleFilter('ALL')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                userRoleFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                  : 'bg-white text-darktext border-softborder hover:border-gray-300 shadow-soft-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${userRoleFilter === 'ALL' ? 'text-gray-300' : 'text-mutedtext'}`}>
                  Semua Pengguna
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${userRoleFilter === 'ALL' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black">
                {userCounts.all}
              </div>
              <p className={`text-[10px] mt-1 ${userRoleFilter === 'ALL' ? 'text-gray-400' : 'text-mutedtext'}`}>
                {userCounts.active} aktif • {userCounts.inactive} non-aktif
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setUserRoleFilter('COUNSELEE');
                setCounseleeSubFilter('ALL');
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                userRoleFilter === 'COUNSELEE'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20'
                  : 'bg-white text-darktext border-softborder hover:border-indigo-200 shadow-soft-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${userRoleFilter === 'COUNSELEE' ? 'text-indigo-100' : 'text-indigo-700'}`}>
                  Konseli / Klien
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${userRoleFilter === 'COUNSELEE' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'}`}>
                  <HeartHandshake className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black">
                {userCounts.counselee}
              </div>
              <p className={`text-[10px] mt-1 ${userRoleFilter === 'COUNSELEE' ? 'text-indigo-200' : 'text-mutedtext'}`}>
                {userCounts.student} Mahasiswa • {userCounts.general} Umum
              </p>
            </button>

            <button
              type="button"
              onClick={() => setUserRoleFilter('TUTOR')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                userRoleFilter === 'TUTOR'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
                  : 'bg-white text-darktext border-softborder hover:border-emerald-200 shadow-soft-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${userRoleFilter === 'TUTOR' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  Konselor / Tutor
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${userRoleFilter === 'TUTOR' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black">
                {userCounts.tutor}
              </div>
              <p className={`text-[10px] mt-1 ${userRoleFilter === 'TUTOR' ? 'text-emerald-200' : 'text-mutedtext'}`}>
                Konselor & praktisi aktif
              </p>
            </button>

            <button
              type="button"
              onClick={() => setUserRoleFilter('ADMIN')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                userRoleFilter === 'ADMIN'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/20'
                  : 'bg-white text-darktext border-softborder hover:border-amber-200 shadow-soft-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${userRoleFilter === 'ADMIN' ? 'text-amber-100' : 'text-amber-700'}`}>
                  Administrator
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${userRoleFilter === 'ADMIN' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black">
                {userCounts.admin}
              </div>
              <p className={`text-[10px] mt-1 ${userRoleFilter === 'ADMIN' ? 'text-amber-200' : 'text-mutedtext'}`}>
                Akses kelola sistem & audit
              </p>
            </button>
          </div>

          {/* Main Controls Card */}
          <div className="p-5 md:p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            {/* Role Filter Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-softborder">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100/90 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    userRoleFilter === 'ALL'
                      ? 'bg-white text-darktext shadow-sm'
                      : 'text-mutedtext hover:text-darktext hover:bg-white/40'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Semua Pengguna
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-darktext">
                    {userCounts.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserRoleFilter('COUNSELEE');
                    setCounseleeSubFilter('ALL');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    userRoleFilter === 'COUNSELEE'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-mutedtext hover:text-indigo-700 hover:bg-white/40'
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  Konseli / Klien (Mhs & Umum)
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {userCounts.counselee}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserRoleFilter('TUTOR')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    userRoleFilter === 'TUTOR'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-mutedtext hover:text-emerald-700 hover:bg-white/40'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Konselor / Tutor
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {userCounts.tutor}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserRoleFilter('ADMIN')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    userRoleFilter === 'ADMIN'
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-mutedtext hover:text-amber-700 hover:bg-white/40'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Administrator
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {userCounts.admin}
                  </span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={reloadUsers}
                disabled={isLoadingUsers}
                className="px-3.5 py-2 rounded-xl border border-softborder hover:bg-gray-50 text-xs font-semibold text-mutedtext hover:text-darktext transition-colors flex items-center gap-2 self-start md:self-auto shrink-0"
                title="Segarkan daftar pengguna"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin text-emerald-700' : ''}`} />
                {isLoadingUsers ? 'Menyegarkan...' : 'Segarkan Data'}
              </button>
            </div>

            {/* Sub-filter Chips for Konseli (Only visible when Konseli / Klien tab is active) */}
            {userRoleFilter === 'COUNSELEE' && (
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                <span className="text-xs font-semibold text-mutedtext flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Kategori Konseli:
                </span>
                <button
                  type="button"
                  onClick={() => setCounseleeSubFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    counseleeSubFilter === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  Semua Konseli ({userCounts.counselee})
                </button>
                <button
                  type="button"
                  onClick={() => setCounseleeSubFilter('STUDENT')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    counseleeSubFilter === 'STUDENT'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  🎓 Mahasiswa Kampus ({userCounts.student})
                </button>
                <button
                  type="button"
                  onClick={() => setCounseleeSubFilter('GENERAL')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    counseleeSubFilter === 'GENERAL'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  🌐 Masyarakat Umum ({userCounts.general})
                </button>
              </div>
            )}

            {/* Search and Status Filter Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Field */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama, email, no HP, NIM, NIK, program studi, atau spesialisasi..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-softborder text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => setUserSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-mutedtext hover:text-darktext"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Dropdown Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-softborder text-xs font-semibold text-darktext bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="active">🟢 Hanya Aktif ({userCounts.active})</option>
                  <option value="inactive">🔴 Hanya Non-aktif ({userCounts.inactive})</option>
                </select>

                {(userSearch || userStatusFilter !== 'ALL' || userRoleFilter !== 'ALL' || counseleeSubFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearch('');
                      setUserStatusFilter('ALL');
                      setUserRoleFilter('ALL');
                      setCounseleeSubFilter('ALL');
                    }}
                    className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-colors"
                    title="Reset semua filter"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Status Information Bar */}
            <div className="flex items-center justify-between text-xs text-mutedtext pt-1">
              <span>
                Menampilkan <strong className="text-darktext">{filteredUsers.length}</strong> dari {users.length} pengguna
              </span>
              {userRoleFilter !== 'ALL' && (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Filter: {userRoleFilter === 'COUNSELEE' ? 'Konseli / Klien' : userRoleFilter === 'TUTOR' ? 'Konselor / Tutor' : 'Administrator'}
                </span>
              )}
            </div>

            {/* Users List Cards */}
            <div className="space-y-3 pt-1">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-softborder bg-gray-50/50 space-y-2">
                  <Users className="w-8 h-8 text-mutedtext mx-auto" />
                  <p className="text-xs font-bold text-darktext">Tidak ada pengguna yang cocok</p>
                  <p className="text-[11px] text-mutedtext">
                    Coba sesuaikan kata kunci pencarian atau ubah filter peran/status di atas.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearch('');
                      setUserStatusFilter('ALL');
                      setUserRoleFilter('ALL');
                      setCounseleeSubFilter('ALL');
                    }}
                    className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Tampilkan Semua Pengguna
                  </button>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isStudent = u.role === 'STUDENT';
                  const isGeneral = u.role === 'GENERAL';
                  const isTutor = u.role === 'TUTOR';
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <div
                      key={u.id}
                      className="p-4 md:p-5 rounded-2xl border border-softborder hover:border-gray-300 hover:shadow-soft-sm transition-all bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                    >
                      {/* Left: Avatar & Identity */}
                      <div className="flex items-start gap-3.5 min-w-[280px]">
                        <div
                          className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 border ${
                            isStudent
                              ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200'
                              : isGeneral
                              ? 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200'
                              : isTutor
                              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200'
                          }`}
                        >
                          {u.name?.charAt(0) || 'U'}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-darktext text-sm hover:text-emerald-800 transition-colors">
                              {u.name}
                            </h4>
                            {/* Role Tag */}
                            {isStudent && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                                🎓 Konseli Mahasiswa
                              </span>
                            )}
                            {isGeneral && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                                🌐 Klien Umum
                              </span>
                            )}
                            {isTutor && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                🧑‍🏫 Konselor / Tutor BK
                              </span>
                            )}
                            {isAdmin && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                🛡️ Administrator Sistem
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-mutedtext text-[11px]">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </span>
                            {u.phone && (
                              <a
                                href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
                                title="Chat WhatsApp"
                              >
                                <Phone className="w-3 h-3" />
                                {u.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Context Metadata */}
                      <div className="flex-1 px-0 lg:px-4 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {isStudent && (
                          <>
                            <div>
                              <span className="text-mutedtext block">NIM & Status:</span>
                              <span className="font-semibold text-darktext">
                                {u.student_profile?.nim || '-'} • {u.student_profile?.campus_status || 'AKTIF'}
                              </span>
                            </div>
                            <div>
                              <span className="text-mutedtext block">Program Studi:</span>
                              <span className="font-semibold text-darktext truncate block">
                                {u.student_profile?.program_study || 'Mahasiswa Aktif'}
                              </span>
                            </div>
                          </>
                        )}

                        {isGeneral && (
                          <>
                            <div>
                              <span className="text-mutedtext block">Identitas KTP (NIK):</span>
                              <span className="font-semibold text-darktext">
                                {u.general_profile?.nik || 'Terverifikasi'}
                              </span>
                            </div>
                            <div>
                              <span className="text-mutedtext block">Alamat / Domisili:</span>
                              <span className="font-semibold text-darktext truncate block">
                                {u.general_profile?.address || u.general_profile?.birth_place || 'Umum'}
                              </span>
                            </div>
                          </>
                        )}

                        {isTutor && (
                          <>
                            <div>
                              <span className="text-mutedtext block">NIP / ID Konselor:</span>
                              <span className="font-semibold text-darktext">
                                {u.tutor_profile?.nip || 'Konselor Kampus'}
                              </span>
                            </div>
                            <div>
                              <span className="text-mutedtext block">Spesialisasi:</span>
                              <span className="font-semibold text-darktext truncate block text-emerald-800" title={u.tutor_profile?.specialization}>
                                {u.tutor_profile?.specialization || 'Bimbingan Konseling'}
                              </span>
                            </div>
                          </>
                        )}

                        {isAdmin && (
                          <div className="sm:col-span-2">
                            <span className="text-mutedtext block">Hak Akses Superadmin:</span>
                            <span className="font-semibold text-darktext">
                              Kelola Pengguna, CMS Landing, Integrasi Zoom OAuth, dan Audit Logs
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Status & Actions */}
                      <div className="flex items-center justify-between lg:justify-end gap-2.5 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {u.status === 'active' ? 'Aktif' : 'Non-aktif'}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedUserDetail(u)}
                          className="px-3 py-1.5 rounded-xl border border-softborder text-mutedtext hover:text-darktext hover:bg-gray-50 transition-colors font-semibold text-[11px] flex items-center gap-1.5"
                          title="Lihat profil detail pengguna"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Detail</span>
                        </button>

                        {u.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`px-3 py-1.5 rounded-xl border transition-colors font-semibold text-[11px] flex items-center gap-1.5 ${
                              u.status === 'active'
                                ? 'border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100'
                            }`}
                            title={u.status === 'active' ? 'Nonaktifkan akun pengguna ini' : 'Aktifkan kembali akun ini'}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* User Detail Modal */}
          {selectedUserDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl border border-softborder shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-6 border-b border-softborder flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl font-black text-base flex items-center justify-center border ${
                        selectedUserDetail.role === 'STUDENT'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : selectedUserDetail.role === 'GENERAL'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : selectedUserDetail.role === 'TUTOR'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {selectedUserDetail.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-darktext">
                        {selectedUserDetail.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-darktext">
                          ID: #{selectedUserDetail.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            selectedUserDetail.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {selectedUserDetail.status === 'active' ? 'Akun Aktif' : 'Akun Non-aktif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUserDetail(null)}
                    className="p-2 rounded-xl text-mutedtext hover:text-darktext hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto space-y-5 text-xs">
                  {/* Account Information */}
                  <div>
                    <h4 className="font-bold text-darktext mb-2.5 flex items-center gap-2 text-xs">
                      <Users className="w-4 h-4 text-emerald-700" />
                      Informasi Akun & Kontak
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                      <div>
                        <span className="text-[11px] text-mutedtext block">Email:</span>
                        <span className="font-semibold text-darktext">{selectedUserDetail.email}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-mutedtext block">Nomor WhatsApp:</span>
                        <span className="font-semibold text-darktext">{selectedUserDetail.phone || 'Belum diisi'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-mutedtext block">Peran (Role):</span>
                        <span className="font-semibold text-darktext">{selectedUserDetail.role}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-mutedtext block">Tanggal Pendaftaran:</span>
                        <span className="font-semibold text-darktext font-mono text-[11px]">
                          {new Date(selectedUserDetail.created_at).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role-Specific Information */}
                  {selectedUserDetail.role === 'STUDENT' && selectedUserDetail.student_profile && (
                    <div>
                      <h4 className="font-bold text-darktext mb-2.5 flex items-center gap-2 text-xs">
                        <GraduationCap className="w-4 h-4 text-indigo-700" />
                        Data Akademik Konseli Mahasiswa
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                        <div>
                          <span className="text-[11px] text-mutedtext block">Nomor Induk Mahasiswa (NIM):</span>
                          <span className="font-semibold text-darktext font-mono">
                            {selectedUserDetail.student_profile.nim || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-mutedtext block">Status Kampus:</span>
                          <span className="font-semibold text-emerald-700">
                            {selectedUserDetail.student_profile.campus_status || 'AKTIF'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-mutedtext block">Program Studi:</span>
                          <span className="font-semibold text-darktext">
                            {selectedUserDetail.student_profile.program_study || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-mutedtext block">Jenjang Pendidikan:</span>
                          <span className="font-semibold text-darktext">
                            {selectedUserDetail.student_profile.degree || 'S1'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-mutedtext block">Tempat, Tanggal Lahir:</span>
                          <span className="font-semibold text-darktext">
                            {selectedUserDetail.student_profile.birth_place || '-'}
                            {selectedUserDetail.student_profile.birth_date ? `, ${new Date(selectedUserDetail.student_profile.birth_date).toLocaleDateString('id-ID')}` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-mutedtext block">Jenis Kelamin:</span>
                          <span className="font-semibold text-darktext">
                            {selectedUserDetail.student_profile.gender || '-'}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[11px] text-mutedtext block">Alamat Domisili:</span>
                          <span className="font-semibold text-darktext">
                            {selectedUserDetail.student_profile.address || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedUserDetail.role === 'GENERAL' && selectedUserDetail.general_profile && (
                    <div>
                      <h4 className="font-bold text-darktext mb-2.5 flex items-center gap-2 text-xs">
                        <Globe className="w-4 h-4 text-purple-700" />
                        Data Kependudukan Klien Umum
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                        <div>
                          <span className="text-[11px] text-mutedtext block">Nomor Induk Kependudukan (NIK):</span>
                          <span className="font-semibold text-darktext font-mono">
                            {selectedUserDetail.general_profile.nik || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-mutedtext block">Jenis Kelamin:</span>
                          <span className="font-semibold text-darktext">
                            {selectedUserDetail.general_profile.gender || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-mutedtext block">Tempat, Tanggal Lahir:</span>
                          <span className="font-semibold text-darktext">
                            {selectedUserDetail.general_profile.birth_place || '-'}
                            {selectedUserDetail.general_profile.birth_date ? `, ${new Date(selectedUserDetail.general_profile.birth_date).toLocaleDateString('id-ID')}` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-mutedtext block">Alamat Terdaftar:</span>
                          <span className="font-semibold text-darktext">
                            {selectedUserDetail.general_profile.address || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedUserDetail.role === 'TUTOR' && selectedUserDetail.tutor_profile && (
                    <div>
                      <h4 className="font-bold text-darktext mb-2.5 flex items-center gap-2 text-xs">
                        <GraduationCap className="w-4 h-4 text-emerald-700" />
                        Profil Konselor / Tutor BK
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                        <div>
                          <span className="text-[11px] text-mutedtext block">Nomor Induk Pegawai (NIP):</span>
                          <span className="font-semibold text-darktext font-mono">
                            {selectedUserDetail.tutor_profile.nip || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-mutedtext block">Ketersediaan Konseling:</span>
                          <span className={`font-semibold ${selectedUserDetail.tutor_profile.is_available ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {selectedUserDetail.tutor_profile.is_available ? '🟢 Siap Menerima Jadwal' : '🔴 Jadwal Sedang Ditutup'}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[11px] text-mutedtext block">Bidang Spesialisasi:</span>
                          <span className="font-semibold text-darktext">
                            {selectedUserDetail.tutor_profile.specialization || 'Konseling Umum'}
                          </span>
                        </div>
                        {selectedUserDetail.tutor_profile.bio && (
                          <div className="sm:col-span-2">
                            <span className="text-[11px] text-mutedtext block">Bio Singkat:</span>
                            <p className="text-darktext/90 italic bg-white/60 p-2.5 rounded-xl border border-emerald-100">
                              "{selectedUserDetail.tutor_profile.bio}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedUserDetail.role === 'ADMIN' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                      <h4 className="font-bold text-amber-900 flex items-center gap-2 text-xs">
                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                        Izin Akses Tingkat Administrator
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Akun ini memiliki hak akses tertinggi ke seluruh panel administrasi, konfigurasi web, pengaturan integrasi Zoom Server-to-Server OAuth, manajemen protokol darurat krisis, serta audit log sistem.
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-mutedtext">
                    Status saat ini: <strong>{selectedUserDetail.status === 'active' ? 'Aktif' : 'Non-aktif'}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedUserDetail.role !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(selectedUserDetail.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                          selectedUserDetail.status === 'active'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {selectedUserDetail.status === 'active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedUserDetail(null)}
                      className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-xs font-bold text-darktext transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="URL Gambar (misal: /images/banner1.jpg atau https://...)"
                    value={landingContent?.hero?.image_url || ''}
                    onChange={(e) => handleHeroChange('image_url', e.target.value)}
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-softborder bg-white text-xs font-medium text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {landingContent?.hero?.image_url && (
                    <button
                      type="button"
                      onClick={handleClearBannerImage}
                      title="Hapus / Kosongkan foto"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <label className={`px-4 py-2.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0 ${isUploadingBanner ? 'opacity-60 pointer-events-none' : ''}`}>
                  {isUploadingBanner ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Foto</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingBanner}
                    onChange={handleBannerFileUpload}
                    className="hidden"
                  />
                </label>

                {landingContent?.hero?.image_url && (
                  <button
                    type="button"
                    onClick={handleClearBannerImage}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0"
                    title="Hapus foto banner saat ini"
                  >
                    <X className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                    <span>Hapus</span>
                  </button>
                )}
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
                  onClick={() => handleHeroChange('image_url', '/images/banner3.jpg')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    landingContent?.hero?.image_url === '/images/banner3.jpg'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-darktext border-softborder hover:border-emerald-400'
                  }`}
                >
                  Banner 2 (Lounge Diskusi Mahasiswa)
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
                  Banner 3 (Sesi Konseling Privat)
                </button>
              </div>
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <span>💡</span>
                <span>Banner utama di halaman depan berputar otomatis (slider 3 foto) dilengkapi navigasi panah & indikator slide.</span>
              </p>

              {/* Preview Gambar Banner dengan Tombol X */}
              {landingContent?.hero?.image_url ? (
                <div className="pt-2">
                  <div className="w-full h-44 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-gray-100 relative group shadow-sm">
                    <img
                      src={landingContent.hero.image_url}
                      alt="Preview Banner"
                      className="w-full h-full object-cover"
                    />

                    {/* Lencana Banner Aktif */}
                    <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-xl bg-emerald-900/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Banner Aktif</span>
                    </div>

                    {/* Tombol X Hapus Foto */}
                    <button
                      type="button"
                      onClick={handleClearBannerImage}
                      className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-lg backdrop-blur-md transition-all border border-white/20 cursor-pointer"
                      title="Hapus foto ini untuk upload foto lain"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                      <span>Hapus Foto</span>
                    </button>

                    {/* Overlay info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                      <p className="text-white text-xs font-medium">
                        Klik tombol <strong>"Hapus Foto" (X)</strong> di pojok kanan atas untuk menghapus foto ini dan mengunggah foto baru.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state saat foto dihapus */
                <div className="pt-2">
                  <label className={`w-full h-36 rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group text-center p-4 ${isUploadingBanner ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-emerald-100 text-gray-400 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                      {isUploadingBanner ? (
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-darktext group-hover:text-emerald-900">
                        {isUploadingBanner ? 'Sedang Mengunggah Foto...' : 'Foto Banner Kosong / Telah Dihapus'}
                      </p>
                      <p className="text-[11px] text-mutedtext mt-0.5">
                        {isUploadingBanner ? 'Mohon tunggu beberapa detik...' : 'Klik di sini untuk Upload Foto Baru atau pilih salah satu Preset di atas.'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingBanner}
                      onChange={handleBannerFileUpload}
                      className="hidden"
                    />
                  </label>
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

      {/* 5. Web CMS & SEO Settings Tab */}
      {activeTab === 'web_settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {/* Card 1: Identitas & SEO Website */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Identitas Website & Optimasi Mesin Pencari (SEO)</h3>
                <p className="text-xs text-mutedtext">Atur nama portal, slogan kampus, dan bagaimana website Ruang BK tampil di hasil pencarian Google.</p>
              </div>
            </div>

            {/* Live Google Search Snippet Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pratinjau Tampilan di Google (SERP Preview)
              </span>
              <div className="font-sans text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
                  <span className="text-emerald-700 font-semibold">https://bk-online.uinssc.ac.id</span>
                  <span className="text-slate-400">›</span>
                  <span className="text-slate-500">layanan-konseling</span>
                </div>
                <h4 className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                  {settings.site_title || 'Ruang BK - Layanan Bimbingan & Konseling Kampus'} | {settings.site_tagline || 'Ruang Aman'}
                </h4>
                <p className="text-[11px] text-[#4d5156] line-clamp-2 leading-relaxed">
                  {settings.site_meta_description || 'Layanan bimbingan dan konseling online & offline terpadu untuk civitas akademika kampus. Akses sesi privat dengan konselor terpercaya.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Nama / Judul Website (Site Title) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.site_title || ''}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  placeholder="Ruang BK - Layanan Bimbingan & Konseling Kampus"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
                <span className="text-[11px] text-mutedtext mt-1 block">Tampil pada tab browser dan judul utama portal.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Slogan / Tagline Website
                </label>
                <input
                  type="text"
                  value={settings.site_tagline || ''}
                  onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                  placeholder="Ruang Aman untuk Tumbuh dan Bercerita"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="text-[11px] text-mutedtext mt-1 block">Subjudul pemikat di samping logo dan hero banner.</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-darktext">
                  Deskripsi Meta SEO (Google Meta Description)
                </label>
                <span className={`text-[10px] font-semibold ${
                  (settings.site_meta_description?.length || 0) > 160 ? 'text-amber-600 font-bold' : 'text-mutedtext'
                }`}>
                  {settings.site_meta_description?.length || 0} / 160 karakter disarankan
                </span>
              </div>
              <textarea
                rows={2}
                value={settings.site_meta_description || ''}
                onChange={(e) => setSettings({ ...settings, site_meta_description: e.target.value })}
                placeholder="Deskripsi singkat yang merangkum layanan BK kampus ketika tautan dibagikan atau dicari di Google..."
                className="w-full p-3 rounded-2xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">
                Kata Kunci SEO (Meta Keywords)
              </label>
              <input
                type="text"
                value={settings.site_meta_keywords || ''}
                onChange={(e) => setSettings({ ...settings, site_meta_keywords: e.target.value })}
                placeholder="konseling online, bimbingan mahasiswa, kesehatan mental, konselor kampus"
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[11px] text-mutedtext mt-1 block">Pisahkan dengan tanda koma. Membantu indeksasi search engine kampus.</span>
            </div>
          </div>

          {/* Card 2: Kontak Resmi & Lokasi Fisik */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Kontak Resmi & Lokasi Kantor Pelayanan</h3>
                <p className="text-xs text-mutedtext">Informasi kontak publik untuk mahasiswa yang membutuhkan bantuan atau sesi tatap muka (offline).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Resmi Layanan BK</span>
                </label>
                <input
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  placeholder="konseling@syekhnurjati.ac.id"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>WhatsApp Hotline / Helpdesk BK</span>
                </label>
                <input
                  type="text"
                  value={settings.contact_whatsapp || ''}
                  onChange={(e) => setSettings({ ...settings, contact_whatsapp: e.target.value })}
                  placeholder="+62 812-3456-7890"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Alamat Fisik Gedung / Ruang Konseling</span>
                </label>
                <textarea
                  rows={2}
                  value={settings.campus_address || ''}
                  onChange={(e) => setSettings({ ...settings, campus_address: e.target.value })}
                  placeholder="Gedung PKM Lt. 2, Kampus Terpadu UINSSC, Cirebon"
                  className="w-full p-3 rounded-2xl border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Jam Operasional Pelayanan</span>
                </label>
                <input
                  type="text"
                  value={settings.operating_hours || ''}
                  onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  placeholder="Senin - Jumat, 08:00 - 16:00 WIB"
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="text-[11px] text-mutedtext mt-1 block">Waktu ketersediaan konselor tatap muka di kampus.</span>
              </div>
            </div>
          </div>

          {/* Card 3: Banner Pengumuman Website */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-darktext">Banner Pengumuman Atas (Announcement Bar)</h3>
                  <p className="text-xs text-mutedtext">Pita pengumuman darurat atau info penting di bagian teratas website publik.</p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.announcement_bar_enabled}
                  onChange={(e) => setSettings({ ...settings, announcement_bar_enabled: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-darktext">
                  {settings.announcement_bar_enabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </label>
            </div>

            {settings.announcement_bar_enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-darktext mb-1">
                    Isi Pesan Pengumuman
                  </label>
                  <input
                    type="text"
                    value={settings.announcement_text || ''}
                    onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                    placeholder="Layanan Konseling Tatap Muka & Online tetap beroperasi penuh selama masa perkuliahan."
                    className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Live Preview Box */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Pratinjau Banner di Website Publik:
                  </span>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-soft-xs text-center">
                    <Megaphone className="w-4 h-4 shrink-0" />
                    <span>{settings.announcement_text || 'Pengumuman informasi penting untuk civitas akademika.'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[46px]"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Pengaturan Web...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengaturan Web & SEO</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 6. BK Online App Settings Tab */}
      {(activeTab === 'counseling_settings' || activeTab === 'settings') && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {/* Card 1: Parameter Sesi Konseling Mahasiswa */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Parameter Operasional Sesi Konseling</h3>
                <p className="text-xs text-mutedtext">Konfigurasi durasi tatap muka online/offline, kuota mahasiswa, dan batasan pembatalan.</p>
              </div>
            </div>

            {/* Durasi Sesi Konseling */}
            <div>
              <label className="block text-xs font-bold text-darktext mb-2">
                Durasi Standar per Sesi Konseling
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 30, label: '30 Menit', desc: 'Konseling Singkat' },
                  { value: 45, label: '45 Menit', desc: 'Sesi Reguler' },
                  { value: 60, label: '60 Menit', desc: 'Mendalam (Standar)' },
                  { value: 90, label: '90 Menit', desc: 'Kasus Kompleks' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, default_session_duration: item.value })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      Number(settings.default_session_duration) === item.value
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-soft-xs ring-2 ring-emerald-600/10'
                        : 'border-softborder bg-gray-50/70 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-black text-darktext block">{item.label}</span>
                    <span className="text-[10px] text-mutedtext mt-0.5 block">{item.desc}</span>
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-mutedtext mt-1.5 block">Durasi ini otomatis menjadi acuan durasi meeting Zoom dan kalender konselor.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-gray-100">
              {/* Maksimal Kasus Aktif per Mahasiswa */}
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Batas Kasus Konseling Aktif per Mahasiswa
                </label>
                <select
                  value={settings.max_active_sessions_per_student}
                  onChange={(e) => setSettings({ ...settings, max_active_sessions_per_student: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value={1}>1 Sesi Aktif (Ketat - Wajib Selesai Sebelum Booking Baru)</option>
                  <option value={2}>2 Sesi Aktif (Rekomendasi - Fleksibel)</option>
                  <option value={3}>3 Sesi Aktif</option>
                  <option value={4}>4 Sesi Aktif</option>
                  <option value={5}>5 Sesi Aktif (Maksimal)</option>
                </select>
                <span className="text-[11px] text-mutedtext mt-1 block">Mencegah satu mahasiswa memborong banyak jadwal konselor sekaligus.</span>
              </div>

              {/* Cancellation Window Buffer */}
              <div>
                <label className="block text-xs font-bold text-darktext mb-1">
                  Batas Waktu Pembatalan Mandiri (Cancellation Window)
                </label>
                <select
                  value={settings.cancellation_buffer_hours}
                  onChange={(e) => setSettings({ ...settings, cancellation_buffer_hours: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value={2}>2 Jam Sebelum Jadwal (Sangat Fleksibel)</option>
                  <option value={6}>6 Jam Sebelum Jadwal (Rekomendasi)</option>
                  <option value={12}>12 Jam Sebelum Jadwal (Moderat)</option>
                  <option value={24}>24 Jam Sebelum Jadwal (Ketat)</option>
                </select>
                <span className="text-[11px] text-mutedtext mt-1 block">Mahasiswa tidak dapat membatalkan mandiri jika waktu sesi mendekati batas ini.</span>
              </div>
            </div>
          </div>

          {/* Card 2: Alur Penugasan Tutor & Persetujuan */}
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Alur Penugasan Konselor & Persetujuan Permohonan</h3>
                <p className="text-xs text-mutedtext">Tentukan bagaimana mahasiswa mendapatkan konselor dan apakah sesi langsung terkonfirmasi otomatis.</p>
              </div>
            </div>

            {/* Mode Penugasan Tutor */}
            <div>
              <label className="block text-xs font-bold text-darktext mb-2">
                Mode Penugasan Tutor (Tutor Assignment Mode)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    value: 'student_select',
                    title: 'Pilih Sendiri',
                    desc: 'Mahasiswa memilih konselor sendiri dari daftar tutor yang tersedia.',
                  },
                  {
                    value: 'manual',
                    title: 'Manual Admin',
                    desc: 'Kasus konseling masuk antrean, admin yang menentukan konselor yang tepat.',
                  },
                  {
                    value: 'automatic',
                    title: 'Otomatis Sistem',
                    desc: 'Sistem membagi merata ke konselor berdasarkan ketersediaan jadwal.',
                  },
                ].map((mode) => (
                  <label
                    key={mode.value}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      settings.tutor_assignment_mode === mode.value
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-soft-xs ring-2 ring-emerald-600/10'
                        : 'border-softborder bg-gray-50/60 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-darktext">{mode.title}</span>
                        <input
                          type="radio"
                          name="tutor_mode"
                          checked={settings.tutor_assignment_mode === mode.value}
                          onChange={() => setSettings({ ...settings, tutor_assignment_mode: mode.value })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                      </div>
                      <p className="text-[11px] text-mutedtext leading-relaxed">{mode.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Auto Approve Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <h4 className="text-xs font-bold text-darktext">Persetujuan Otomatis Permohonan Konseling (Auto-Approve)</h4>
                <p className="text-[11px] text-mutedtext mt-0.5">
                  Jika aktif, jadwal langsung terbit dan tautan Zoom otomatis digenerate tanpa perlu menunggu konfirmasi manual tutor.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_approve_counseling}
                onChange={(e) => setSettings({ ...settings, auto_approve_counseling: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 ml-4"
              />
            </div>

            {/* Session Reminder Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <h4 className="text-xs font-bold text-darktext">Pengingat Jadwal Konseling (Session Reminder)</h4>
                <p className="text-[11px] text-mutedtext mt-0.5">
                  Kirim notifikasi lonceng dan pemberitahuan berkala kepada mahasiswa dan tutor menjelang sesi konsultasi.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.reminder_notifications_enabled}
                onChange={(e) => setSettings({ ...settings, reminder_notifications_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 ml-4"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[46px]"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Aturan Konseling...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Aturan Operasional Konseling</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 7. Dedicated Zoom OAuth Settings Tab */}
      {activeTab === 'zoom_settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-soft-xs">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Integrasi Akun Zoom Meeting (Server-to-Server OAuth)</h3>
                  <p className="text-xs text-slate-500">Jadwalkan konseling otomatis langsung ke akun dan kalender Zoom Anda.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                  settings.zoom_mock_mode
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : settings.zoom_is_configured
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {settings.zoom_mock_mode
                    ? '🟡 Mock Mode (Simulasi Lokal)'
                    : settings.zoom_is_configured
                    ? '🟢 Live Zoom API (Terkonfigurasi)'
                    : '⚪ Belum Dikonfigurasi'}
                </span>
              </div>
            </div>

            {/* Tautan Zoom Meeting Tetap (Permanent / Standby Link) */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white p-4 sm:p-5 shadow-soft-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-soft-xs shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>Zoom Meeting Tetap</span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Siap Pakai Kapan Saja
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tautan permanen untuk uji coba langsung dan konseling online. Bisa digunakan setiap saat oleh Admin, Konselor, dan Mahasiswa.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {settings.zoom_permanent_meeting_url && (
                    <button
                      type="button"
                      onClick={() => window.open(settings.zoom_permanent_meeting_url, '_blank')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-soft-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Aplikasi Zoom</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isStartingInstantZoom}
                    onClick={handleStartInstantZoomSession}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-soft-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isStartingInstantZoom ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyiapkan Ruang Sesi...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>⚡ Mulai Simulasi Sesi Langsung (Tanpa Jadwal)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Connected Account Banner */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/90 border border-blue-200/80 text-xs text-slate-700 shadow-soft-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Akun Terhubung: <strong>Pasca UINSSC</strong> (<code>admpasca@uinssc.ac.id</code>) • <span className="text-emerald-700 font-semibold">Licensed / Pro</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Personal Meeting Link
                </label>
                <input
                  type="url"
                  value={settings.zoom_permanent_meeting_url || ''}
                  onChange={(e) => setSettings({ ...settings, zoom_permanent_meeting_url: e.target.value })}
                  placeholder="Contoh: https://us06web.zoom.us/j/3404109926?pwd=xxxx"
                  className="w-full h-11 px-3.5 rounded-2xl border border-blue-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-soft-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Meeting ID Tetap (Opsional)
                  </label>
                  <input
                    type="text"
                    value={settings.zoom_permanent_meeting_id || ''}
                    onChange={(e) => setSettings({ ...settings, zoom_permanent_meeting_id: e.target.value })}
                    placeholder="Contoh: 849 2019 481"
                    className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Passcode Meeting Tetap (Opsional)
                  </label>
                  <input
                    type="text"
                    value={settings.zoom_permanent_meeting_password || ''}
                    onChange={(e) => setSettings({ ...settings, zoom_permanent_meeting_password: e.target.value })}
                    placeholder="Contoh: 123456 atau bk123"
                    className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/80 border border-blue-200/60 text-[11px] text-blue-900 leading-relaxed">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>💡 Solusi Lancar untuk Pengujian di HP:</strong> Mahasiswa yang mengakses dari HP cukup klik <em>"Buka di Aplikasi Zoom"</em> di ruang tunggu. Aplikasi Zoom resmi di HP akan langsung terbuka dengan video kamera & audio 100% aktif tanpa hambatan browser web!
                </div>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  settings.zoom_mock_mode
                    ? 'bg-white border-emerald-600 shadow-soft-xs ring-2 ring-emerald-600/10'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="zoom_mode"
                  checked={settings.zoom_mock_mode}
                  onChange={() => setSettings({ ...settings, zoom_mock_mode: true })}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Simulasi / Mock Mode (Development)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                    Sesi video berjalan di browser tanpa perlu akun Zoom berbayar. Bebas testing alur konseling.
                  </span>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  !settings.zoom_mock_mode
                    ? 'bg-white border-blue-600 shadow-soft-xs ring-2 ring-blue-600/10'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="zoom_mode"
                  checked={!settings.zoom_mock_mode}
                  onChange={() => setSettings({ ...settings, zoom_mock_mode: false })}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Live Akun Zoom Resmi (Otomatis)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                    Otomatis buat jadwal meeting di akun Zoom host & kirim link resmi ke mahasiswa.
                  </span>
                </div>
              </label>
            </div>

            {/* Quick Step-by-Step Guide Accordion */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-950">
              <div
                onClick={() => setShowZoomGuide(!showZoomGuide)}
                className="flex items-center justify-between cursor-pointer font-bold select-none"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Panduan Cara Buat Kredensial Server-to-Server OAuth di marketplace.zoom.us (Gratis)</span>
                </div>
                <span className="text-[11px] text-blue-700 underline font-bold">
                  {showZoomGuide ? 'Sembunyikan' : 'Lihat Langkah Lengkap'}
                </span>
              </div>

              {showZoomGuide && (
                <div className="mt-3 pt-3 border-t border-blue-200/70 space-y-2 text-[11px] leading-relaxed text-slate-700">
                  <p>
                    1. Buka <a href="https://marketplace.zoom.us" target="_blank" rel="noreferrer" className="font-bold text-blue-700 underline inline-flex items-center gap-0.5">marketplace.zoom.us <ExternalLink className="w-2.5 h-2.5" /></a> dan login dengan akun Zoom Anda.
                  </p>
                  <p>
                    2. Klik menu <strong>Develop</strong> di navigasi atas/bawah, lalu pilih <strong>Build an App</strong>.
                  </p>
                  <p>
                    3. Pilih kartu <strong>Server-to-Server OAuth</strong>, lalu klik <strong>Create</strong> dan beri nama aplikasi (contoh: <em>Ruang BK Kampus</em>).
                  </p>
                  <p>
                    4. Pada tab <strong>App Credentials</strong>, Anda akan menemukan <strong>Account ID</strong>, <strong>Client ID</strong>, dan <strong>Client Secret</strong>. Salin ke kolom di bawah.
                  </p>
                  <p>
                    5. Pada tab <strong>Scopes</strong>, klik <em>Add Scopes</em>, centang scope <code>meeting:write:admin</code> (atau <code>meeting:write</code>) dan <code>user:read:admin</code>.
                  </p>
                  <p>
                    6. Buka tab <strong>Activation</strong> lalu klik tombol <strong>Activate your app</strong>. Selesai!
                  </p>
                </div>
              )}
            </div>

            {/* Credential Inputs */}
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Zoom Account ID
                </label>
                <input
                  type="text"
                  value={settings.zoom_account_id || ''}
                  onChange={(e) => setSettings({ ...settings, zoom_account_id: e.target.value })}
                  placeholder="Contoh: xYzAbCdEfG123456"
                  className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Zoom Client ID
                  </label>
                  <input
                    type="text"
                    value={settings.zoom_client_id || ''}
                    onChange={(e) => setSettings({ ...settings, zoom_client_id: e.target.value })}
                    placeholder="Contoh: aBcDeFgHiJkLmNoP"
                    className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Zoom Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showZoomSecret ? 'text' : 'password'}
                      value={settings.zoom_client_secret || ''}
                      onChange={(e) => setSettings({ ...settings, zoom_client_secret: e.target.value })}
                      placeholder={settings.zoom_has_client_secret ? `${settings.zoom_client_secret_masked} (Tersimpan - isi jika ingin ganti)` : 'Tempel Client Secret di sini'}
                      className="w-full h-11 px-3.5 pr-10 rounded-2xl border border-slate-200 text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowZoomSecret(!showZoomSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showZoomSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Host Akun Zoom (Opsional)
                </label>
                <input
                  type="email"
                  value={settings.zoom_host_email || ''}
                  onChange={(e) => setSettings({ ...settings, zoom_host_email: e.target.value })}
                  placeholder="Kosongkan untuk otomatis menggunakan akun pemilik ('me') atau isi email akun Zoom"
                  className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Jika akun Zoom Anda memiliki beberapa lisensi konselor, Anda dapat mengisi email host konselor di sini.
                </span>
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                type="button"
                disabled={isTestingZoom || !settings.zoom_account_id || !settings.zoom_client_id}
                onClick={handleTestZoomConnection}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-soft-xs flex items-center gap-2 transition-colors cursor-pointer min-h-[40px]"
              >
                {isTestingZoom ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menguji Koneksi ke Zoom...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Uji Koneksi Zoom API Langsung</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-500">
                Memverifikasi apakah token OAuth dapat diterbitkan dan berkomunikasi langsung dengan Zoom API.
              </span>
            </div>

            {/* Connection Test Result Box */}
            {zoomTestResult && (
              <div className={`p-4 rounded-2xl border text-xs ${
                zoomTestResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {zoomTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{zoomTestResult.message}</span>
                </div>
                {zoomTestResult.data && (
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-200/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Nama Akun:</span>
                      <strong className="text-slate-800">{zoomTestResult.data.name || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Email:</span>
                      <strong className="text-slate-800">{zoomTestResult.data.email || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tipe Akun:</span>
                      <strong className="text-slate-800">{zoomTestResult.data.account_type || '-'}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[46px]"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Pengaturan Zoom...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Konfigurasi Zoom</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 8. Crisis & Screening Settings Tab */}
      {activeTab === 'crisis_settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Deteksi Krisis & Skrining Kebutuhan Mental</h3>
                <p className="text-xs text-mutedtext">Konfigurasi perlindungan darurat untuk mendeteksi indikasi risiko tinggi pada mahasiswa.</p>
              </div>
            </div>

            {/* Crisis Flagging Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-darktext">Deteksi Crisis Flag Otomatis</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                    Prioritas Darurat
                  </span>
                </div>
                <p className="text-[11px] text-mutedtext mt-1 leading-relaxed">
                  Tandai secara otomatis screening mahasiswa yang terdeteksi memiliki ide menyakiti diri sendiri, keputusasaan akut, atau skor depresi berat. Kasus ini langsung diprioritaskan di daftar konseling.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.crisis_flag_enabled}
                onChange={(e) => setSettings({ ...settings, crisis_flag_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 shrink-0 ml-4"
              />
            </div>

            {/* Emergency Notification Email */}
            <div>
              <label className="block text-xs font-bold text-darktext mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Notifikasi Darurat Tim Krisis Kampus</span>
              </label>
              <input
                type="email"
                value={settings.crisis_alert_email || ''}
                onChange={(e) => setSettings({ ...settings, crisis_alert_email: e.target.value })}
                placeholder="crisis-center@syekhnurjati.ac.id"
                className="w-full h-11 px-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs font-semibold text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <span className="text-[11px] text-mutedtext mt-1 block">
                Saat ada screening terdeteksi krisis, sistem akan mengirimkan peringatan khusus ke email koordinator konselor atau satgas kesehatan mental.
              </span>
            </div>

            {/* SOP Protocol Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Prosedur Standar (SOP) Penanganan Krisis</span>
              </h5>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                <li>Mahasiswa dengan tanda krisis akan didahulukan dalam penentuan jadwal tanpa antrean reguler.</li>
                <li>Data screening dienkripsi dan hanya dapat diakses oleh konselor yang memiliki izin asesmen klinis.</li>
                <li>Asisten virtual Nara tidak akan memberikan diagnosis mandiri dan akan mengarahkan mahasiswa ke hotline darurat.</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center gap-2 transition-all min-h-[46px]"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Pengaturan Krisis...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengaturan Krisis</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 9. General System Settings & Health Tab */}
      {activeTab === 'general_settings' && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darktext">Informasi Lingkungan Sistem & Status Server</h3>
                <p className="text-xs text-mutedtext">Pemeriksaan integritas komponen backend, basis data, dan modul integrasi.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-mutedtext uppercase tracking-wider block">Versi Aplikasi</span>
                <span className="text-base font-black text-darktext mt-1 block">Ruang BK v2.4</span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">🟢 Status: Aktif & Stabil</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-mutedtext uppercase tracking-wider block">Backend & Basis Data</span>
                <span className="text-base font-black text-darktext mt-1 block">Laravel 11 / PHP 8.2</span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">🟢 MySQL Connected</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-mutedtext uppercase tracking-wider block">Modul Video Conference</span>
                <span className="text-base font-black text-darktext mt-1 block">
                  {settings.zoom_mock_mode ? 'Simulasi Mock' : 'Live Zoom OAuth'}
                </span>
                <span className={`text-[11px] font-semibold mt-0.5 block ${
                  settings.zoom_is_configured ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {settings.zoom_is_configured ? '🟢 OAuth API Terverifikasi' : '🟡 Belum Terhubung'}
                </span>
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <h4 className="text-xs font-bold text-darktext">Pintas Navigasi CMS & Konfigurasi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('web_settings')}
                  className="p-3 rounded-2xl border border-softborder hover:border-emerald-300 bg-white text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-darktext group-hover:text-emerald-800 block">Pengaturan Identitas & SEO Web</span>
                      <span className="text-[11px] text-mutedtext block">Ubah judul, meta description, dan hotline</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mutedtext group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('counseling_settings')}
                  className="p-3 rounded-2xl border border-softborder hover:border-emerald-300 bg-white text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-darktext group-hover:text-emerald-800 block">Aturan Operasional Konseling</span>
                      <span className="text-[11px] text-mutedtext block">Durasi sesi, kuota mahasiswa, penugasan</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mutedtext group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('zoom_settings')}
                  className="p-3 rounded-2xl border border-softborder hover:border-blue-300 bg-white text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-darktext group-hover:text-blue-800 block">Integrasi Zoom Server-to-Server OAuth</span>
                      <span className="text-[11px] text-mutedtext block">Kredensial API & Uji Koneksi Langsung</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mutedtext group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('voice')}
                  className="p-3 rounded-2xl border border-softborder hover:border-purple-300 bg-white text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="text-xs font-bold text-darktext group-hover:text-purple-800 block">Rekaman Suara Asisten Nara 🎙️</span>
                      <span className="text-[11px] text-mutedtext block">Kelola audio salam, skrining & panduan</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mutedtext group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Nara Voice Manager Tab */}
      {activeTab === 'voice' && (
        <NaraVoiceManager />
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
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-darktext flex items-center gap-2">
                    <span>Isi Lengkap Artikel (Konten Utama)</span>
                    {articleEditorMode === 'html' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-bold border border-amber-300/80">
                        HTML Code Mode
                      </span>
                    )}
                  </label>

                  {/* Mode Switcher Tabs */}
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setArticleEditorMode('text')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        articleEditorMode === 'text'
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'text-mutedtext hover:text-darktext'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Teks / Visual</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setArticleEditorMode('html')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        articleEditorMode === 'html'
                          ? 'bg-slate-900 text-emerald-400 shadow-2xs'
                          : 'text-mutedtext hover:text-darktext'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Mode Kode (HTML)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setArticleEditorMode('preview')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        articleEditorMode === 'preview'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'text-mutedtext hover:text-darktext'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {/* Quick HTML Toolbar (When in HTML mode) */}
                {articleEditorMode === 'html' && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-[11px] font-mono">
                    <span className="text-slate-400 text-[10px] px-1 font-sans">Tag Cepat:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertHtmlTag('<p>', '</p>')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
                      title="Paragraf"
                    >
                      &lt;p&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHtmlTag('<h3>', '</h3>')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
                      title="Sub-judul (H3)"
                    >
                      &lt;h3&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHtmlTag('<h2>', '</h2>')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
                      title="Judul Bab (H2)"
                    >
                      &lt;h2&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHtmlTag('<strong>', '</strong>')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition-colors"
                      title="Teks Tebal"
                    >
                      &lt;strong&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHtmlTag('<em>', '</em>')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition-colors"
                      title="Teks Miring"
                    >
                      &lt;em&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHtmlTag('<ul>\n  <li>', '</li>\n</ul>')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors"
                      title="Daftar Bullet"
                    >
                      &lt;ul&gt;&lt;li&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHtmlTag('<ol>\n  <li>', '</li>\n</ol>')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors"
                      title="Daftar Nomor"
                    >
                      &lt;ol&gt;&lt;li&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHtmlTag('<blockquote class="p-3 bg-emerald-50/50 border-l-4 border-emerald-600 rounded-r-xl italic my-3">\n', '\n</blockquote>')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700 transition-colors"
                      title="Kutipan Khusus"
                    >
                      &lt;blockquote&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHtmlTag('<div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 my-3">\n  ', '\n</div>')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-slate-700 transition-colors"
                      title="Kotak Info Callout"
                    >
                      &lt;callout&gt;
                    </button>
                  </div>
                )}

                {/* Editor View */}
                {articleEditorMode === 'preview' ? (
                  <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 bg-white min-h-[200px] max-h-[350px] overflow-y-auto space-y-3">
                    <div className="text-[11px] font-bold text-mutedtext pb-2 border-b border-gray-100 flex items-center justify-between">
                      <span>Pratinjau Halaman Artikel:</span>
                      <span className="text-emerald-700 font-medium">Tampilan Pengunjung</span>
                    </div>
                    {editingArticle.content?.trim() ? (
                      /<\/?[a-z][\s\S]*>/i.test(editingArticle.content) ? (
                        <div
                          className="article-html-content text-slate-700 leading-relaxed text-xs sm:text-sm space-y-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-slate-900 [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-slate-900 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:border-l-4 [&>blockquote]:border-emerald-600 [&>blockquote]:pl-3 [&>blockquote]:italic"
                          dangerouslySetInnerHTML={{ __html: editingArticle.content }}
                        />
                      ) : (
                        <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                          {editingArticle.content}
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-mutedtext italic py-8 text-center">Belum ada konten artikel yang ditulis.</p>
                    )}
                  </div>
                ) : articleEditorMode === 'html' ? (
                  <div className="space-y-1.5">
                    <textarea
                      id="article-content-textarea"
                      rows={8}
                      placeholder="<h3>Sub Judul Artikel</h3>&#10;<p>Tuliskan paragraf pembahasan dengan format HTML di sini...</p>&#10;<ul>&#10;  <li>Poin pertama</li>&#10;  <li>Poin kedua</li>&#10;</ul>"
                      value={editingArticle.content || ''}
                      onChange={(e) => handleArticleFieldChange('content', e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-800 bg-slate-950 text-emerald-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none leading-relaxed selection:bg-emerald-800"
                    />
                    <div className="flex items-center justify-between text-[11px] text-mutedtext px-1">
                      <span>Mendukung tag HTML: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;blockquote&gt;, &lt;div&gt;</span>
                      <span className="font-mono text-[10px]">{(editingArticle.content || '').length} karakter</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <textarea
                      id="article-content-textarea"
                      rows={7}
                      placeholder="Tuliskan isi pembahasan edukasi psikologi lengkap di sini (bisa gunakan baris baru atau markdown ### untuk sub-judul)..."
                      value={editingArticle.content || ''}
                      onChange={(e) => handleArticleFieldChange('content', e.target.value)}
                      className="w-full p-3.5 rounded-2xl border border-softborder bg-gray-50 text-xs sm:text-sm text-darktext focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                    />
                    <div className="flex items-center justify-between text-[11px] text-mutedtext px-1">
                      <span>Gunakan mode ini untuk teks biasa / markdown, atau beralih ke <strong>Mode Kode (HTML)</strong> untuk format HTML.</span>
                      <span className="font-mono text-[10px]">{(editingArticle.content || '').length} karakter</span>
                    </div>
                  </div>
                )}
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
