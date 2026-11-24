import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  Users,
  Star,
  FolderHeart,
  Video,
  MessageSquare,
  Building2,
  Search,
  MessageCircleHeart,
  Clock,
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
        showError(err.response?.data?.message || err.message || 'Gagal memuat laporan konseling.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch counselor list for filter dropdown
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

      if (showSuccess) showSuccess('File Excel / CSV laporan konseling berhasil diunduh.');
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
  const casesList = reportData?.cases_list || [];

  // Filter cases in table
  const filteredCases = casesList.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.case_number?.toLowerCase().includes(q) ||
      c.counselee_name?.toLowerCase().includes(q) ||
      c.counselee_email?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.tutor_name?.toLowerCase().includes(q) ||
      c.review?.toLowerCase().includes(q)
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
            padding: 16px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Card (No-print) */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Laporan & Ekspor Data Konseling
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Rekap lengkap data layanan konseling: nomor kasus, data konseli, topik permasalahan,
            konselor, metode layanan, serta skor rating kepuasan dan ulasan.
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
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (No-print) */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Filter Data:</span>
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
              6 Bulan
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
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Sampai Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Sampai Tanggal:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
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

          {/* Filter Topik */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Topik Permasalahan:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Semua Topik</option>
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

      {/* Main Content Area */}
      <div id="printable-report" className="space-y-6">
        {/* Simple Print Header (Visible only when printed) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
          <h1 className="text-lg font-black text-slate-900 uppercase">
            LAPORAN REKAPITULASI DATA KONSELING
          </h1>
          <div className="flex justify-between items-center text-xs text-slate-700 mt-1">
            <span>Periode: {fromDate} s/d {toDate}</span>
            <span>Dicetak pada: {new Date().toLocaleDateString('id-ID')}</span>
          </div>
        </div>

        {/* Ringkasan Singkat (4 Card Sederhana) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 no-print">
          {/* Card 1: Total Kasus */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Total Kasus</span>
              <FolderHeart className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.total_cases ?? 0}</p>
            <p className="text-[11px] text-emerald-700 font-medium">
              {summary.completed_cases ?? 0} kasus selesai
            </p>
          </div>

          {/* Card 2: Sesi Selesai */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Sesi Terlaksana</span>
              <Clock className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.completed_sessions ?? 0}</p>
            <p className="text-[11px] text-slate-500">
              dari {summary.total_sessions ?? 0} jadwal sesi
            </p>
          </div>

          {/* Card 3: Rata-rata Skor Rating */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Rata-rata Rating</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-black text-slate-900">
                {summary.avg_satisfaction_rating ?? 5.0}
              </p>
              <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
            </div>
            <p className="text-[11px] text-amber-800 font-medium">Skor kepuasan konseli</p>
          </div>

          {/* Card 4: Total Ulasan Masuk */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Ulasan Diterima</span>
              <MessageCircleHeart className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.total_feedbacks ?? 0}</p>
            <p className="text-[11px] text-indigo-700 font-medium">Ulasan & masukan konseli</p>
          </div>
        </div>

        {/* Tabel Data Kasus & Ulasan Konseling */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Daftar Kasus & Ulasan Konseling
              </h3>
              <p className="text-[11px] text-slate-500">
                Menampilkan {filteredCases.length} kasus dari periode terpilih
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative no-print">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nomor kasus, nama, topik, ulasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Kasus</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Data Konseli</th>
                  <th className="py-2.5 px-3">Topik Masalah</th>
                  <th className="py-2.5 px-3">Konselor</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Rating</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Ulasan Konseli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada data kasus yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((cs) => (
                    <tr key={cs.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nomor Kasus */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {cs.case_number}
                      </td>

                      {/* Tanggal */}
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {cs.created_at}
                      </td>

                      {/* Data Konseli */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{cs.counselee_name}</span>
                        <span className="text-[10px] text-slate-500">{cs.counselee_email}</span>
                      </td>

                      {/* Topik Permasalahan */}
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-100">
                          {cs.category}
                        </span>
                      </td>

                      {/* Konselor */}
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {cs.tutor_name}
                      </td>

                      {/* Metode */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-slate-700 font-medium">
                          {cs.method === 'ZOOM'
                            ? 'Video Zoom'
                            : cs.method === 'CHAT'
                            ? 'Chat'
                            : 'Tatap Muka'}
                        </span>
                      </td>

                      {/* Status */}
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
                          {cs.status === 'COMPLETED'
                            ? 'Selesai'
                            : cs.status === 'CLOSED'
                            ? 'Ditutup'
                            : cs.status === 'CANCELLED'
                            ? 'Dibatalkan'
                            : cs.status === 'WAITING_REVIEW'
                            ? 'Menunggu Review'
                            : 'Aktif'}
                        </span>
                      </td>

                      {/* Skor Rating */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {cs.rating ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {cs.rating}.0
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Ulasan Konseli */}
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {cs.review ? (
                          <p className="italic line-clamp-2">"{cs.review}"</p>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
