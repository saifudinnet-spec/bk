import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  Star,
  Activity,
  AlertTriangle,
  FolderHeart,
  Video,
  MessageSquare,
  Building2,
  ChevronDown,
  RefreshCw,
  Search,
  Download,
  Award,
  Sparkles,
} from 'lucide-react';

export default function AdminReportsTab({ showSuccess, showError }) {
  // Default range: last 6 months
  const getDefaultDates = () => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    return {
      from: sixMonthsAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  };

  const initialDates = getDefaultDates();
  const [fromDate, setFromDate] = useState(initialDates.from);
  const [toDate, setToDate] = useState(initialDates.to);
  const [tutorId, setTutorId] = useState('');
  const [category, setCategory] = useState('');
  const [method, setMethod] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [tutorsList, setTutorsList] = useState([]);

  // Fetch report stats
  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (tutorId) params.append('tutor_id', tutorId);
      if (category) params.append('category', category);
      if (method) params.append('method', method);

      const res = await api.get(`/admin/reports/stats?${params.toString()}`);
      setReportData(res.data || res);
    } catch (err) {
      if (showError) {
        showError(err.response?.data?.message || err.message || 'Gagal memuat statistik laporan.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch counselor list for filter
  useEffect(() => {
    api
      .get('/admin/users?role=TUTOR&per_page=100')
      .then((res) => {
        const users = res.data?.data || res.data || [];
        setTutorsList(users.filter((u) => u.role === 'TUTOR'));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate, tutorId, category, method]);

  // Quick Date Selectors
  const setQuickRange = (months) => {
    const today = new Date();
    const past = new Date();
    past.setMonth(today.getMonth() - months);
    setFromDate(past.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  };

  // Handle CSV Download
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (tutorId) params.append('tutor_id', tutorId);
      if (category) params.append('category', category);
      if (method) params.append('method', method);

      const response = await api.get(`/admin/reports/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data || response], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-konseling-${fromDate}-sd-${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (showSuccess) showSuccess('File laporan CSV/Excel berhasil diunduh.');
    } catch (err) {
      if (showError) showError('Gagal mengunduh laporan CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || {};
  const meta = reportData?.meta || {};
  const categoryBreakdown = reportData?.category_breakdown || [];
  const methodBreakdown = reportData?.method_breakdown || [];
  const riskLevels = reportData?.risk_level_breakdown || {};
  const counselorPerformance = reportData?.counselor_performance || [];
  const casesList = reportData?.cases_list || [];

  // Filter cases in table
  const filteredCases = casesList.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.case_number?.toLowerCase().includes(q) ||
      c.counselee_name?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.tutor_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Print-Only Style Definition */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header Card (No-print) */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Award className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Laporan & Rekapitulasi Akreditasi
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Data statistik, kinerja konseling, klasifikasi masalah, dan indeks kepuasan konseli untuk
            keperluan evaluasi mutu dan akreditasi BAN-PT / LAMDIK UIN Siber Syekh Nurjati Cirebon.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || isLoading}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'Mengunduh...' : 'Ekspor Excel / CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (No-print) */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Filter Periode & Parameter:</span>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setQuickRange(1)}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white rounded-lg transition-all"
            >
              1 Bulan
            </button>
            <button
              type="button"
              onClick={() => setQuickRange(6)}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white rounded-lg transition-all"
            >
              Semester Ini (6 Bln)
            </button>
            <button
              type="button"
              onClick={() => setQuickRange(12)}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white rounded-lg transition-all"
            >
              1 Tahun
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Dari Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Dari Tanggal:</label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Sampai Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Sampai Tanggal:</label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Filter Konselor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Konselor BK:</label>
            <select
              value={tutorId}
              onChange={(e) => setTutorId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Semua Konselor</option>
              {tutorsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kategori */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Kategori Masalah:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Semua Kategori</option>
              <option value="Akademik">Akademik</option>
              <option value="Pribadi">Pribadi</option>
              <option value="Sosial">Sosial</option>
              <option value="Karier">Karier / Pekerjaan</option>
              <option value="Keluarga">Keluarga</option>
              <option value="Adaptasi">Adaptasi Kampus</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Filter Metode */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Metode Layanan:</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Semua Metode</option>
              <option value="ZOOM">Video (Zoom)</option>
              <option value="CHAT">Chat Konseling</option>
              <option value="OFFLINE">Tatap Muka Langsung</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area (Also container for printable view) */}
      <div id="printable-report" className="space-y-6">
        {/* Printable Letterhead (Only visible during print) */}
        <div className="hidden print:block border-b-4 border-double border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src="/logobk.png" alt="Logo Institusi" className="w-16 h-16 object-contain" />
            <div className="text-center flex-1">
              <h1 className="text-base font-bold uppercase tracking-wider text-slate-900">
                Kementerian Agama Republik Indonesia
              </h1>
              <h2 className="text-lg font-black uppercase text-slate-900">
                Universitas Islam Negeri Siber Syekh Nurjati Cirebon (UINSSC)
              </h2>
              <h3 className="text-sm font-bold text-emerald-800">
                PUSAT LAYANAN BIMBINGAN DAN KONSELING MAHASISWA
              </h3>
              <p className="text-[11px] text-slate-600">
                Gedung Layanan Kemahasiswaan Lt. 2, Kampus Siber UINSSC | Surel: bk@uinssc.ac.id
              </p>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between items-center text-xs font-semibold">
            <span>DOKUMEN EVALUASI & AKREDITASI PERGURUAN TINGGI (BAN-PT / LAMDIK)</span>
            <span>No. Dok: UINSSC/PBK/L-AKR/{new Date().getFullYear()}</span>
          </div>
        </div>

        {/* 1. Summary KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Total Kasus */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Total Kasus</span>
              <FolderHeart className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.total_cases ?? 0}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
              <span>{summary.completion_rate ?? 0}% Selesai</span>
              <span className="text-slate-400 font-normal">({summary.completed_cases ?? 0} kasus)</span>
            </div>
          </div>

          {/* Card 2: Total Sesi */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Sesi Terlaksana</span>
              <Clock className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.completed_sessions ?? 0}</p>
            <div className="text-[11px] text-slate-500">
              Total {summary.total_sessions ?? 0} sesi didaftarkan
            </div>
          </div>

          {/* Card 3: Konseli Unik */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Konseli Terlayani</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.unique_counselees ?? 0}</p>
            <div className="text-[11px] text-indigo-700 font-medium">Mahasiswa & Civitas</div>
          </div>

          {/* Card 4: Kepuasan / Rating */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Kepuasan Konseli</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-slate-900">{summary.avg_satisfaction_rating ?? 5.0}</p>
              <span className="text-xs font-bold text-slate-400">/ 5.0</span>
            </div>
            <div className="text-[11px] text-amber-800 font-medium">
              Dari {summary.total_feedbacks ?? 0} ulasan konseli
            </div>
          </div>

          {/* Card 5: Skrining & Deteksi Risiko */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Skrining Mandiri</span>
              <Activity className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.total_screenings ?? 0}</p>
            <div className="text-[11px] text-rose-700 font-semibold">
              {riskLevels.KRISIS ?? 0} Terdeteksi Siaga/Krisis
            </div>
          </div>
        </div>

        {/* 2. Visual Breakdowns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box A: Klasifikasi Topik Permasalahan */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                1. Klasifikasi Topik Masalah Mahasiswa
              </h3>
              <span className="text-[11px] font-bold text-slate-500">Persentase</span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada data kasus di periode ini.</p>
            ) : (
              <div className="space-y-2.5">
                {categoryBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{item.category}</span>
                      <span className="text-slate-600 font-semibold">
                        {item.count} kasus ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Box B: Distribusi Metode Layanan */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                2. Distribusi Moda & Metode Konseling
              </h3>
              <span className="text-[11px] font-bold text-slate-500">Volume</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['ZOOM', 'CHAT', 'OFFLINE'].map((m) => {
                const found = methodBreakdown.find((x) => x.method === m);
                const count = found?.count || 0;
                const pct = found?.percentage || 0;
                const labels = {
                  ZOOM: { name: 'Video Zoom', icon: Video, color: 'text-teal-700 bg-teal-50' },
                  CHAT: { name: 'Chat Online', icon: MessageSquare, color: 'text-emerald-700 bg-emerald-50' },
                  OFFLINE: { name: 'Tatap Muka', icon: Building2, color: 'text-blue-700 bg-blue-50' },
                };
                const config = labels[m];
                const Icon = config.icon;

                return (
                  <div
                    key={m}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col items-center text-center space-y-1.5"
                  >
                    <span className={`p-2 rounded-xl ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-800">{config.name}</span>
                    <span className="text-lg font-black text-slate-900">{count}</span>
                    <span className="text-[10px] text-slate-500">{pct}% dari total</span>
                  </div>
                );
              })}
            </div>

            {/* Skrining Risiko Singkat */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                Distribusi Skrining Kesehatan Mental:
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100 font-medium">
                  Rendah: <strong className="font-bold">{riskLevels.RENDAH ?? 0}</strong>
                </div>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-100 font-medium">
                  Sedang: <strong className="font-bold">{riskLevels.SEDANG ?? 0}</strong>
                </div>
                <div className="p-1.5 rounded-lg bg-orange-50 text-orange-900 border border-orange-100 font-medium">
                  Tinggi: <strong className="font-bold">{riskLevels.TINGGI ?? 0}</strong>
                </div>
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-100 font-bold">
                  Krisis: {riskLevels.KRISIS ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Beban & Kinerja Konselor BK */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              3. Kinerja & Beban Penugasan Konselor BK (Akreditasi)
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {counselorPerformance.length} Konselor Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nama Konselor</th>
                  <th className="py-2.5 px-3">NIP</th>
                  <th className="py-2.5 px-3">Spesialisasi</th>
                  <th className="py-2.5 px-3 text-center">Kasus Ditangani</th>
                  <th className="py-2.5 px-3 text-center">Sesi Selesai</th>
                  <th className="py-2.5 px-3 text-center">Rata-rata Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {counselorPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400">
                      Belum ada data konselor aktif.
                    </td>
                  </tr>
                ) : (
                  counselorPerformance.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{c.nip}</td>
                      <td className="py-2.5 px-3 text-slate-700">{c.specialization}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {c.total_cases}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                        {c.completed_sessions}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {c.avg_rating}.0
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Rincian Kasus Konseling (Tabel Detail) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              4. Rincian Dokumen Kasus Konseling ({filteredCases.length} Kasus)
            </h3>

            {/* Quick search inside table */}
            <div className="relative no-print">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nomor kasus, nama, topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Kasus</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Konseli</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Konselor</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Sesi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      Tidak ada kasus yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredCases.slice(0, 50).map((cs) => (
                    <tr key={cs.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {cs.case_number}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {cs.created_at}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 block">{cs.counselee_name}</span>
                        <span className="text-[10px] text-slate-400">{cs.counselee_type}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{cs.category}</td>
                      <td className="py-2.5 px-3 text-slate-700">{cs.tutor_name}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">{cs.method}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cs.status === 'COMPLETED' || cs.status === 'CLOSED'
                              ? 'bg-slate-100 text-slate-700'
                              : cs.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-700'
                              : cs.status === 'WAITING_REVIEW'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {cs.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {cs.sessions_count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredCases.length > 50 && (
            <p className="text-[11px] text-slate-400 text-center pt-2 no-print">
              Menampilkan 50 kasus pertama. Untuk rincian lengkap seluruh data, silakan gunakan tombol{' '}
              <strong>Ekspor Excel / CSV</strong> di atas.
            </p>
          )}
        </div>

        {/* Institutional Signature Section (Visible in print) */}
        <div className="hidden print:block pt-10">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="font-semibold text-slate-700 mb-16">
                Petugas Verifikator / Pengelola Data BK,
              </p>
              <p className="font-bold underline text-slate-900">Administrator Sistem Ruang BK</p>
              <p className="text-slate-500">NIP. 198501152010121002</p>
            </div>
            <div>
              <p className="text-slate-700 mb-1">
                Cirebon,{' '}
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="font-semibold text-slate-700 mb-16">
                Mengetahui,<br />Kepala Pusat Layanan Bimbingan & Konseling
              </p>
              <p className="font-bold underline text-slate-900">
                Dr. Hj. Siti Fatimah, M.Pd., Kons.
              </p>
              <p className="text-slate-500">NIP. 197804122005012003</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
