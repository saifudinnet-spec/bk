import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, GraduationCap, ChevronRight, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { ListSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';

export const TutorStudents = () => {
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await api.get('/cases');
        setCases(res.data || []);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Group unique students from cases
  const studentsMap = new Map();
  cases.forEach((c) => {
    if (c.user && !studentsMap.has(c.user.id)) {
      studentsMap.set(c.user.id, {
        user: c.user,
        latestCase: c,
        totalCases: cases.filter((item) => item.user_id === c.user.id).length,
      });
    }
  });

  const students = Array.from(studentsMap.values()).filter((item) =>
    item.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-darktext">Daftar Mahasiswa & Klien</h2>
          <p className="text-xs text-mutedtext">Klien yang memiliki riwayat kasus atau sedang berkonsultasi</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan nama mahasiswa..."
          className="w-full h-12 px-4 pl-10 rounded-2xl border border-softborder bg-white text-xs sm:text-sm text-darktext focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-soft-sm"
        />
        <Search className="w-4 h-4 text-mutedtext absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : students.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-softborder">
          <p className="text-xs text-mutedtext">Tidak ada mahasiswa yang ditemukan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map(({ user, latestCase, totalCases }) => (
            <div
              key={user.id}
              onClick={() => navigate(`/app/cases/${latestCase.id}`)}
              className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-sm">
                  {user.name?.charAt(0) || 'M'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-darktext">{user.name}</h4>
                  <p className="text-xs text-mutedtext mt-0.5">{user.email}</p>
                  <span className="inline-block text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 mt-1">
                    {totalCases} Kasus Konseling
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                <span>Lihat Kasus</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
};

export default TutorStudents;
