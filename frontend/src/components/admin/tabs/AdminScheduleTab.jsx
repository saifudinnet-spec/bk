import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  CalendarDays,
  Video,
  MessageSquare,
  MapPin,
  Search,
} from 'lucide-react';

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Terjadwal', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CalendarDays },
  READY: { label: 'Siap Mulai', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle },
  IN_PROGRESS: { label: 'Berlangsung', color: 'bg-green-100 text-green-700 border-green-200', icon: Play },
  COMPLETED: { label: 'Selesai', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-600 border-red-200', icon: XCircle },
};

const METHOD_CONFIG = {
  ZOOM: { label: 'Video (Zoom)', icon: Video, color: 'text-blue-600' },
  CHAT: { label: 'Chat', icon: MessageSquare, color: 'text-green-600' },
  OFFLINE: { label: 'Tatap Muka', icon: MapPin, color: 'text-orange-600' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function MethodIcon({ method }) {
  const cfg = METHOD_CONFIG[method] || { label: method || '-', icon: CalendarDays, color: 'text-slate-500' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon size={13} />
      {cfg.label}
    </span>
  );
}

export default function AdminScheduleTab({ showSuccess, showError }) {
  const [sessions, setSessions] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterTutor, setFilterTutor] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [search, setSearch] = useState('');

  const loadCounselors = useCallback(async () => {
    try {
      const res = await api.get('/admin/counselor-schedules');
      setCounselors(res.data || []);
    } catch {}
  }, []);

  const loadSessions = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page });
      if (filterStatus) params.append('status', filterStatus);
      if (filterTutor) params.append('tutor_id', filterTutor);
      if (filterFrom) params.append('from', filterFrom);
      if (filterTo) params.append('to', filterTo);

      const res = await api.get(`/admin/counseling-schedules?${params}`);
      const raw = res;
      if (raw && raw.data && Array.isArray(raw.data)) {
        setSessions(raw.data);
        setTotalPages(raw.last_page || 1);
        setTotal(raw.total || raw.data.length);
      } else if (Array.isArray(raw)) {
        setSessions(raw);
        setTotalPages(1);
        setTotal(raw.length);
      } else {
        setSessions([]);
        setTotal(0);
      }
    } catch {
      showError?.('Gagal memuat data jadwal konseling.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterTutor, filterFrom, filterTo]);

  useEffect(() => { loadCounselors(); }, [loadCounselors]);
  useEffect(() => { loadSessions(1); setCurrentPage(1); }, [filterStatus, filterTutor, filterFrom, filterTo]);

  const handleRefresh = () => loadSessions(currentPage);
  const handlePageChange = (p) => { setCurrentPage(p); loadSessions(p); };

  const filteredSessions = sessions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.user?.name?.toLowerCase().includes(q) ||
      s.tutor?.name?.toLowerCase().includes(q) ||
      s.counseling_case?.case_number?.toLowerCase().includes(q) ||
      s.counseling_case?.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={22} />
            Monitor Jadwal Konseling
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pantau semua sesi konseling mahasiswa &mdash; {total} sesi ditemukan
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-600">Filter Jadwal</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status Sesi</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">Semua Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Konselor</label>
            <select
              value={filterTutor}
              onChange={(e) => setFilterTutor(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">Semua Konselor</option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
        <div className="mt-3 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama mahasiswa, konselor, atau nomor kasus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Memuat data jadwal...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Tidak ada sesi konseling ditemukan.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Mahasiswa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Konselor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Jadwal</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Metode</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Topik / Kasus</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((session) => {
                    const startAt = session.start_at ? new Date(session.start_at) : null;
                    const endAt = session.end_at ? new Date(session.end_at) : null;
                    return (
                      <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {session.user?.avatar ? (
                              <img src={session.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <User size={14} className="text-indigo-600" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-800">{session.user?.name || '-'}</div>
                              <div className="text-xs text-slate-400">{session.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {session.tutor?.avatar ? (
                              <img src={session.tutor.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                <UserCheck size={14} className="text-teal-600" />
                              </div>
                            )}
                            <div className="font-medium text-slate-700">{session.tutor?.name || '-'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {startAt ? (
                            <div>
                              <div className="font-medium text-slate-700">
                                {startAt.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock size={11} />
                                {startAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                {endAt && ` – ${endAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                              </div>
                            </div>
                          ) : <span className="text-slate-400 text-xs">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <MethodIcon method={session.method || session.counseling_case?.method} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700 font-medium">{session.counseling_case?.category || '-'}</div>
                          <div className="text-xs text-slate-400">{session.counseling_case?.case_number}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={session.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">Halaman {currentPage} dari {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft size={16} className="text-slate-600" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === currentPage ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronRight size={16} className="text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
