import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  User,
  ShieldCheck,
  Award,
  Video,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  HeartHandshake,
  Users,
  Home,
  Compass,
  Star,
  PhoneCall,
  CheckCircle2,
  BookmarkCheck,
  BookOpen,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import api from '../../services/api';
import BottomSheet from '../../components/common/BottomSheet';
import PageTransition from '../../components/common/PageTransition';
import ScrollReveal from '../../components/common/ScrollReveal';
import { useCounselingFlow } from '../../store/CounselingFlowContext';

// Map icon names from CMS to Lucide React components
const iconMap = {
  GraduationCap,
  Brain,
  Sparkles,
  Users,
  Home,
  Compass,
  ShieldCheck,
  Award,
  Lock,
  Video,
  Building2,
  HeartHandshake
};

const problemPalettes = [
  {
    counselorLabel: '4 Konselor Akademik',
    orbBg: 'bg-gradient-to-br from-[#047857] via-emerald-600 to-teal-600',
    orbShadow: 'shadow-[0_10px_22px_-4px_rgba(5,150,105,0.38),inset_0_2px_4px_rgba(255,255,255,0.6)]',
    orbBottomBorder: 'border-emerald-900/30',
    orbHalo: 'bg-emerald-500/20',
    cardBg: 'from-white to-slate-50/50',
    border: 'border-emerald-100/90 hover:border-emerald-400/80',
    glowTop: 'bg-emerald-500/5',
    glowBottom: 'bg-teal-500/5',
    topBar: 'from-[#047857] via-emerald-600 to-teal-500',
    tag: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    titleHover: 'group-hover:text-emerald-950',
    descColor: 'text-slate-600',
    link: 'text-emerald-800 group-hover:text-emerald-950',
    buttonArrow: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_6px_14px_rgba(5,150,105,0.35)]',
    cardHoverShadow: 'hover:shadow-[0_20px_35px_-8px_rgba(5,150,105,0.14)]',
  },
  {
    counselorLabel: '3 Psikolog Klinis',
    orbBg: 'bg-gradient-to-br from-[#047857] via-emerald-600 to-teal-600',
    orbShadow: 'shadow-[0_10px_22px_-4px_rgba(5,150,105,0.38),inset_0_2px_4px_rgba(255,255,255,0.6)]',
    orbBottomBorder: 'border-emerald-900/30',
    orbHalo: 'bg-emerald-500/20',
    cardBg: 'from-white to-slate-50/50',
    border: 'border-emerald-100/90 hover:border-emerald-400/80',
    glowTop: 'bg-emerald-500/5',
    glowBottom: 'bg-teal-500/5',
    topBar: 'from-[#047857] via-emerald-600 to-teal-500',
    tag: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    titleHover: 'group-hover:text-emerald-950',
    descColor: 'text-slate-600',
    link: 'text-emerald-800 group-hover:text-emerald-950',
    buttonArrow: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_6px_14px_rgba(5,150,105,0.35)]',
    cardHoverShadow: 'hover:shadow-[0_20px_35px_-8px_rgba(5,150,105,0.14)]',
  },
  {
    counselorLabel: '4 Konselor Relaksasi',
    orbBg: 'bg-gradient-to-br from-[#047857] via-emerald-600 to-teal-600',
    orbShadow: 'shadow-[0_10px_22px_-4px_rgba(5,150,105,0.38),inset_0_2px_4px_rgba(255,255,255,0.6)]',
    orbBottomBorder: 'border-emerald-900/30',
    orbHalo: 'bg-emerald-500/20',
    cardBg: 'from-white to-slate-50/50',
    border: 'border-emerald-100/90 hover:border-emerald-400/80',
    glowTop: 'bg-emerald-500/5',
    glowBottom: 'bg-teal-500/5',
    topBar: 'from-[#047857] via-emerald-600 to-teal-500',
    tag: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    titleHover: 'group-hover:text-emerald-950',
    descColor: 'text-slate-600',
    link: 'text-emerald-800 group-hover:text-emerald-950',
    buttonArrow: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_6px_14px_rgba(5,150,105,0.35)]',
    cardHoverShadow: 'hover:shadow-[0_20px_35px_-8px_rgba(5,150,105,0.14)]',
  },
  {
    counselorLabel: '3 Konselor Sosial',
    orbBg: 'bg-gradient-to-br from-[#047857] via-emerald-600 to-teal-600',
    orbShadow: 'shadow-[0_10px_22px_-4px_rgba(5,150,105,0.38),inset_0_2px_4px_rgba(255,255,255,0.6)]',
    orbBottomBorder: 'border-emerald-900/30',
    orbHalo: 'bg-emerald-500/20',
    cardBg: 'from-white to-slate-50/50',
    border: 'border-emerald-100/90 hover:border-emerald-400/80',
    glowTop: 'bg-emerald-500/5',
    glowBottom: 'bg-teal-500/5',
    topBar: 'from-[#047857] via-emerald-600 to-teal-500',
    tag: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    titleHover: 'group-hover:text-emerald-950',
    descColor: 'text-slate-600',
    link: 'text-emerald-800 group-hover:text-emerald-950',
    buttonArrow: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_6px_14px_rgba(5,150,105,0.35)]',
    cardHoverShadow: 'hover:shadow-[0_20px_35px_-8px_rgba(5,150,105,0.14)]',
  },
  {
    counselorLabel: '3 Konselor Keluarga',
    orbBg: 'bg-gradient-to-br from-[#047857] via-emerald-600 to-teal-800',
    orbShadow: 'shadow-[0_10px_22px_-4px_rgba(5,150,105,0.38),inset_0_2px_4px_rgba(255,255,255,0.6)]',
    orbBottomBorder: 'border-emerald-950/30',
    orbHalo: 'bg-emerald-500/20',
    cardBg: 'from-white to-slate-50/50',
    border: 'border-emerald-100/90 hover:border-emerald-400/80',
    glowTop: 'bg-emerald-500/5',
    glowBottom: 'bg-teal-500/5',
    topBar: 'from-[#047857] via-emerald-600 to-teal-500',
    tag: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    titleHover: 'group-hover:text-emerald-950',
    descColor: 'text-slate-600',
    link: 'text-emerald-800 group-hover:text-emerald-950',
    buttonArrow: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_6px_14px_rgba(5,150,105,0.35)]',
    cardHoverShadow: 'hover:shadow-[0_20px_35px_-8px_rgba(5,150,105,0.14)]',
  },
  {
    counselorLabel: '4 Konselor Karier',
    orbBg: 'bg-gradient-to-br from-teal-600 via-emerald-600 to-[#047857]',
    orbShadow: 'shadow-[0_10px_22px_-4px_rgba(5,150,105,0.38),inset_0_2px_4px_rgba(255,255,255,0.6)]',
    orbBottomBorder: 'border-teal-900/30',
    orbHalo: 'bg-teal-500/20',
    cardBg: 'from-white to-slate-50/50',
    border: 'border-emerald-100/90 hover:border-teal-400/80',
    glowTop: 'bg-teal-500/5',
    glowBottom: 'bg-emerald-500/5',
    topBar: 'from-teal-600 via-emerald-600 to-[#047857]',
    tag: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    titleHover: 'group-hover:text-emerald-950',
    descColor: 'text-slate-600',
    link: 'text-emerald-800 group-hover:text-emerald-950',
    buttonArrow: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_6px_14px_rgba(5,150,105,0.35)]',
    cardHoverShadow: 'hover:shadow-[0_20px_35px_-8px_rgba(5,150,105,0.14)]',
  },
];

