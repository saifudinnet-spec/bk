import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, GraduationCap, ChevronRight, ArrowRight, Stethoscope, Phone, Mail, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { ListSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';
import CounseleeDiagnosticModal from '../../components/counseling/CounseleeDiagnosticModal';

export const TutorStudents = () => {
  const [studentList, setStudentList] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudentForDiagnostics, setSelectedStudentForDiagnostics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/tutor/students');
        const data = res.data?.data || res.data || [];
        setStudentList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const students = studentList.filter((item) => {
    const query = search.toLowerCase();
    const nameMatch = item.user?.name?.toLowerCase().includes(query);
    const nimMatch = (item.user?.studentProfile?.nim || item.user?.student_profile?.nim || '').toLowerCase().includes(query);
    const prodiMatch = (item.user?.studentProfile?.program_study || item.user?.student_profile?.program_study || '').toLowerCase().includes(query);
    const caseMatch = (item.latestCase?.category || '').toLowerCase().includes(query) || (item.latestCase?.case_number || '').toLowerCase().includes(query);
    return nameMatch || nimMatch || prodiMatch || caseMatch;
  });

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-darktext">Daftar Kasus & Klien Konseli</h2>
          <p className="text-xs text-mutedtext">
            Riwayat kasus bimbingan konseling, rekam asesmen, dan pendampingan konseli aktif
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan nama mahasiswa, NIM, program studi, atau kategori kasus..."
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
          {students.map(({ user, latestCase, totalCases }) => {
            const studentProfile = user.studentProfile || user.student_profile || {};
            const cleanPhone = (user.phone || '').replace(/\D/g, '');
            const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

            return (
              <div
                key={user.id}
                className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-900 font-bold flex items-center justify-center text-base shrink-0 border border-emerald-200">
                    {user.name?.charAt(0) || 'M'}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-darktext hover:text-emerald-800 transition-colors">
                        {user.name}
                      </h4>
                      {studentProfile.nim && (
                        <span className="text-[10px] font-mono text-mutedtext bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                          NIM: {studentProfile.nim}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                        {totalCases} Kasus
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-mutedtext">
                      {studentProfile.program_study && (
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {studentProfile.program_study}
                        </span>
                      )}
                      <span>• {user.email}</span>
                      {user.phone && (
                        <span className="font-mono text-slate-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {user.phone}
                        </span>
                      )}
                    </div>

                    {latestCase?.category && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Kasus Terakhir: <strong className="text-slate-800">{latestCase.category}</strong>{' '}
                        <span className="text-slate-400 font-mono">({latestCase.case_number})</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForDiagnostics(user.id)}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors flex items-center justify-center gap-1.5"
                    title="Buka rekam diagnosa, asesmen, dan kuesioner mahasiswa"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                    <span>Rekam Diagnosa & Asesmen</span>
                  </button>

                  {latestCase?.id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/tutor/cases/${latestCase.id}`)}
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Detail Kasus</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Counselee Diagnostic Modal */}
      {selectedStudentForDiagnostics && (
        <CounseleeDiagnosticModal
          isOpen={!!selectedStudentForDiagnostics}
          studentId={selectedStudentForDiagnostics}
          onClose={() => setSelectedStudentForDiagnostics(null)}
        />
      )}
    </PageTransition>
  );
};

export default TutorStudents;
