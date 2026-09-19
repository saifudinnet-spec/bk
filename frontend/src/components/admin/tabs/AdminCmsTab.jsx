import React, { useState } from 'react';
import {
  Sparkles,
  Star,
  Compass,
  HeartHandshake,
  MessageSquareHeart,
  HelpCircle,
  ShieldCheck,
  Building2,
  LayoutTemplate,
  Upload,
  Trash2,
  Plus,
  RotateCcw,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../../../services/api';

export const AdminCmsTab = ({
  landingContent,
  setLandingContent,
  cmsSubTab,
  setCmsSubTab,
  showSuccess,
  showError
}) => {
  const [isSavingCms, setIsSavingCms] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [openFaqIndices, setOpenFaqIndices] = useState({ 0: true });
  const [openProblemIndices, setOpenProblemIndices] = useState({ 0: true });
  const [openTestimonialIndices, setOpenTestimonialIndices] = useState({ 0: true });
  const [openServiceIndices, setOpenServiceIndices] = useState({ 0: true });

  const toggleService = (idx) => {
    setOpenServiceIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleTestimonial = (idx) => {
    setOpenTestimonialIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleProblem = (idx) => {
    setOpenProblemIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleFaq = (idx) => {
    setOpenFaqIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // CMS Handlers
  const handleHeroChange = (field, value) => {
    setLandingContent((prev) => {
      const updatedHero = {
        ...prev?.hero,
        [field]: value,
      };

      if (field === 'image_url') {
        const currentBanners = (prev?.hero?.banner_images || [])
          .map((img) => (typeof img === 'string' ? img : img?.url))
          .filter(Boolean);
        const nextBanners = value ? [value, ...currentBanners.filter((u) => u !== value)] : currentBanners;
        updatedHero.banner_images = nextBanners;
      }

      return {
        ...prev,
        hero: updatedHero,
      };
    });
  };

  const handleAddBannerSlide = (newUrl) => {
    if (!newUrl) return;
    setLandingContent((prev) => {
      const currentList = (prev?.hero?.banner_images || [prev?.hero?.image_url || '/images/banner1.jpg'])
        .map((img) => (typeof img === 'string' ? img : img?.url))
        .filter(Boolean);
      if (!currentList.includes(newUrl)) {
        currentList.push(newUrl);
      }
      return {
        ...prev,
        hero: {
          ...prev?.hero,
          image_url: prev?.hero?.image_url || currentList[0],
          banner_images: currentList,
        },
      };
    });
    showSuccess('Banner berhasil ditambahkan ke daftar slide!');
  };

  const handleSetPrimaryBanner = (url) => {
    setLandingContent((prev) => {
      const currentList = (prev?.hero?.banner_images || [url])
        .map((img) => (typeof img === 'string' ? img : img?.url))
        .filter(Boolean);
      const reordered = [url, ...currentList.filter((u) => u !== url)];
      return {
        ...prev,
        hero: {
          ...prev?.hero,
          image_url: url,
          banner_images: reordered,
        },
      };
    });
    showSuccess('Banner utama berhasil diatur!');
  };

  const handleRemoveBannerSlide = async (indexToRemove) => {
    const currentList = (
      Array.isArray(landingContent?.hero?.banner_images)
        ? landingContent.hero.banner_images
        : [landingContent?.hero?.image_url || '/images/banner1.jpg', '/images/banner3.jpg']
    )
      .map((img) => (typeof img === 'string' ? img : img?.url))
      .filter(Boolean);

    const urlToDelete = currentList[indexToRemove];
    if (!urlToDelete) return;

    // Immediately update local state so UI feels instant
    const filtered = currentList.filter((_, i) => i !== indexToRemove);
    const optimisticContent = {
      ...landingContent,
      hero: {
        ...landingContent?.hero,
        image_url: filtered[0] || '',
        banner_images: filtered,
      },
    };
    setLandingContent(optimisticContent);

    try {
      const res = await api.post('/admin/landing-content/delete-image', {
        image_url: urlToDelete,
      });

      const updatedContent = res?.data || res;
      if (updatedContent && updatedContent.hero) {
        setLandingContent(updatedContent);
        try {
          localStorage.setItem('bk_landing_content', JSON.stringify({ data: updatedContent, ts: Date.now() }));
        } catch (_) {}
      }
      showSuccess('Foto banner berhasil dihapus!');
    } catch (err) {
      console.error('Delete banner error:', err);
      showError(err?.response?.data?.message || err?.message || 'Gagal menghapus foto dari server.');
    }
  };

  const handleBannerFileUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].size > 10 * 1024 * 1024) {
        showError(`Ukuran file "${fileList[i].name}" maksimal 10MB.`);
        return;
      }
    }

    setIsUploadingBanner(true);
    const formData = new FormData();
    if (fileList.length === 1) {
      formData.append('image', fileList[0]);
    } else {
      for (let i = 0; i < fileList.length; i++) {
        formData.append('images[]', fileList[i]);
      }
    }

    try {
      showSuccess(`Mengunggah ${fileList.length} gambar banner ke server...`);
      // NOTE: DO NOT pass Content-Type header so fetch creates the multipart boundary
      const res = await api.post('/admin/landing-content/upload-image', formData);

      const updatedContent = res?.data;
      if (updatedContent && updatedContent.hero) {
        setLandingContent(updatedContent);
        try {
          localStorage.setItem('bk_landing_content', JSON.stringify({ data: updatedContent, ts: Date.now() }));
        } catch (_) {}
        showSuccess(`${fileList.length} foto banner baru berhasil diunggah & disimpan otomatis!`);
      } else if (res?.urls || res?.url) {
        const newUrls = res.urls || [res.url];
        setLandingContent((prev) => {
          const currentList = (prev?.hero?.banner_images || [])
            .map((img) => (typeof img === 'string' ? img : img?.url))
            .filter(Boolean);
          const combined = Array.from(new Set([...currentList, ...newUrls]));
          const updated = {
            ...prev,
            hero: {
              ...prev?.hero,
              image_url: combined[0] || '',
              banner_images: combined,
            },
          };
          try {
            localStorage.setItem('bk_landing_content', JSON.stringify({ data: updated, ts: Date.now() }));
          } catch (_) {}
          return updated;
        });
        showSuccess('Foto banner baru berhasil diunggah!');
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

  const handleClearBannerImage = async () => {
    if (!window.confirm('Hapus seluruh foto banner kustom dari server?')) return;

    try {
      showSuccess('Menghapus seluruh foto banner...');
      const res = await api.post('/admin/landing-content/delete-image', {
        clean_all_custom_banners: true,
      });

      const updatedContent = res?.data;
      if (updatedContent && updatedContent.hero) {
        setLandingContent(updatedContent);
        try {
          localStorage.setItem('bk_landing_content', JSON.stringify({ data: updatedContent, ts: Date.now() }));
        } catch (_) {}
      } else {
        setLandingContent((prev) => ({
          ...prev,
          hero: {
            ...prev?.hero,
            image_url: '',
            banner_images: [],
          },
        }));
      }

      showSuccess('Semua foto banner telah dibersihkan!');
    } catch (err) {
      console.error('Clear banners error:', err);
      showError('Gagal membersihkan foto.');
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

  // WordPress-style Article Actions

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

  const handleTestimonialSectionChange = (field, value) => {
    setLandingContent((prev) => {
      const current = typeof prev?.testimonials === 'object' && !Array.isArray(prev?.testimonials)
        ? prev.testimonials
        : {
            tag: 'Pengalaman Mahasiswa',
            title: 'Cerita Mahasiswa yang Telah Bertumbuh',
            subtitle: 'Mendengar pengalaman mereka yang menemukan kembali ketenangan dan kejelasan pikiran.',
            items: Array.isArray(prev?.testimonials) ? prev.testimonials : [
              { id: 1, name: 'Fadhil R.', faculty: 'Mahasiswa Teknik Informatika - Semester 7', text: 'Sangat terbantu saat stuck skripsi dan overthinking masa depan. Konselornya ramah dan tidak menghakimi sama sekali. Sekarang jauh lebih lega dan fokus.', rating: 5 },
              { id: 2, name: 'Nabila S.', faculty: 'Mahasiswi Psikologi - Semester 5', text: 'Platformnya nyaman banget, bisa langsung video call tanpa ribet. Ruang yang benar-benar aman buat menumpahkan unek-unek tanpa takut di judge.', rating: 5 },
              { id: 3, name: 'Rian H.', faculty: 'Mahasiswa Manajemen - Semester 3', text: 'Adaptasi kuliah rantau sempat bikin stres berat. Setelah 2 sesi konseling, saya dapat tips regulasi emosi yang praktis dan aplikatif.', rating: 5 },
            ]
          };
      return {
        ...prev,
        testimonials: {
          ...current,
          [field]: value,
        }
      };
    });
  };

  const handleTestimonialItemChange = (index, field, value) => {
    setLandingContent((prev) => {
      let items = [];
      let base = {
        tag: 'Pengalaman Mahasiswa',
        title: 'Cerita Mahasiswa yang Telah Bertumbuh',
        subtitle: 'Mendengar pengalaman mereka yang menemukan kembali ketenangan dan kejelasan pikiran.',
      };
      if (typeof prev?.testimonials === 'object' && !Array.isArray(prev?.testimonials)) {
        base = { ...base, ...prev.testimonials };
        items = [...(prev.testimonials.items || [])];
      } else if (Array.isArray(prev?.testimonials)) {
        items = [...prev.testimonials];
      }
      if (items.length === 0) {
        items = [
          { id: 1, name: 'Fadhil R.', faculty: 'Mahasiswa Teknik Informatika - Semester 7', text: 'Sangat terbantu saat stuck skripsi dan overthinking masa depan. Konselornya ramah dan tidak menghakimi sama sekali. Sekarang jauh lebih lega dan fokus.', rating: 5 },
          { id: 2, name: 'Nabila S.', faculty: 'Mahasiswi Psikologi - Semester 5', text: 'Platformnya nyaman banget, bisa langsung video call tanpa ribet. Ruang yang benar-benar aman buat menumpahkan unek-unek tanpa takut di judge.', rating: 5 },
          { id: 3, name: 'Rian H.', faculty: 'Mahasiswa Manajemen - Semester 3', text: 'Adaptasi kuliah rantau sempat bikin stres berat. Setelah 2 sesi konseling, saya dapat tips regulasi emosi yang praktis dan aplikatif.', rating: 5 },
        ];
      }
      items[index] = { ...items[index], [field]: value };
      return {
        ...prev,
        testimonials: {
          ...base,
          items,
        }
      };
    });
  };

  const handleAddTestimonial = () => {
    setLandingContent((prev) => {
      let items = [];
      let base = {
        tag: 'Pengalaman Mahasiswa',
        title: 'Cerita Mahasiswa yang Telah Bertumbuh',
        subtitle: 'Mendengar pengalaman mereka yang menemukan kembali ketenangan dan kejelasan pikiran.',
      };
      if (typeof prev?.testimonials === 'object' && !Array.isArray(prev?.testimonials)) {
        base = { ...base, ...prev.testimonials };
        items = [...(prev.testimonials.items || [])];
      } else if (Array.isArray(prev?.testimonials)) {
        items = [...prev.testimonials];
      }
      if (items.length === 0) {
        items = [
          { id: 1, name: 'Fadhil R.', faculty: 'Mahasiswa Teknik Informatika - Semester 7', text: 'Sangat terbantu saat stuck skripsi dan overthinking masa depan. Konselornya ramah dan tidak menghakimi sama sekali. Sekarang jauh lebih lega dan fokus.', rating: 5 },
          { id: 2, name: 'Nabila S.', faculty: 'Mahasiswi Psikologi - Semester 5', text: 'Platformnya nyaman banget, bisa langsung video call tanpa ribet. Ruang yang benar-benar aman buat menumpahkan unek-unek tanpa takut di judge.', rating: 5 },
          { id: 3, name: 'Rian H.', faculty: 'Mahasiswa Manajemen - Semester 3', text: 'Adaptasi kuliah rantau sempat bikin stres berat. Setelah 2 sesi konseling, saya dapat tips regulasi emosi yang praktis dan aplikatif.', rating: 5 },
        ];
      }
      const newIdx = items.length;
      items.push({
        id: Date.now(),
        name: 'Nama Mahasiswa Baru',
        faculty: 'Program Studi / Fakultas - Semester X',
        text: 'Tuliskan kutipan cerita atau ulasan konseling di sini...',
        rating: 5,
      });
      setOpenTestimonialIndices((p) => ({ ...p, [newIdx]: true }));
      return {
        ...prev,
        testimonials: {
          ...base,
          items,
        }
      };
    });
  };

  const handleRemoveTestimonial = (index) => {
    setLandingContent((prev) => {
      let items = [];
      let base = {
        tag: 'Pengalaman Mahasiswa',
        title: 'Cerita Mahasiswa yang Telah Bertumbuh',
        subtitle: 'Mendengar pengalaman mereka yang menemukan kembali ketenangan dan kejelasan pikiran.',
      };
      if (typeof prev?.testimonials === 'object' && !Array.isArray(prev?.testimonials)) {
        base = { ...base, ...prev.testimonials };
        items = [...(prev.testimonials.items || [])];
      } else if (Array.isArray(prev?.testimonials)) {
        items = [...prev.testimonials];
      }
      items = items.filter((_, i) => i !== index);
      return {
        ...prev,
        testimonials: {
          ...base,
          items,
        }
      };
    });
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

if (!landingContent) return null;

  return (
    <form onSubmit={handleSaveLandingContent} className="space-y-6">
      {/* CMS Top Header & Action Card */}
          <div className="p-5 md:p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-sm">
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-darktext">
                      Editor Konten Landing Page
                    </h3>
                  </div>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl border border-softborder bg-gray-50 hover:bg-gray-100 text-darktext text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Buka Landing Page di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-mutedtext" />
                  <span>Lihat Landing Page</span>
                </a>
                <button
                  type="submit"
                  disabled={isSavingCms}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[38px]"
                >
                  {isSavingCms ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Konten</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 0: Top Bar & Menu Navigasi (CMS) */}
          {(cmsSubTab === 'navbar' || cmsSubTab === 'all') && (
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
          )}

          {/* Section 1: Hero Banner */}
          {(cmsSubTab === 'hero' || cmsSubTab === 'all') && (
            <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
            <h4 className="text-sm font-bold text-darktext border-b border-gray-100 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Bagian Utama (Hero Section)</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-darktext mb-1">
                Judul Utama (Headline H1)
              </label>
              <textarea
                rows={2}
                value={landingContent?.hero?.title || ''}
                onChange={(e) => handleHeroChange('title', e.target.value)}
                placeholder="Beri Ruang untuk Dirimu.\nCeritakan, Pulihkan, Lanjutkan."
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

            {/* Ganti Banner & Carousel Multi-Slide */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div>
                  <label className="block text-xs font-bold text-darktext flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Slide Banner Utama (Carousel) ({
                      (Array.isArray(landingContent?.hero?.banner_images)
                        ? landingContent.hero.banner_images
                        : [landingContent?.hero?.image_url || '/images/banner1.jpg', '/images/banner3.jpg']
                      ).length
                    })</span>
                  </label>
                  <p className="text-[11px] text-mutedtext mt-0.5">
                    Foto-foto di bawah akan berputar otomatis setiap 3 detik di halaman depan. Anda dapat mengunggah banyak foto sekaligus.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className={`px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm ${isUploadingBanner ? 'opacity-60 pointer-events-none' : ''}`}>
                    {isUploadingBanner ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>+ Upload Foto Banner (Bisa Banyak)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isUploadingBanner}
                      onChange={handleBannerFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Grid Daftar Slide Banner Aktif */}
              {(() => {
                const activeBanners = (
                  Array.isArray(landingContent?.hero?.banner_images)
                    ? landingContent.hero.banner_images
                    : [landingContent?.hero?.image_url || '/images/banner1.jpg', '/images/banner3.jpg']
                )
                  .map((b) => (typeof b === 'string' ? b : b?.url))
                  .filter(Boolean);

                if (activeBanners.length === 0) {
                  return (
                    <div className="p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center space-y-3 bg-white">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-darktext">Belum Ada Slide Banner</p>
                        <p className="text-[11px] text-mutedtext mt-0.5">
                          Semua banner telah dihapus. Klik tombol <strong>+ Upload Foto Banner</strong> di atas untuk menambahkan slide baru, atau gunakan preset di bawah.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeBanners.map((bannerUrl, bIdx) => {
                      const isPrimary = bIdx === 0 || landingContent?.hero?.image_url === bannerUrl;

                      return (
                        <div
                          key={bannerUrl || bIdx}
                          className={`p-3 rounded-2xl border bg-white flex flex-col justify-between gap-2.5 transition-all shadow-2xs ${
                            isPrimary ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-gray-100 group">
                            <img
                              src={bannerUrl}
                              alt={`Slide ${bIdx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/images/banner1.jpg';
                              }}
                            />

                            {/* Badge Posisi Slide */}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                              {isPrimary ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>Slide 1 (Utama)</span>
                                </>
                              ) : (
                                <span>Slide {bIdx + 1}</span>
                              )}
                            </div>

                            {/* Tombol Hapus per-slide */}
                            <button
                              type="button"
                              onClick={() => handleRemoveBannerSlide(bIdx)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md cursor-pointer"
                              title="Hapus slide ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={bannerUrl}
                              readOnly
                              className="w-full h-7 px-2 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-mono text-mutedtext truncate select-all"
                              title={bannerUrl}
                            />

                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              {!isPrimary ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryBanner(bannerUrl)}
                                  className="w-full py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-colors border border-emerald-200 cursor-pointer"
                                >
                                  Jadikan Slide Utama
                                </button>
                              ) : (
                                <span className="w-full text-center py-1 rounded-lg bg-emerald-100/70 text-emerald-900 text-[11px] font-extrabold flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Slide Utama Aktif</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Preset Pilihan Cepat */}
              <div className="p-3 rounded-xl bg-white border border-gray-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-mutedtext font-bold">+ Tambah Preset Bawaan:</span>
                  <button
                    type="button"
                    onClick={() => handleAddBannerSlide('/images/banner1.jpg')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-darktext transition-all"
                  >
                    + Banner 1 (Ruang Konseling)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBannerSlide('/images/banner3.jpg')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-darktext transition-all"
                  >
                    + Banner 2 (Lounge Mahasiswa)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClearBannerImage}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Bersihkan Semua Foto Kustom
                </button>
              </div>
            </div>

            {/* Pengaturan Kartu Layanan Mode Cepat (Hero Section) */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 space-y-4">
              <span className="text-xs font-bold text-emerald-900 block">
                Pengaturan Kartu Layanan Mode Cepat (Hero Section)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Online Card */}
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/70 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    1. Kartu Konseling Online (Zoom)
                  </span>
                  <div>
                    <label className="block text-[11px] font-semibold text-darktext mb-1">Judul Layanan Online</label>
                    <input
                      type="text"
                      value={landingContent?.hero?.online_card_title ?? 'Konseling Individu Online'}
                      onChange={(e) => handleHeroChange('online_card_title', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-softborder bg-gray-50 text-xs font-bold text-darktext focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-darktext mb-1">Lencana / Badge</label>
                    <input
                      type="text"
                      value={landingContent?.hero?.online_card_badge ?? 'Online'}
                      onChange={(e) => handleHeroChange('online_card_badge', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-darktext mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={2}
                      value={landingContent?.hero?.online_card_desc ?? 'Sesi video privat via Zoom terenkripsi dari mana saja, fleksibel dengan jadwal perkuliahan Anda.'}
                      onChange={(e) => handleHeroChange('online_card_desc', e.target.value)}
                      className="w-full p-2 rounded-lg border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
                    />
                  </div>
                </div>

                {/* Offline Card */}
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/70 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    2. Kartu Konseling Tatap Muka (Offline)
                  </span>
                  <div>
                    <label className="block text-[11px] font-semibold text-darktext mb-1">Judul Layanan Tatap Muka</label>
                    <input
                      type="text"
                      value={landingContent?.hero?.offline_card_title ?? 'Konseling Tatap Muka Kampus'}
                      onChange={(e) => handleHeroChange('offline_card_title', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-softborder bg-gray-50 text-xs font-bold text-darktext focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-darktext mb-1">Lencana / Badge</label>
                    <input
                      type="text"
                      value={landingContent?.hero?.offline_card_badge ?? 'Offline'}
                      onChange={(e) => handleHeroChange('offline_card_badge', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-darktext mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={2}
                      value={landingContent?.hero?.offline_card_desc ?? 'Pertemuan tatap muka langsung di Ruang Konseling Gedung Pusat Kemahasiswaan yang privat dan nyaman.'}
                      onChange={(e) => handleHeroChange('offline_card_desc', e.target.value)}
                      className="w-full p-2 rounded-lg border border-softborder bg-gray-50 text-xs text-darktext focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Section 2: Services / Layanan Bimbingan (Accordion / Collapsible) */}
          {(cmsSubTab === 'services' || cmsSubTab === 'all') && (
            <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Seluruh Layanan Bimbingan ({landingContent?.services?.items?.length || 0})</span>
                  </h4>
                  <p className="text-[11px] text-mutedtext mt-0.5">
                    Kelola nama layanan, deskripsi, kategori/tag, dan ikon yang ditampilkan pada website.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Layanan</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(!landingContent?.services?.items || landingContent.services.items.length === 0) && (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-mutedtext">Belum ada layanan bimbingan.</p>
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      + Tambah Layanan Pertama
                    </button>
                  </div>
                )}

                {landingContent?.services?.items?.map((srv, idx) => {
                  const isOpen = Boolean(openServiceIndices[idx]);
                  return (
                    <div
                      key={srv.id || idx}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? 'border-emerald-400 bg-emerald-50/20 shadow-sm'
                          : 'border-gray-200 bg-gray-50/70 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => toggleService(idx)}
                        className="w-full p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                              isOpen ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-darktext truncate">
                            {srv.title || <span className="italic text-mutedtext">Nama layanan belum diisi...</span>}
                          </span>
                          {srv.tag && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              {srv.tag}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleService(idx)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors ${
                              isOpen
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-white border border-softborder text-darktext hover:bg-gray-100'
                            }`}
                          >
                            {isOpen ? (
                              <>
                                <span>Tutup</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>Buka / Edit</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            title="Hapus Layanan"
                            onClick={() => handleRemoveService(idx)}
                            className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div className="p-4 pt-2 border-t border-emerald-100/70 bg-white space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-darktext mb-1">Nama Layanan:</label>
                              <input
                                type="text"
                                placeholder="misal: Konseling Individu Online"
                                value={srv.title || ''}
                                onChange={(e) => handleServiceChange(idx, 'title', e.target.value)}
                                className="w-full h-10 px-3.5 rounded-xl border border-softborder bg-gray-50/50 text-xs font-semibold text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-darktext mb-1">Kategori / Tag:</label>
                              <input
                                type="text"
                                placeholder="misal: Online / Offline"
                                value={srv.tag || ''}
                                onChange={(e) => handleServiceChange(idx, 'tag', e.target.value)}
                                className="w-full h-10 px-3.5 rounded-xl border border-softborder bg-gray-50/50 text-xs font-semibold text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-darktext mb-1">Ikon Layanan:</label>
                              <select
                                value={srv.icon || 'Sparkles'}
                                onChange={(e) => handleServiceChange(idx, 'icon', e.target.value)}
                                className="w-full h-10 px-3.5 rounded-xl border border-softborder bg-gray-50/50 text-xs font-semibold text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              >
                                <option value="Video">📹 Icon: Video Zoom</option>
                                <option value="Building2">🏛️ Icon: Gedung / Offline</option>
                                <option value="Sparkles">✨ Icon: Sparkles</option>
                                <option value="Compass">🧭 Icon: Compass</option>
                                <option value="GraduationCap">🎓 Icon: Topi Wisuda</option>
                                <option value="Brain">🧠 Icon: Brain</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-darktext mb-1">Deskripsi Layanan:</label>
                            <textarea
                              rows={2}
                              placeholder="Deskripsi penjelasan layanan..."
                              value={srv.desc || ''}
                              onChange={(e) => handleServiceChange(idx, 'desc', e.target.value)}
                              className="w-full p-3 rounded-xl border border-softborder bg-gray-50/50 text-xs text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all leading-relaxed"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-mutedtext pt-1 border-t border-gray-100">
                            <span>Perubahan kartu layanan akan aktif setelah menekan Simpan.</span>
                            <button
                              type="button"
                              onClick={() => toggleService(idx)}
                              className="font-bold text-emerald-700 hover:underline"
                            >
                              Selesai Edit (Ciutkan)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Problem Topics ("Sedang Menghadapi Masalah Apa?") (Accordion / Collapsible) */}
          {(cmsSubTab === 'problems' || cmsSubTab === 'all') && (
            <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                    <MessageSquareHeart className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Topik Permasalahan ({landingContent?.problems?.items?.length || 0})</span>
                  </h4>
                  <p className="text-[11px] text-mutedtext mt-0.5">
                    Klik pada judul topik permasalahan untuk membuka/menutup detail dan mengedit kontennya (Sistem Accordion).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAddProblem}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Topik</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(!landingContent?.problems?.items || landingContent.problems.items.length === 0) && (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-mutedtext">Belum ada topik permasalahan.</p>
                    <button
                      type="button"
                      onClick={handleAddProblem}
                      className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      + Tambah Topik Pertama
                    </button>
                  </div>
                )}

                {landingContent?.problems?.items?.map((prob, idx) => {
                  const isOpen = Boolean(openProblemIndices[idx]);
                  return (
                    <div
                      key={prob.id || idx}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? 'border-emerald-400 bg-emerald-50/20 shadow-sm'
                          : 'border-gray-200 bg-gray-50/70 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {/* Accordion Header (Baris Judul Topik yang bisa diklik) */}
                      <div
                        onClick={() => toggleProblem(idx)}
                        className="w-full p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                              isOpen ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-darktext truncate">
                            {prob.title ? (
                              prob.title
                            ) : (
                              <span className="italic text-mutedtext">Judul topik belum diisi...</span>
                            )}
                          </span>
                          {prob.tag && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              {prob.tag}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleProblem(idx)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors ${
                              isOpen
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-white border border-softborder text-darktext hover:bg-gray-100'
                            }`}
                          >
                            {isOpen ? (
                              <>
                                <span>Tutup</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>Buka / Edit</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            title="Hapus Topik"
                            onClick={() => handleRemoveProblem(idx)}
                            className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Accordion Body (Form Edit Judul, Tag & Deskripsi saat dibuka) */}
                      {isOpen && (
                        <div className="p-4 pt-2 border-t border-emerald-100/70 bg-white space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-darktext mb-1 flex items-center gap-1">
                                <Edit3 className="w-3 h-3 text-emerald-600" />
                                <span>Judul Topik Permasalahan:</span>
                              </label>
                              <input
                                type="text"
                                placeholder="misal: Akademik & Skripsi"
                                value={prob.title}
                                onChange={(e) => handleProblemChange(idx, 'title', e.target.value)}
                                className="w-full h-10 px-3.5 rounded-xl border border-softborder bg-gray-50/50 text-xs font-semibold text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-darktext mb-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>Kategori / Tag:</span>
                              </label>
                              <input
                                type="text"
                                placeholder="misal: Akademik"
                                value={prob.tag}
                                onChange={(e) => handleProblemChange(idx, 'tag', e.target.value)}
                                className="w-full h-10 px-3.5 rounded-xl border border-softborder bg-gray-50/50 text-xs font-semibold text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-darktext mb-1 flex items-center gap-1">
                              <MessageSquareHeart className="w-3 h-3 text-emerald-600" />
                              <span>Deskripsi Permasalahan:</span>
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Deskripsikan contoh situasi masalah atau gejala yang dialami..."
                              value={prob.desc}
                              onChange={(e) => handleProblemChange(idx, 'desc', e.target.value)}
                              className="w-full p-3 rounded-xl border border-softborder bg-gray-50/50 text-xs text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all leading-relaxed"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-mutedtext pt-1 border-t border-gray-100">
                            <span>Perubahan akan aktif di landing page setelah menekan tombol Simpan di atas.</span>
                            <button
                              type="button"
                              onClick={() => toggleProblem(idx)}
                              className="font-bold text-emerald-700 hover:underline"
                            >
                              Selesai Edit (Ciutkan)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: FAQs (Accordion / Collapsible) */}
          {(cmsSubTab === 'faqs' || cmsSubTab === 'all') && (
            <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>Pertanyaan yang Sering Diajukan (FAQ) ({landingContent?.faqs?.length || 0})</span>
                  </h4>
                  <p className="text-[11px] text-mutedtext mt-0.5">
                    Klik pada judul pertanyaan untuk membuka/menutup jawaban dan mengedit kontennya (Sistem Accordion).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah FAQ</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(!landingContent?.faqs || landingContent.faqs.length === 0) && (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-mutedtext">Belum ada FAQ yang ditambahkan.</p>
                    <button
                      type="button"
                      onClick={handleAddFaq}
                      className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      + Tambah Pertanyaan Pertama
                    </button>
                  </div>
                )}

                {landingContent?.faqs?.map((faq, idx) => {
                  const isOpen = Boolean(openFaqIndices[idx]);
                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? 'border-emerald-400 bg-emerald-50/20 shadow-sm'
                          : 'border-gray-200 bg-gray-50/70 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {/* Accordion Header (Baris Pertanyaan yang bisa diklik) */}
                      <div
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                              isOpen ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-darktext truncate">
                            {faq.question ? (
                              faq.question
                            ) : (
                              <span className="italic text-mutedtext">Pertanyaan belum diisi...</span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleFaq(idx)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors ${
                              isOpen
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-white border border-softborder text-darktext hover:bg-gray-100'
                            }`}
                          >
                            {isOpen ? (
                              <>
                                <span>Tutup</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>Buka / Edit</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            title="Hapus FAQ"
                            onClick={() => handleRemoveFaq(idx)}
                            className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Accordion Body (Form Edit Pertanyaan & Jawaban yang muncul saat diklik) */}
                      {isOpen && (
                        <div className="p-4 pt-2 border-t border-emerald-100/70 bg-white space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-darktext mb-1 flex items-center gap-1">
                              <Edit3 className="w-3 h-3 text-emerald-600" />
                              <span>Pertanyaan:</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Tuliskan pertanyaan FAQ..."
                              value={faq.question}
                              onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                              className="w-full h-10 px-3.5 rounded-xl border border-softborder bg-gray-50/50 text-xs font-semibold text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-darktext mb-1 flex items-center gap-1">
                              <MessageSquareHeart className="w-3 h-3 text-emerald-600" />
                              <span>Jawaban / Penjelasan:</span>
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Tuliskan jawaban penjelasan lengkap..."
                              value={faq.answer}
                              onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                              className="w-full p-3 rounded-xl border border-softborder bg-gray-50/50 text-xs text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all leading-relaxed"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-mutedtext pt-1 border-t border-gray-100">
                            <span>Perubahan akan aktif di landing page setelah menekan tombol Simpan di atas.</span>
                            <button
                              type="button"
                              onClick={() => toggleFaq(idx)}
                              className="font-bold text-emerald-700 hover:underline"
                            >
                              Selesai Edit (Ciutkan)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 5: Testimoni Mahasiswa (Accordion / Collapsible) */}
          {(cmsSubTab === 'testimonials' || cmsSubTab === 'all') && (
            <div className="p-6 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-darktext flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Kelola Testimoni & Cerita Mahasiswa</span>
                  </h4>
                  <p className="text-[11px] text-mutedtext mt-0.5">
                    Data testimoni akan ditampilkan berputar (*rolling marquee*) otomatis di halaman depan.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAddTestimonial}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Testimoni</span>
                  </button>
                </div>
              </div>

              {/* Judul & Sub-judul Bagian Testimoni */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Header Bagian Testimoni di Landing Page
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-darktext mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={
                        (typeof landingContent?.testimonials === 'object' && !Array.isArray(landingContent?.testimonials)
                          ? landingContent.testimonials.tag
                          : '') || 'Pengalaman Mahasiswa'
                      }
                      onChange={(e) => handleTestimonialSectionChange('tag', e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-softborder bg-white text-xs text-darktext"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-darktext mb-1">Judul Utama Testimoni</label>
                    <input
                      type="text"
                      value={
                        (typeof landingContent?.testimonials === 'object' && !Array.isArray(landingContent?.testimonials)
                          ? landingContent.testimonials.title
                          : '') || 'Cerita Mahasiswa yang Telah Bertumbuh'
                      }
                      onChange={(e) => handleTestimonialSectionChange('title', e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-softborder bg-white text-xs font-bold text-darktext"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-darktext mb-1">Sub-Judul / Keterangan</label>
                  <textarea
                    rows={2}
                    value={
                      (typeof landingContent?.testimonials === 'object' && !Array.isArray(landingContent?.testimonials)
                        ? landingContent.testimonials.subtitle
                        : '') || 'Mendengar pengalaman mereka yang menemukan kembali ketenangan dan kejelasan pikiran.'
                    }
                    onChange={(e) => handleTestimonialSectionChange('subtitle', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-softborder bg-white text-xs text-darktext"
                  />
                </div>
              </div>

              {/* Daftar Testimoni Accordion */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-darktext block">
                  Daftar Kartu Ulasan ({
                    (Array.isArray(landingContent?.testimonials)
                      ? landingContent.testimonials
                      : landingContent?.testimonials?.items || []).length || 3
                  })
                </span>

                {(
                  Array.isArray(landingContent?.testimonials)
                    ? landingContent.testimonials
                    : (landingContent?.testimonials?.items && landingContent.testimonials.items.length > 0)
                      ? landingContent.testimonials.items
                      : [
                          { id: 1, name: 'Fadhil R.', faculty: 'Mahasiswa Teknik Informatika - Semester 7', text: 'Sangat terbantu saat stuck skripsi dan overthinking masa depan. Konselornya ramah dan tidak menghakimi sama sekali. Sekarang jauh lebih lega dan fokus.', rating: 5 },
                          { id: 2, name: 'Nabila S.', faculty: 'Mahasiswi Psikologi - Semester 5', text: 'Platformnya nyaman banget, bisa langsung video call tanpa ribet. Ruang yang benar-benar aman buat menumpahkan unek-unek tanpa takut di judge.', rating: 5 },
                          { id: 3, name: 'Rian H.', faculty: 'Mahasiswa Manajemen - Semester 3', text: 'Adaptasi kuliah rantau sempat bikin stres berat. Setelah 2 sesi konseling, saya dapat tips regulasi emosi yang praktis dan aplikatif.', rating: 5 },
                        ]
                ).map((t, idx) => {
                  const isOpen = Boolean(openTestimonialIndices[idx]);
                  return (
                    <div
                      key={t.id || idx}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? 'border-emerald-400 bg-emerald-50/20 shadow-sm'
                          : 'border-gray-200 bg-gray-50/70 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => toggleTestimonial(idx)}
                        className="w-full p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                              isOpen ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xs font-bold text-darktext truncate">
                              {t.name || <span className="italic text-mutedtext">Nama belum diisi...</span>}
                            </span>
                            {t.faculty && (
                              <span className="text-[10px] text-mutedtext truncate hidden sm:inline">
                                • {t.faculty}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                            {[...Array(Number(t.rating) || 5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleTestimonial(idx)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors ${
                              isOpen
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-white border border-softborder text-darktext hover:bg-gray-100'
                            }`}
                          >
                            {isOpen ? (
                              <>
                                <span>Tutup</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>Buka / Edit</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            title="Hapus Testimoni"
                            onClick={() => handleRemoveTestimonial(idx)}
                            className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div className="p-4 pt-2 border-t border-emerald-100/70 bg-white space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-darktext mb-1">Nama Mahasiswa:</label>
                              <input
                                type="text"
                                placeholder="misal: Fadhil R."
                                value={t.name || ''}
                                onChange={(e) => handleTestimonialItemChange(idx, 'name', e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50/50 text-xs font-semibold text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-darktext mb-1">Prodi & Semester:</label>
                              <input
                                type="text"
                                placeholder="misal: Mahasiswa Teknik Informatika - Semester 7"
                                value={t.faculty || ''}
                                onChange={(e) => handleTestimonialItemChange(idx, 'faculty', e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50/50 text-xs font-semibold text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-darktext mb-1">Rating Kepuasan:</label>
                              <select
                                value={t.rating || 5}
                                onChange={(e) => handleTestimonialItemChange(idx, 'rating', Number(e.target.value))}
                                className="w-full h-10 px-3 rounded-xl border border-softborder bg-gray-50/50 text-xs font-semibold text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                              >
                                <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang - Sangat Puas)</option>
                                <option value={4}>⭐⭐⭐⭐ (4 Bintang - Puas)</option>
                                <option value={3}>⭐⭐⭐ (3 Bintang - Cukup)</option>
                                <option value={2}>⭐⭐ (2 Bintang - Kurang)</option>
                                <option value={1}>⭐ (1 Bintang)</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-darktext mb-1">Isi Testimoni / Pengalaman:</label>
                            <textarea
                              rows={3}
                              placeholder="Tuliskan cerita pengalaman mahasiswa selama bimbingan konseling..."
                              value={t.text || t.quote || ''}
                              onChange={(e) => handleTestimonialItemChange(idx, 'text', e.target.value)}
                              className="w-full p-3 rounded-xl border border-softborder bg-gray-50/50 text-xs text-darktext focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none leading-relaxed"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-mutedtext pt-1 border-t border-gray-100">
                            <span>Perubahan akan aktif di landing page setelah menekan tombol Simpan di atas.</span>
                            <button
                              type="button"
                              onClick={() => toggleTestimonial(idx)}
                              className="font-bold text-emerald-700 hover:underline"
                            >
                              Selesai Edit (Ciutkan)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 6: Screening CTA Banner */}
          {(cmsSubTab === 'screening_cta' || cmsSubTab === 'all') && (
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
          )}

          {/* Section 7: Pengaturan Footer & Kontak Resmi Kampus */}
          {(cmsSubTab === 'footer' || cmsSubTab === 'all') && (
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
          )}
        </form>
  );
};

export default AdminCmsTab;