export const LandingPage = () => {
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [selectedServiceMode, setSelectedServiceMode] = useState('online'); // online | offline
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeArticleModal, setActiveArticleModal] = useState(null);
  const [content, setContent] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const navigate = useNavigate();
  const { startWithTopic, startWithCounselor } = useCounselingFlow();

  useEffect(() => {
    // 1. Fetch dynamic landing content from backend
    const fetchContent = async () => {
      try {
        const res = await api.get('/landing-content');
        if (res.data) {
          setContent(res.data);
        }
      } catch (err) {
        console.error('Failed to load landing content:', err);
      }
    };

    // 2. Fetch active tutors
    const fetchTutors = async () => {
      try {
        const res = await api.get('/tutors');
        if (res.data && res.data.length > 0) {
          setTutors(res.data);
        }
      } catch (err) {
        console.error('Failed to load tutors:', err);
      }
    };

    fetchContent();
    fetchTutors();
  }, []);

  const handleSelectCategory = (type) => {
    setShowCategorySheet(false);
    if (type === 'student') {
      navigate('/login?tab=student');
    } else {
      navigate('/register/general');
    }
  };

  const hero = content?.hero || {
    tagline: '',
    title: "Ada Hal yang Sedang Membebani Pikiranmu?",
    subtitle: 'Akses layanan bimbingan konseling dan pendampingan psikologis profesional tanpa biaya. Ceritamu aman, rahasia, dan didengarkan dengan penuh empati.',
    image_url: '/images/banner1.jpg',
    banner_images: [
      '/images/banner1.jpg',
      '/images/banner3.jpg',
      '/images/hero_counseling.jpg',
    ],
    online_card_title: 'Konseling Online via Zoom & Chat',
    online_card_desc: 'Sesi privat fleksibel dari mana saja, aman dan nyaman.',
    offline_card_title: 'Konseling Tatap Muka di Kampus',
    offline_card_desc: 'Pertemuan langsung di Ruang Layanan BK Gedung Pusat Mahasiswa Lt. 2.',
  };

  // Dynamic Hero Banner Slider (supports 2 - 3 photos with fallback)
  const defaultBannerImages = [
    {
      url: '/images/banner1.jpg',
      alt: 'Layanan Bimbingan Konseling UINSSC',
      title: 'Ruang Nyaman untuk Bercerita & Bertumbuh',
    },
    {
      url: '/images/banner3.jpg',
      alt: 'Lounge Konseling & Diskusi Mahasiswa',
      title: 'Pendampingan Psikologis Profesional & Ramah',
    },
    {
      url: '/images/hero_counseling.jpg',
      alt: 'Konseling Privat Tatap Muka & Online',
      title: 'Sesi Privat Terpercaya Tanpa Biaya',
    },
  ];

  const heroBanners = (() => {
    if (hero?.banner_images && Array.isArray(hero.banner_images) && hero.banner_images.length > 0) {
      return hero.banner_images.map((img, i) => {
        if (typeof img === 'string') {
          return { url: img, alt: `Banner Foto ${i + 1}` };
        }
        return img;
      });
    }
    return defaultBannerImages;
  })();

  // Auto-play timer for hero banner slider (changes every 3 seconds, pauses on hover)
  useEffect(() => {
    if (isSliderHovered || heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isSliderHovered, heroBanners.length]);

  const handlePrevSlide = (e) => {
    e?.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e?.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
  };

  const trustBadges = content?.trust_badges || [
    { icon: 'ShieldCheck', text: 'Bebas Biaya' },
    { icon: 'Award', text: 'Psikolog & Konselor Berlisensi' },
    { icon: 'Lock', text: 'Kerahasiaan Data Terjamin' },
    { icon: 'Video', text: 'Pilihan Online & Tatap Muka' },
  ];

  const navbar = content?.navbar || {
    top_announcement: 'Pusat Layanan Bimbingan & Konseling Mahasiswa',
    top_badge: 'UINSSC CYBER CAMPUS',
    top_free_text: '100% Fasilitas Kampus Bebas Biaya',
    brand_name: 'Ruang BK',
    brand_campus: 'UINSSC',
    brand_tagline: 'Bimbingan & Konseling Terpadu',
    menu: [
      { label: 'Layanan', href: '#layanan' },
      { label: 'Topik Bimbingan', href: '#masalah' },
      { label: 'Artikel', href: '/artikel' },
      { label: 'Konselor Kami', href: '#konselor' },
      { label: 'Cara Kerja', href: '#cara-kerja' },
      { label: 'FAQ', href: '#faq' },
    ]
  };

  const footer = content?.footer || {
    brand_title: 'Ruang BK UIN Siber Syekh Nurjati Cirebon',
    description: 'Pusat Layanan Bimbingan Konseling & Pendampingan Psikologis Mahasiswa. Menghadirkan ruang aman digital yang inklusif untuk bertumbuh, merawat kesehatan mental, dan mendukung keberhasilan studi siber.',
    badge_text: 'Layanan 100% Bebas Biaya bagi Seluruh Sivitas Akademika',
    hotline_title: 'Hotline Darurat Kampus',
    hotline_desc: 'Jika membutuhkan dukungan krisis psikologis segera:',
    hotline_number: '119 Ext 8 (Sejiwa Kemenkes)',
    hotline_subtext: 'Atau hubungi Tim Siaga Konseling UINSSC (0812-3456-7890)',
    office_location: 'Gedung Pusat Layanan Kemahasiswaan Lt. 2, Kampus Siber UINSSC',
    contact_email: 'bk-online@syekhnurjati.ac.id',
    copyright: `© ${new Date().getFullYear()} UIN Siber Syekh Nurjati Cirebon (UINSSC). Hak Cipta Dilindungi.`,
    confidentiality_notice: 'Kerahasiaan data bimbingan konseling dijamin kode etik profesional.',
    quick_links: [
      { label: 'Pilihan Layanan', href: '#layanan' },
      { label: 'Topik Bimbingan', href: '#masalah' },
      { label: 'Artikel Edukasi', href: '/artikel' },
      { label: 'Daftar Konselor', href: '#konselor' },
      { label: 'Masuk Akun', href: '/login' },
    ]
  };

  const articles = content?.articles?.items || [
    {
      id: 1,
      title: '5 Trik Mengatasi Burnout & Prokrastinasi Saat Menyusun Skripsi',
      category: 'Tips Akademik',
      read_time: '4 min baca',
      date: '02 Sep 2026',
      author: 'Tim Konselor UINSSC',
      image_url: '/images/banner1.jpg',
      snippet: 'Rasa jenuh dan kebuntuan tugas akhir adalah respons alami otak saat mengalami kelelahan mental. Kenali teknik micro-stepping untuk mengembalikan motivasi belajar.',
      content: 'Banyak mahasiswa tingkat akhir merasa terjebak dalam siklus menunda-nunda bukan karena malas, melainkan karena rasa cemas berlebihan terhadap standar kesempurnaan skripsi. Kunci utamanya adalah membagi target besar menjadi langkah-langkah mikro (micro-stepping) yang hanya membutuhkan waktu 15 menit setiap sesinya.'
    },
    {
      id: 2,
      title: 'Mengenal Perbedaan Cemas Wajar vs Overthinking Berlebihan',
      category: 'Kesehatan Mental',
      read_time: '3 min baca',
      date: '28 Agu 2026',
      author: 'Psikolog Dian P., M.Psi.',
      image_url: '/images/hero_counseling.jpg',
      snippet: 'Kecemasan adalah sistem alarm alami tubuh. Namun jika pikiran terus berputar tanpa solusi nyata, kenali teknik grounding 5-4-3-2-1 untuk menenangkan sistem saraf.',
      content: 'Rasa cemas sebelum ujian atau presentasi sidang adalah wajar dan membantu kita tetap waspada. Namun jika kekhawatiran itu terjadi terus menerus tanpa pemicu yang jelas hingga mengganggu pola tidur dan makan, saatnya berkonsultasi dengan konselor atau psikolog profesional.'
    },
    {
      id: 3,
      title: 'Panduan Membuka Diri saat Pertama Kali Menjalani Sesi Konseling',
      category: 'Tips Konseling',
      read_time: '5 min baca',
      date: '20 Agu 2026',
      author: 'Ahmad Fauzi, S.Psi.',
      image_url: '/images/banner1.jpg',
      snippet: 'Merasa gugup sebelum konseling adalah hal yang lumrah. Ruang konseling adalah tempat yang aman tanpa penghakiman untuk membagikan cerita Anda.',
      content: 'Ruang konseling adalah zona aman tanpa penilaian. Anda tidak perlu menyusun cerita secara rapi atau runtut. Cukup sampaikan apa yang paling membebani pikiran Anda saat ini. Konselor kampus kami siap mendengarkan dan membantu Anda menemukan perspektif baru.'
    }
  ];

  const problems = content?.problems?.items || [
    {
      id: 1,
      title: 'Akademik & Skripsi',
      desc: 'Prokrastinasi, kebuntuan tugas akhir, motivasi belajar turun, atau kesulitan bimbingan.',
      tag: 'Akademik',
      icon: 'GraduationCap'
    },
    {
      id: 2,
      title: 'Kecemasan & Overthinking',
      desc: 'Pikiran cemas berlebihan tentang masa depan, panic attack, overthinking, atau insomnia.',
      tag: 'Emosi',
      icon: 'Brain'
    },
    {
      id: 3,
      title: 'Stres Perkuliahan & Burnout',
      desc: 'Kelelahan emosional akibat beban tugas, organisasi, dan tuntutan akademik yang menumpuk.',
      tag: 'Kesehatan Mental',
      icon: 'Sparkles'
    },
    {
      id: 4,
      title: 'Relasi Pertemanan & Sosial',
      desc: 'Konflik dengan teman satu angkatan, kesepian di perantauan, atau adaptasi lingkungan baru.',
      tag: 'Sosial',
      icon: 'Users'
    },
    {
      id: 5,
      title: 'Keluarga & Ekonomi',
      desc: 'Dilema ekspektasi orang tua, konflik internal keluarga, atau kecemasan finansial kuliah.',
      tag: 'Keluarga',
      icon: 'Home'
    },
    {
      id: 6,
      title: 'Arah Karier & Masa Depan',
      desc: 'Bingung menentukan peminatan, magang, persiapan karier profesional, atau krisis quarter-life.',
      tag: 'Karier',
      icon: 'Compass'
    },
  ];

  const steps = content?.steps?.items || [
    {
      step_number: '01',
      title: 'Isi Screening Mandiri Singkat',
      desc: 'Evaluasi kondisi emosional dan kebutuhan bimbinganmu dalam 3 menit kuesioner terstruktur.'
    },
    {
      step_number: '02',
      title: 'Pilih Konselor & Waktu Pertemuan',
      desc: 'Pilih konselor yang sesuai dengan topikmu dan tentukan jam yang cocok dengan jadwal kuliah.'
    },
    {
      step_number: '03',
      title: 'Mulai Sesi Konseling Privat',
      desc: 'Masuk ke ruang video Zoom terenkripsi langsung dari aplikasi atau hadir di Ruang BK kampus.'
    }
  ];

  const screeningCta = content?.screening_cta || {
    tag: 'Tes Kesehatan Mental Kampus UINSSC',
    title: 'Ingin Tahu Kondisi Emosi dan Kebutuhanmu Saat Ini?',
    desc: 'Screening terstruktur kami membantu memetakan area stres akademik, emosional, dan sosial tanpa label penghakiman. Bebas biaya dan rahasia.',
    button_text: 'Mulai Screening Mandiri'
  };

  const faqs = content?.faqs || [
    {
      question: 'Apakah layanan bimbingan konseling ini berbayar?',
      answer: 'Tidak sama sekali. Seluruh layanan bimbingan konseling ini 100% GRATIS dan merupakan hak fasilitas resmi kampus bagi seluruh mahasiswa aktif dan sivitas akademika.'
    },
    {
      question: 'Apakah rahasia dan cerita saya dijamin aman?',
      answer: 'Sangat aman. Konselor kami terikat oleh kode etik profesi dan standar kerahasiaan institusi. Cerita dan catatan sesi Anda tidak akan dipublikasikan atau dibagikan kepada dosen maupun pihak luar.'
    },
    {
      question: 'Apakah sesi konseling dilakukan secara online atau tatap muka?',
      answer: 'Anda bebas memilih! Kami menyediakan sesi video online (terintegrasi Zoom SDK tanpa instalasi rumit) maupun tatap muka langsung di Ruang Konseling Gedung Kemahasiswaan Kampus.'
    },
    {
      question: 'Bagaimana jika saya merasa gugup atau tidak tahu harus mulai dari mana?',
      answer: 'Itu sangat wajar dan normal. Konselor kami sangat ramah, hangat, dan siap membimbing percakapan dengan santai. Anda tidak dituntut untuk langsung berbicara terstruktur.'
    },
    {
      question: 'Berapa lama durasi satu sesi konseling?',
      answer: 'Satu sesi berlangsung selama 50 hingga 60 menit, memberikan waktu yang cukup untuk berdiskusi mendalam dan merumuskan langkah praktis.'
    }
  ];

  const testimonials = content?.testimonials || [
    {
      id: 1,
      name: 'Fadhil R.',
      faculty: 'Mahasiswa Teknologi Informasi - Semester 7',
      text: 'Sangat terbantu saat stuck skripsi dan overthinking masa depan. Konselornya ramah dan tidak menghakimi sama sekali. Sekarang jauh lebih lega dan fokus.',
      rating: 5
    },
    {
      id: 2,
      name: 'Nabila S.',
      faculty: 'Mahasiswi Bimbingan Konseling Islam - Semester 5',
      text: 'Platformnya nyaman banget, bisa langsung video call tanpa ribet. Ruang yang benar-benar aman buat menumpahkan unek-unek tanpa takut di-judge.',
      rating: 5
    },
    {
      id: 3,
      name: 'Rian H.',
      faculty: 'Mahasiswa Ekonomi Syariah - Semester 3',
      text: 'Adaptasi kuliah rantau sempat bikin stres berat. Setelah 2 sesi konseling, saya dapat tips regulasi emosi yang praktis dan aplikatif.',
      rating: 5
    }
  ];

  const displayTutors = tutors.length > 0 ? tutors : [
    {
      id: 1,
      name: 'Dr. Ahmad Fauzi, M.Psi., Psikolog',
      specialization: 'Kesehatan Mental, Adaptasi Kampus & Regulasi Emosi',
      bio: 'Konselor psikologi berpengalaman mendampingi mahasiswa dalam mengelola stres akademik, overthinking, dan krisis adaptasi.',
      photo: '/images/counselor_ahmad.jpg',
      avatar: '/images/counselor_ahmad.jpg',
      alumni: 'Psikolog Klinis Terlisensi',
    },
    {
      id: 2,
      name: 'Nurlina Permata, S.Pd., M.Kons.',
      specialization: 'Bimbingan Karier, Motivasi Belajar & Perencanaan Masa Depan',
      bio: 'Fokus pada eksplorasi potensi diri, kesiapan karier, dan mengatasi kecemasan quarter-life crisis masa depan.',
      photo: '/images/counselor_dian.jpg',
      avatar: '/images/counselor_dian.jpg',
      alumni: 'Konselor Pengembangan Diri',
    },
    {
      id: 3,
      name: 'Bambang Sudarsono, M.A.',
      specialization: 'Hubungan Sosial, Resolusi Konflik Keluarga & Pribadi',
      bio: 'Pendekatan humanistik yang ramah, hangat, dan mengedepankan ruang aman tanpa penghakiman.',
      photo: '/images/counselor_bambang.jpg',
      avatar: '/images/counselor_bambang.jpg',
      alumni: 'Konselor Interpersonal & Sosial',
    }
  ];

  return (
    <PageTransition className="min-h-screen bg-[#F6F8FA] flex flex-col justify-between selection:bg-emerald-200 selection:text-emerald-950 font-sans relative">

      {/* 0. Dynamic Announcement Bar from Admin Web Settings */}
      {content?.web_settings?.announcement_bar_enabled && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white py-2 px-4 sm:px-8 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs z-50">
          <Sparkles className="w-3.5 h-3.5 shrink-0 animate-bounce" />
          <span>{content?.web_settings?.announcement_text || 'Pengumuman Resmi Kampus'}</span>
        </div>
      )}

      {/* 1. UINSSC Top Institutional Accent Banner */}
      <div className="bg-gradient-to-r from-[#013b29] via-[#046c4e] to-[#013b29] text-white py-2 px-4 sm:px-8 border-b border-emerald-500/30 text-xs font-medium z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm" />
            <span className="font-bold text-amber-300 uppercase tracking-wider text-xs">
              {navbar.top_badge || 'UINSSC CYBER CAMPUS'}
            </span>
            <span className="hidden sm:inline text-emerald-200/70">•</span>
            <span className="hidden sm:inline text-emerald-100">
              {navbar.top_announcement || 'Pusat Layanan Bimbingan & Konseling Mahasiswa'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-emerald-100 text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1">
              <BookmarkCheck className="w-3 h-3 text-amber-300" />
              {navbar.top_free_text || '100% Fasilitas Kampus Bebas Biaya'}
            </span>
            <span className="text-emerald-400/50">•</span>
            <span className="text-emerald-200 hidden md:inline">Kerahasiaan Terjamin Kode Etik</span>
          </div>
        </div>
      </div>

      {/* 2. Top Navbar with Emerald Accents */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 px-4 sm:px-8 py-3.5 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200/80 p-0.5 shadow-soft-xs flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-emerald-500/10">
              <img
                src={navbar.logo_url || '/logobk.png'}
                alt={navbar.brand_name || 'Ruang BK'}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold text-[#164C53] tracking-wider uppercase block">
                {(navbar.brand_name || 'RUANG BK').toUpperCase()}
              </span>
              <span className="text-xs text-mutedtext block leading-none mt-0.5">
                {navbar.brand_tagline || 'Bimbingan & Konseling Terpadu'}
              </span>
            </div>
          </div>

          {/* Desktop Nav Links (Dynamically Editable via CMS) */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-mutedtext">
            {(navbar.menu || []).map((item, idx) =>
              item.href?.startsWith('/') ? (
                <Link key={idx} to={item.href} className="hover:text-emerald-800 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <a key={idx} href={item.href} className="hover:text-emerald-800 transition-colors">
                  {item.label}
                </a>
              )
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors min-h-[40px] flex items-center"
            >
              Masuk Akun
            </Link>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/konselor')}
              className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#047857] to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-bold shadow-soft-sm flex items-center gap-1.5 transition-all min-h-[40px] ring-2 ring-emerald-600/20 cursor-pointer"
            >
              <span>Jelajahi Konselor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section - Banner Foto Memanjang Bersih di Atas & Teks/Pilihan Layanan di Bawahnya */}
      <section className="relative overflow-hidden bg-white border-b border-emerald-100">

        {/* Foto Banner Utama - Slider 2-3 Foto Melebar ke Samping */}
        <ScrollReveal direction="none" delay={0.05} duration={0.8}>
          <div
            className="relative w-full h-[250px] sm:h-[340px] lg:h-[410px] overflow-hidden bg-slate-900 border-b border-emerald-100/60 group select-none"
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}
          >
            {/* Foto Slides dengan Transisi Halus (Cross-fade) */}
            {heroBanners.map((banner, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={banner.url}
                  alt={banner.alt || `Banner Foto ${index + 1}`}
                  className="w-full h-full object-cover object-center transform scale-100"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                {/* Gradien halus untuk kontras dan estetika premium */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
              </div>
            ))}

            {/* Indikator Titik Paginasi di Bawah Tengah */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-md">
              {heroBanners.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(dotIdx);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    dotIdx === currentSlide
                      ? 'w-7 h-2 bg-emerald-400 shadow-sm'
                      : 'w-2 h-2 bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Pindah ke foto ${dotIdx + 1}`}
                />
              ))}
            </div>

            {/* Badge resmi mengambang di pojok kanan bawah foto */}
            <div className="absolute bottom-3 right-4 sm:right-8 hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-200/90 shadow-soft-sm z-20">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-[11px] font-bold text-darktext">Fasilitas Resmi UINSSC • 100% Bebas Biaya</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Konten Hero (Tagline, Judul, Deskripsi, Tombol Aksi & Pilihan Layanan) Berada Bersih di Bawah Banner */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-7 lg:py-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">

            {/* Kolom Kiri: Teks Headline & Tombol Aksi */}
            <ScrollReveal direction="up" delay={0.1} className="lg:col-span-7 space-y-4 text-center lg:text-left">
              {hero.tagline && !hero.tagline.includes('Bebas Penghakiman') && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-950 text-xs font-bold border border-emerald-300 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{hero.tagline}</span>
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-darktext tracking-tight leading-snug whitespace-pre-line">
                {(hero.title || 'Ada Hal yang Sedang Membebani Pikiranmu?')
                  .replace(/\n?Kamu Tidak Harus Menghadapinya Sendirian\.?/i, '')
                  .trim()}
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-darktext/80 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {hero.subtitle}
              </p>

              {/* Action Buttons: Discovery First */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/konselor')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#047857] to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-soft-sm flex items-center justify-center gap-2 transition-all ring-2 ring-emerald-600/20 cursor-pointer min-h-[44px]"
                >
                  <span>Pilih Konselor & Mulai</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/app/screening')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-bold shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                >
                  <Brain className="w-4 h-4 text-emerald-700" />
                  <span>Evaluasi Mandiri (Skrining)</span>
                </motion.button>
              </div>
            </ScrollReveal>

            {/* Kolom Kanan: Pilihan Layanan Konseling */}
            <ScrollReveal direction="up" delay={0.2} className="lg:col-span-5">
              <div id="layanan" className="bg-[#F8FAFC] border border-emerald-200/80 rounded-3xl p-4 sm:p-5 shadow-soft-sm space-y-3">
                <p className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Dukungan seperti apa yang kamu butuhkan?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                  {/* Online Card */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedServiceMode('online');
                      navigate('/konselor');
                    }}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all shadow-soft-sm flex items-center justify-between ${selectedServiceMode === 'online'
                      ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-emerald-600/10'
                      : 'border-emerald-200/70 bg-white hover:border-emerald-400'
                      }`}
                  >
                    <div className="space-y-1">
                      <h3 className="text-xs sm:text-sm font-bold text-emerald-950">
                        {hero.online_card_title}
                      </h3>
                      <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
                        <span>Pilih Online</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300/80 shadow-2xs">
                      <Video className="w-5 h-5" />
                    </div>
                  </motion.div>

                  {/* Offline Card */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedServiceMode('offline');
                      navigate('/konselor');
                    }}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all shadow-soft-sm flex items-center justify-between ${selectedServiceMode === 'offline'
                      ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-teal-600/10'
                      : 'border-emerald-200/70 bg-white hover:border-teal-400'
                      }`}
                  >
                    <div className="space-y-1">
                      <h3 className="text-xs sm:text-sm font-bold text-teal-950">
                        {hero.offline_card_title}
                      </h3>
                      <div className="flex items-center gap-1 text-teal-700 text-xs font-bold">
                        <span>Pilih Offline</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-100 to-emerald-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-300/80 shadow-2xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* 4. Trust Ribbon Banner with Emerald Background Accent & Decorative Glow */}
      <section className="bg-gradient-to-r from-emerald-950/[0.04] via-emerald-800/[0.07] to-emerald-950/[0.04] border-b border-emerald-600/20 py-5 px-4 relative overflow-hidden">
        {/* Top subtle emerald gradient line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60" />

        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center sm:text-left">
          {trustBadges.map((badge, idx) => {
            const IconComp = iconMap[badge.icon] || ShieldCheck;
            return (
              <ScrollReveal
                key={idx}
                direction="up"
                delay={idx * 0.08}
                className="flex items-center justify-center sm:justify-start gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-200">
                  <IconComp className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-emerald-950">
                  {badge.text === '100% Bebas Biaya (Fasilitas Kampus)' ? 'Bebas Biaya' : badge.text}
                </span>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* 5. "Sedang Menghadapi Masalah Apa?" (Clean 3D White Ceramic & Signature Emerald Glass) */}
      <section id="masalah" className="py-16 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full relative">

        {/* Subtle Ambient Emerald & Teal Mesh Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-r from-emerald-300/10 via-teal-300/10 to-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-6 w-80 h-80 bg-emerald-200/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-6 w-80 h-80 bg-teal-200/10 rounded-full blur-3xl pointer-events-none" />

        <ScrollReveal direction="up" delay={0.08}>
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 relative z-10">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-widest px-4 py-1.5 rounded-full bg-white shadow-soft-sm border border-emerald-200/80 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Area Pendampingan & Konseling
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-darktext tracking-tight">
              {content?.problems?.title || 'Sedang Menghadapi Masalah Apa?'}
            </h2>
            <p className="text-xs sm:text-sm text-mutedtext mt-2.5 max-w-xl mx-auto leading-relaxed">
              {content?.problems?.subtitle || 'Setiap tantangan memiliki jalan keluar. Temukan konselor dengan keahlian yang tepat untuk mendampingimu:'}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 relative z-10">
          {problems.map((prob, idx) => {
            const IconComponent = iconMap[prob.icon] || Sparkles;
            const palette = problemPalettes[idx % problemPalettes.length];
            return (
              <ScrollReveal
                key={prob.id}
                direction="up"
                delay={(idx % 3) * 0.08}
                className="h-full"
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.015 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  onClick={() => {
                    startWithTopic(prob);
                    navigate(`/konselor?topic_id=${prob.id}`);
                  }}
                  className={`group p-6 sm:p-7 rounded-[26px] bg-gradient-to-br ${palette.cardBg} border ${palette.border} shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.03)] ${palette.cardHoverShadow} transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden h-full`}
                >
                  {/* Glossy light sheen sweep on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                  {/* Mood-Boosting Dual Glowing Flares */}
                  <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full ${palette.glowTop} blur-2xl pointer-events-none group-hover:scale-130 transition-transform duration-700`} />
                  <div className={`absolute -bottom-10 -left-10 w-36 h-36 rounded-full ${palette.glowBottom} blur-xl pointer-events-none group-hover:scale-120 transition-transform duration-700`} />

                  {/* Card Content Top */}
                  <div className="relative z-10">
                    {/* Header Row: Top Bar Accent + Category Pill */}
                    <div className="flex items-center justify-between mb-5">
                      <div className={`h-1.5 w-10 rounded-full bg-gradient-to-r ${palette.topBar} group-hover:w-20 transition-all duration-400 shadow-2xs`} />
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-2xs backdrop-blur-md ${palette.tag}`}>
                        {prob.tag}
                      </span>
                    </div>

                    {/* 3D Floating Glass Orb for Icon */}
                    <div className="mb-5 flex items-center">
                      <div className="relative">
                        {/* Ambient soft glow halo behind orb */}
                        <div className={`absolute -inset-1 rounded-2xl ${palette.orbHalo} blur-md opacity-40 group-hover:opacity-90 transition-opacity duration-300`} />
                        {/* 3D Glass Orb with Glossy Highlight */}
                        <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl ${palette.orbBg} ${palette.orbShadow} flex items-center justify-center relative transform-gpu transition-all duration-300 group-hover:scale-108 group-hover:-rotate-2 border-t border-l border-white/60 border-b border-r ${palette.orbBottomBorder}`}>
                          {/* Specular 3D Reflection overlay */}
                          <div className="absolute top-0.5 left-0.5 right-0.5 h-1/2 rounded-t-xl bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                          <IconComponent className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10" />
                        </div>
                      </div>
                    </div>

                    <h3 className={`text-base sm:text-lg font-black text-darktext mb-2 ${palette.titleHover} transition-colors tracking-tight`}>
                      {prob.title}
                    </h3>
                    <p className={`text-xs sm:text-[13px] ${palette.descColor} leading-relaxed font-medium`}>
                      {prob.desc}
                    </p>
                  </div>

                  {/* Card Content Bottom: Counselor Mini-Stack + CTA Action */}
                  <div className="relative z-10 mt-5">
                    {/* Counselor Mini Presence Stack */}
                    <div className="pt-3.5 border-t border-black/[0.05] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {displayTutors.slice(0, 3).map((tutor, tIdx) => (
                            <img
                              key={tIdx}
                              src={tutor.photo || tutor.avatar || (tIdx === 1 ? '/images/counselor_dian.jpg' : (tIdx === 2 ? '/images/counselor_bambang.jpg' : '/images/counselor_ahmad.jpg'))}
                              alt={tutor.name}
                              className="inline-block w-6 h-6 rounded-full ring-2 ring-white object-cover shadow-2xs"
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {palette.counselorLabel}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[10.5px] font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Tersedia
                      </span>
                    </div>

                    {/* Bottom CTA Link & Arrow Button */}
                    <div className="pt-3 mt-2.5 border-t border-dashed border-black/[0.05] flex items-center justify-between text-xs font-bold">
                      <span className={`${palette.link} font-bold transition-colors flex items-center gap-1`}>
                        Konsultasikan Topik Ini
                      </span>
                      <div className={`w-8 h-8 rounded-full border shadow-2xs flex items-center justify-center ${palette.buttonArrow} group-hover:translate-x-0.5 transition-all duration-300`}>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* 6. Counselor Showcase ("Profil Konselor & Psikolog Kampus") - NO PRICES */}
      <section id="konselor" className="py-14 sm:py-18 px-4 sm:px-8 bg-gradient-to-b from-white via-emerald-50/30 to-white border-y border-emerald-100 relative overflow-hidden">

        {/* Background Ambient Orbs */}
        <div className="absolute top-1/3 -left-24 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-24 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal direction="up" delay={0.08}>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 mb-2">
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                Sivitas Konseling UINSSC
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-darktext">
                Profil Konselor & Psikolog Kampus
              </h2>
              <p className="text-xs sm:text-sm text-mutedtext mt-2 leading-relaxed">
                Didukung oleh psikolog klinis dan konselor berlisensi resmi yang siap mendengarkan tanpa stigma.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTutors.slice(0, 3).map((tutor, idx) => (
              <ScrollReveal
                key={tutor.id}
                direction="up"
                delay={(idx % 3) * 0.1}
                className="h-full"
              >
                <div
                  className="bg-white rounded-3xl border border-emerald-100/90 shadow-soft-md overflow-hidden flex flex-col justify-between hover:border-emerald-400 hover:shadow-emerald-600/10 transition-all group h-full"
                >
                  <div>
                    {/* Photo Header */}
                    <div className="relative h-56 bg-gray-100 overflow-hidden">
                      <img
                        src={
                          tutor.photo ||
                          tutor.avatar ||
                          ((tutor.name?.toLowerCase().includes('nurlina') || tutor.name?.toLowerCase().includes('dian') || idx === 1)
                            ? '/images/counselor_dian.jpg'
                            : ((tutor.name?.toLowerCase().includes('bambang') || idx === 2)
                              ? '/images/counselor_bambang.jpg'
                              : '/images/counselor_ahmad.jpg'))
                        }
                        alt={tutor.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-200 text-[10px] font-bold text-emerald-900 shadow-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Berlisensi Resmi</span>
                      </div>

                      {/* UINSSC Free Institutional Badge */}
                      <div className="absolute bottom-3 left-3 bg-gradient-to-r from-[#014732] to-[#046c4e] text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 border border-emerald-400/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Layanan Gratis Mahasiswa</span>
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-darktext line-clamp-1 group-hover:text-emerald-900 transition-colors">
                          {tutor.name}
                        </h3>
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {tutor.alumni || tutor.specialization?.split(',')[0]}
                        </p>
                      </div>

                      <p className="text-xs text-mutedtext line-clamp-3 leading-relaxed">
                        {tutor.bio}
                      </p>

                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                          Keahlian & Fokus:
                        </span>
                        <p className="text-xs font-medium text-darktext line-clamp-2">
                          {tutor.specialization}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action (Strictly NO PRICES) */}
                  <div className="p-5 pt-0">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        startWithCounselor(tutor);
                        navigate(`/konselor/${tutor.id}`);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-600 hover:to-teal-600 text-emerald-800 hover:text-white border border-emerald-200 hover:border-transparent text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <span>Pilih Konselor Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. "Langkah Mudah Memulai Konseling" (How It Works) */}
      <section id="cara-kerja" className="py-14 sm:py-18 px-4 sm:px-8 max-w-6xl mx-auto w-full relative">
        <ScrollReveal direction="up" delay={0.08}>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Alur Terstruktur
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-darktext">
              {content?.steps?.title || 'Langkah Mudah Memulai Konseling'}
            </h2>
            <p className="text-xs sm:text-sm text-mutedtext mt-2 leading-relaxed">
              {content?.steps?.subtitle || 'Hanya butuh 3 langkah sederhana untuk mendapatkan ruang aman bercerita'}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => (
            <ScrollReveal
              key={idx}
              direction="up"
              delay={idx * 0.12}
              className="h-full"
            >
              <div
                className="p-6 rounded-3xl bg-white border border-emerald-100/90 shadow-soft-sm relative flex flex-col justify-between hover:border-emerald-300 transition-colors group h-full"
              >
                <div>
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-700 to-teal-500 mb-2 block font-mono">
                    {step.step_number}
                  </span>
                  <h3 className="text-base font-bold text-darktext mb-2 group-hover:text-emerald-950 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-mutedtext leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Privat & Terjamin</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 8. Interactive Screening Test CTA Banner (UINSSC Deep Emerald Signature) */}
      <section className="py-8 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <ScrollReveal direction="up" delay={0.1}>
          <div className="rounded-3xl bg-gradient-to-r from-[#013b29] via-[#046c4e] to-[#013b29] text-white p-6 sm:p-10 shadow-soft-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-500/30">

            {/* Subtle Cyber Islamic polygon pattern overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

            <div className="max-w-xl space-y-2.5 text-center md:text-left z-10">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                {screeningCta.tag}
              </span>
              <h2 className="text-xl sm:text-3xl font-black leading-snug">
                {screeningCta.title}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                {screeningCta.desc}
              </p>
            </div>

            <div className="z-10 shrink-0">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCategorySheet(true)}
                className="px-6 py-3.5 bg-white hover:bg-emerald-50 text-[#013b29] rounded-2xl text-xs sm:text-sm font-bold shadow-soft-md flex items-center gap-2 transition-all min-h-[48px] border border-emerald-200"
              >
                <span>{screeningCta.button_text}</span>
                <ArrowRight className="w-4 h-4 text-emerald-700" />
              </motion.button>
            </div>

            {/* Decorative blur backdrop */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          </div>
        </ScrollReveal>
      </section>

      {/* 9. Student Testimonials ("Cerita Mereka yang Telah Bertumbuh") */}
      <section className="py-14 sm:py-18 px-4 sm:px-8 max-w-6xl mx-auto w-full relative">
        <ScrollReveal direction="up" delay={0.08}>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Pengalaman Mahasiswa
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-darktext">
              Cerita Mahasiswa yang Telah Bertumbuh
            </h2>
            <p className="text-xs sm:text-sm text-mutedtext mt-2 leading-relaxed">
              Mendengar pengalaman mereka yang menemukan kembali ketenangan dan kejelasan pikiran.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, idx) => (
            <ScrollReveal
              key={t.id}
              direction="up"
              delay={idx * 0.1}
              className="h-full"
            >
              <div
                className="p-6 rounded-3xl bg-white border border-emerald-100/80 shadow-soft-sm flex flex-col justify-between hover:border-emerald-300 transition-colors h-full"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-darktext leading-relaxed italic">
                    "{t.text}"
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-emerald-50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-darktext">{t.name}</h4>
                    <span className="text-[11px] text-emerald-800/80 font-medium block">{t.faculty}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 10. Artikel & Edukasi Mental Section (With Direct Link to Full Articles Page) */}
      <section id="artikel" className="py-14 sm:py-18 px-4 sm:px-8 max-w-6xl mx-auto w-full relative">
        <ScrollReveal direction="up" delay={0.08}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-emerald-100">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Literasi Kesehatan Mental
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-darktext">
                Artikel & Wawasan Psikologi Mahasiswa
              </h2>
              <p className="text-xs sm:text-sm text-mutedtext mt-1.5 max-w-xl leading-relaxed">
                Kiat praktis mengelola stres perkuliahan, motivasi skripsi, dan panduan regulasi emosi dari konselor kampus.
              </p>
            </div>

            <Link
              to="/artikel"
              className="px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2 transition-all shrink-0 shadow-soft-xs hover:shadow-soft-sm"
            >
              <span>Buka Portal Artikel Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.slice(0, 3).map((art, idx) => (
            <ScrollReveal
              key={art.id}
              direction="up"
              delay={idx * 0.12}
              className="h-full"
            >
              <Link
                to={`/artikel/${art.id}`}
                className="group bg-white rounded-3xl border border-emerald-100/90 shadow-soft-xs hover:shadow-soft-md hover:border-emerald-400 transition-all flex flex-col justify-between overflow-hidden h-full"
              >
                <div>
                  <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={art.image_url || '/images/banner1.jpg'}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-bold text-emerald-900 shadow-sm border border-emerald-100">
                        {art.category || 'Edukasi'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] text-mutedtext">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{art.date}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{art.read_time}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-darktext group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h3>

                    <p className="text-xs text-mutedtext line-clamp-3 leading-relaxed">
                      {art.snippet}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium truncate max-w-[160px]">
                    Oleh {art.author}
                  </span>
                  <span className="font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Baca</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal direction="up" delay={0.1}>
          <div className="text-center mt-8">
            <Link
              to="/artikel"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white text-xs font-bold shadow-soft-sm hover:shadow-soft-md transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Jelajahi Semua Artikel di Portal Edukasi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* 11. FAQ Accordion (With Emerald Active Tint) */}
      <section id="faq" className="py-14 sm:py-18 px-4 sm:px-8 bg-white border-t border-emerald-100">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal direction="up" delay={0.08}>
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Bantuan & Jawaban
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-darktext">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
              <p className="text-xs text-mutedtext mt-2">
                Segala hal yang perlu kamu ketahui tentang layanan Bimbingan Konseling Kampus UINSSC
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <ScrollReveal
                  key={idx}
                  direction="up"
                  delay={idx * 0.05}
                >
                  <div
                    className={`rounded-2xl border transition-all ${isOpen
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                      : 'border-softborder bg-gray-50/60 hover:bg-gray-100/60'
                      }`}
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-darktext transition-colors"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-mutedtext shrink-0" />
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="px-4 sm:px-5 pb-5 text-xs text-mutedtext leading-relaxed border-t border-emerald-100 pt-3"
                        >
                          {faq.answer}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. Footer with Dignified UINSSC Cyber-Emerald (Dynamically Editable via CMS) */}
      <footer className="bg-gradient-to-b from-[#022c22] to-[#011a14] text-emerald-100 py-12 px-4 sm:px-8 border-t-2 border-emerald-500/40 text-xs">
        <ScrollReveal direction="up" delay={0.08}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-base">
                <div className="w-8 h-8 rounded-xl bg-white p-0.5 shadow-soft-xs flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/logobk.png"
                    alt="Logo Ruang BK"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span>{footer.brand_title || 'Ruang BK UIN Siber Syekh Nurjati Cirebon'}</span>
              </div>
              <p className="text-emerald-200/80 leading-relaxed max-w-sm">
                {footer.description}
              </p>
              {footer.badge_text && (
                <div className="flex items-center gap-2 text-amber-300 font-bold pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{footer.badge_text}</span>
                </div>
              )}
              {footer.office_location && (
                <p className="text-emerald-300/70 text-[11px] pt-1">
                  📍 {footer.office_location}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 border-b border-emerald-800 pb-1">Tautan Cepat</h4>
              <ul className="space-y-2 text-emerald-200/80">
                {(footer.quick_links || []).map((link, idx) => (
                  <li key={idx}>
                    {link.href?.startsWith('/') ? (
                      <Link to={link.href} className="hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="hover:text-white transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 border-b border-emerald-800 pb-1">
                {footer.hotline_title || 'Hotline Darurat Kampus'}
              </h4>
              <p className="text-emerald-200/80 leading-relaxed mb-2">
                {footer.hotline_desc || 'Jika membutuhkan dukungan krisis psikologis segera:'}
              </p>
              <span className="font-mono text-amber-300 font-bold block text-sm">
                {footer.hotline_number || '119 Ext 8 (Sejiwa Kemenkes)'}
              </span>
              <span className="text-[10px] text-emerald-300/70 block mt-1">
                {footer.hotline_subtext || 'Atau hubungi Tim Siaga Konseling UINSSC'}
              </span>
              {footer.contact_email && (
                <span className="text-[11px] text-emerald-200/80 block mt-2">
                  ✉️ {footer.contact_email}
                </span>
              )}
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto pt-6 border-t border-emerald-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-300/60 text-[11px]">
          <p>{footer.copyright || `© ${new Date().getFullYear()} UIN Siber Syekh Nurjati Cirebon (UINSSC). Hak Cipta Dilindungi.`}</p>
          <p>{footer.confidentiality_notice || 'Kerahasiaan data bimbingan konseling dijamin kode etik profesional.'}</p>
        </div>
      </footer>

      {/* 12. Category Bottom Sheet (Mahasiswa vs Umum) */}
      <BottomSheet
        isOpen={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        title="Pilih Kategori Layanan Anda"
      >
        <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
          Silakan pilih kategori pendaftaran untuk menyesuaikan profil dan akses layanan konseling kampus:
        </p>

        <div className="space-y-3">
          {/* Mahasiswa Card */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectCategory('student')}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer flex items-center justify-between transition-all shadow-xs hover:shadow-soft-sm group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent transition-all shadow-2xs shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                  Mahasiswa
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Login portal akademik
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>

          {/* Masyarakat Umum Card */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectCategory('general')}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer flex items-center justify-between transition-all shadow-xs hover:shadow-soft-sm group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent transition-all shadow-2xs shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                  Masyarakat Umum
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Pendaftaran memakai NIK
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>

        <div className="mt-5 pt-3.5 border-t border-slate-100 text-center">
          <Link
            to="/login"
            onClick={() => setShowCategorySheet(false)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
          >
            Sudah memiliki akun? Masuk di sini
          </Link>
        </div>
      </BottomSheet>

      {/* 13. Modal Baca Artikel Edukasi */}
      <AnimatePresence>
        {activeArticleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col"
            >
              {/* Modal Featured Image Header */}
              {activeArticleModal.image_url && (
                <div className="w-full h-52 sm:h-60 overflow-hidden bg-gray-100 relative shrink-0">
                  <img
                    src={activeArticleModal.image_url}
                    alt={activeArticleModal.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <button
                    type="button"
                    onClick={() => setActiveArticleModal(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition-colors backdrop-blur-xs"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6 text-white">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600/90 text-white backdrop-blur-xs uppercase tracking-wider">
                      {activeArticleModal.category}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black mt-2 leading-snug drop-shadow-sm">
                      {activeArticleModal.title}
                    </h3>
                  </div>
                </div>
              )}

              {/* Header Info */}
              <div className="p-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4 bg-emerald-50/40">
                <div>
                  {!activeArticleModal.image_url && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900">
                        {activeArticleModal.category}
                      </span>
                      <span className="text-xs text-mutedtext flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {activeArticleModal.read_time}
                      </span>
                    </div>
                  )}
                  {!activeArticleModal.image_url && (
                    <h3 className="text-lg sm:text-xl font-black text-darktext leading-snug">
                      {activeArticleModal.title}
                    </h3>
                  )}
                  <div className="flex items-center gap-2 text-xs text-mutedtext">
                    <span className="font-semibold text-emerald-800">{activeArticleModal.author}</span>
                    <span>•</span>
                    <span>{activeArticleModal.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activeArticleModal.read_time}
                    </span>
                  </div>
                </div>

                {!activeArticleModal.image_url && (
                  <button
                    type="button"
                    onClick={() => setActiveArticleModal(null)}
                    className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-mutedtext hover:text-darktext hover:bg-gray-100 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-darktext/90 leading-relaxed font-normal">
                <p className="font-medium text-emerald-950 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
                  {activeArticleModal.snippet}
                </p>
                <div className="whitespace-pre-line space-y-3">
                  {activeArticleModal.content}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-mutedtext">
                  Butuh ruang bercerita lebih dalam? Konselor kami siap mendampingi.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveArticleModal(null);
                    setShowCategorySheet(true);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-soft-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Mulai Konseling Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default LandingPage;
