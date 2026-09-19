import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';
import NaraVoiceManager from '../../components/admin/NaraVoiceManager';
import ArticleEditorModal from '../../components/admin/modals/ArticleEditorModal';
import ArticlePreviewModal from '../../components/admin/modals/ArticlePreviewModal';
import AdminOverviewTab from '../../components/admin/tabs/AdminOverviewTab';
import AdminUsersTab from '../../components/admin/tabs/AdminUsersTab';
import AdminCmsTab from '../../components/admin/tabs/AdminCmsTab';
import AdminArticlesTab from '../../components/admin/tabs/AdminArticlesTab';
import AdminAuditTab from '../../components/admin/tabs/AdminAuditTab';
import AdminSettingsTab from '../../components/admin/tabs/AdminSettingsTab';
import AdminZoomTab from '../../components/admin/tabs/AdminZoomTab';

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

  // CMS Landing Content State
  const [landingContent, setLandingContent] = useState(null);

  // CMS Submenu Navigation State
  const [cmsSubTab, setCmsSubTab] = useState(() => searchParams.get('sub') || 'hero');

  useEffect(() => {
    const subParam = searchParams.get('sub');
    if (subParam && subParam !== cmsSubTab) {
      setCmsSubTab(subParam);
    }
  }, [searchParams]);

  const handleSelectCmsSubTab = (subId) => {
    setCmsSubTab(subId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'cms');
    newParams.set('sub', subId);
    setSearchParams(newParams, { replace: true });
  };

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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition className="space-y-6">
      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <AdminOverviewTab
          data={data}
          settings={settings}
          setActiveTab={setActiveTab}
          setUserRoleFilter={setUserRoleFilter}
          setCounseleeSubFilter={setCounseleeSubFilter}
        />
      )}

      {/* 2. Users Tab (Kelola Pengguna: Konseli Mahasiswa & Umum, Konselor/Tutor, Administrator) */}
      {activeTab === 'users' && (
        <AdminUsersTab
          users={users}
          userRoleFilter={userRoleFilter}
          setUserRoleFilter={setUserRoleFilter}
          counseleeSubFilter={counseleeSubFilter}
          setCounseleeSubFilter={setCounseleeSubFilter}
          isLoadingUsers={isLoadingUsers}
          reloadUsers={reloadUsers}
          handleToggleUserStatus={handleToggleUserStatus}
        />
      )}

      {/* 2b. Tab Kelola Artikel Sendiri (WordPress Sederhana) */}
      {activeTab === 'articles' && (
        <AdminArticlesTab
          landingContent={landingContent}
          articleSearch={articleSearch}
          setArticleSearch={setArticleSearch}
          articleCategoryFilter={articleCategoryFilter}
          setArticleCategoryFilter={setArticleCategoryFilter}
          handleOpenCreateArticle={handleOpenCreateArticle}
          handleOpenEditArticle={handleOpenEditArticle}
          handleDeleteArticle={handleDeleteArticle}
          setPreviewArticle={setPreviewArticle}
        />
      )}

      {/* 3. CMS Tab: Kelola Konten Landing Page (Admin Gonta-Ganti Konten) */}
      {activeTab === 'cms' && landingContent && (
        <AdminCmsTab
          landingContent={landingContent}
          setLandingContent={setLandingContent}
          cmsSubTab={cmsSubTab}
          setCmsSubTab={handleSelectCmsSubTab}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}

      {/* 4. Audit Logs Tab */}
      {activeTab === 'audit' && (
        <AdminAuditTab auditLogs={auditLogs} />
      )}

      {/* 5, 6, 8, 9. Settings Tabs (Web, Counseling, Crisis, General) */}
      {(activeTab === 'web_settings' ||
        activeTab === 'counseling_settings' ||
        activeTab === 'settings' ||
        activeTab === 'crisis_settings' ||
        activeTab === 'general_settings') && (
        <AdminSettingsTab
          activeTab={activeTab}
          settings={settings}
          setSettings={setSettings}
          onSave={handleSaveSettings}
          isSavingSettings={isSavingSettings}
          setActiveTab={setActiveTab}
        />
      )}

      {/* 7. Zoom Integration Tab */}
      {activeTab === 'zoom_settings' && (
        <AdminZoomTab
          settings={settings}
          setSettings={setSettings}
          onSave={handleSaveSettings}
          isSavingSettings={isSavingSettings}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}

      {/* 6. Nara Voice Manager Tab */}
      {activeTab === 'voice' && (
        <NaraVoiceManager />
      )}

      {/* WordPress-like Article Editor Modal */}
      <ArticleEditorModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        editingArticle={editingArticle}
        setEditingArticle={setEditingArticle}
        editorMode={articleEditorMode}
        setEditorMode={setArticleEditorMode}
        onSave={handleSaveArticleModal}
        showSuccess={showSuccess}
        showError={showError}
      />

      {/* Modal Preview Artikel */}
      <ArticlePreviewModal
        previewArticle={previewArticle}
        onClose={() => setPreviewArticle(null)}
      />
    </PageTransition>
  );
};

export default AdminDashboard;
