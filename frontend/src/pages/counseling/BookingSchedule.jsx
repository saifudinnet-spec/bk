import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Check, ArrowRight, ArrowLeft, Video, ShieldCheck, Zap, Sun, Sunset, Moon } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';
import { ListSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';
import {
  SESSION_PERIODS,
  formatWibTime,
  formatYmdDate,
  groupSlotsBySessionPeriod,
} from '../../utils/scheduleHelpers';

export const BookingSchedule = () => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const tutorIdParam = searchParams.get('tutor_id');

  const [tutors, setTutors] = useState([]);
  const [caseDetail, setCaseDetail] = useState(null);
  const [selectedTutorId, setSelectedTutorId] = useState(tutorIdParam ? parseInt(tutorIdParam, 10) : null);
  const [groupedSlots, setGroupedSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const caseMethod = (caseDetail?.method || 'ZOOM').toUpperCase();
  const lockedTutorId = caseDetail?.tutor_id ? parseInt(caseDetail.tutor_id, 10) : null;

  const handleStartNow = async () => {
    setIsBooking(true);
    try {
      const res = await api.post('/sessions/instant', {
        tutor_id: selectedTutorId,
        initial_reason: 'Sesi langsung dijadwalkan pada jam saat ini.',
      });
      const sessionData = res.data?.data || res.data;
      showSuccess('Sesi konseling jam ini berhasil disiapkan!');
      navigate(`/counseling/session/${sessionData.id}`);
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal memulai sesi saat ini.');
    } finally {
      setIsBooking(false);
    }
  };

  // Load case & tutors once
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tutorsRes, caseRes] = await Promise.all([
          api.get('/tutors'),
          caseId ? api.get(`/cases/${caseId}`).catch(() => null) : Promise.resolve(null),
        ]);
        const tutorList = tutorsRes.data || [];
        setTutors(tutorList);

        const loadedCase = caseRes?.data || null;
        if (loadedCase) {
          setCaseDetail(loadedCase);
        }

        const initialTutorId = loadedCase?.tutor_id
          ? parseInt(loadedCase.tutor_id, 10)
          : (tutorIdParam ? parseInt(tutorIdParam, 10) : (tutorList[0]?.id || null));

        if (initialTutorId) {
          setSelectedTutorId(initialTutorId);
        }
      } catch (err) {
        showError('Gagal memuat konselor.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [caseId, tutorIdParam, showError]);

  // Load slots for chosen tutor & case method
  useEffect(() => {
    if (!selectedTutorId) return;

    const fetchSlots = async () => {
      try {
        const res = await api.get(`/tutors/${selectedTutorId}/slots?method=${caseMethod}`);
        setGroupedSlots(res.grouped_by_date || {});

        // Auto select first available date
        const dates = Object.keys(res.grouped_by_date || {});
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
          setSelectedSlot(null);
        } else {
          setSelectedDate('');
          setSelectedSlot(null);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      }
    };

    fetchSlots();
  }, [selectedTutorId, caseMethod]);

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      showError('Silakan pilih salah satu jam pertemuan yang tersedia.');
      return;
    }

    setIsBooking(true);
    try {
      const response = await api.post('/sessions/book', {
        counseling_case_id: caseId,
        availability_id: selectedSlot.id,
      });

      showSuccess('Jadwal konseling berhasil dikonfirmasi!');
      const sessionData = response.data;
      navigate(`/counseling/session/${sessionData.id}`);
    } catch (err) {
      showError(err.message || 'Gagal memesan slot jadwal.');
    } finally {
      setIsBooking(false);
    }
  };

  const dates = Object.keys(groupedSlots);
  const slotsForSelectedDate = selectedDate ? groupedSlots[selectedDate] || [] : [];
  const activeTutor = tutors.find((t) => t.id === selectedTutorId);

  return (
    <PageTransition className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl border border-softborder bg-white flex items-center justify-center text-mutedtext hover:text-darktext shadow-soft-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-darktext">Pilih Jadwal Konseling</h2>
          <p className="text-xs text-mutedtext">Tentukan tanggal dan jam konsultasi video Anda</p>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : (
        <div className="space-y-5">
          {/* Tutor Selector Pills */}
          <div className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-3">
            <label className="block text-xs font-bold text-darktext">
              Konselor yang Bertugas:
            </label>
            <div className="flex flex-wrap gap-2">
              {tutors
                .filter((t) => !lockedTutorId || t.id === lockedTutorId)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={Boolean(lockedTutorId)}
                    onClick={() => setSelectedTutorId(t.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all min-h-[44px] ${
                      selectedTutorId === t.id
                        ? 'bg-emerald-600 text-white shadow-soft-sm'
                        : 'bg-gray-50 border border-softborder text-darktext hover:bg-gray-100'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Quick Instant Session Option for Testing / Real-time */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-soft-xs">
                <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                  Butuh Sesi / Ingin Uji Coba di Jam Sekarang?
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Mulai konsultasi saat ini juga ({formatWibTime(new Date())} WIB) tanpa harus memilih slot tanggal lain.
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              disabled={isBooking}
              onClick={handleStartNow}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-soft-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 self-end sm:self-center min-h-[40px]"
            >
              <Clock className="w-4 h-4" />
              <span>Mulai Sesi Sekarang (Instan)</span>
            </motion.button>
          </div>

          {/* Date Picker Buttons */}
          <div className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-darktext flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Pilih Tanggal:</span>
              </label>
              <span className="text-xs text-mutedtext font-medium">
                {dates.length} hari tersedia
              </span>
            </div>

            {dates.length === 0 ? (
              <p className="text-xs text-mutedtext py-4 text-center">
                Belum ada slot waktu dibuka oleh konselor ini untuk minggu ini.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dates.map((dStr) => {
                  const isSelected = selectedDate === dStr;
                  return (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dStr);
                        setSelectedSlot(null);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all min-h-[56px] ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-softborder bg-white text-darktext hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-[10px] text-mutedtext uppercase font-bold block">
                        {formatYmdDate(dStr, { weekday: 'short' })}
                      </span>
                      <span className="text-xs font-bold block mt-0.5">
                        {formatYmdDate(dStr, { day: 'numeric', month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time Slot Picker (Grouped by Pagi / Siang / Sore @ 30 menit) */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl bg-white border border-softborder shadow-soft-sm space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-darktext flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Pilih Jam Pertemuan Pasti per 30 Menit (WIB):</span>
                </label>
                <p className="text-[11px] text-mutedtext mt-0.5">
                  Slot dikelompokkan ke sesi Pagi, Siang, dan Sore. Jadwal Zoom yang bentrok otomatis ditandai.
                </p>
              </div>

              {slotsForSelectedDate.length === 0 ? (
                <p className="text-xs text-mutedtext py-3 text-center">
                  Slot pada tanggal ini telah penuh terisi.
                </p>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const byPeriod = groupSlotsBySessionPeriod(slotsForSelectedDate);
                    const icons = { morning: Sun, afternoon: Sunset, evening: Moon };

                    return SESSION_PERIODS.map((period) => {
                      const periodSlots = byPeriod[period.id] || [];
                      if (periodSlots.length === 0) return null;
                      const Icon = icons[period.id];

                      return (
                        <div key={period.id} className="space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                            <Icon className="w-3.5 h-3.5 text-teal-600" />
                            <span>Sesi {period.label}</span>
                            <span className="text-slate-400 font-normal">({period.time} WIB)</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {periodSlots.map((slot) => {
                              const isSelected = selectedSlot?.id === slot.id;
                              const isZoomConflict = slot.status === 'ZOOM_CONFLICT';
                              const isBooked = slot.status === 'BOOKED';
                              const isDisabled = isBooked || isZoomConflict;
                              const startTime = slot.start_time.substring(0, 5);
                              const endTime = slot.end_time.substring(0, 5);

                              return (
                                <motion.button
                                  key={slot.id}
                                  whileTap={isDisabled ? {} : { scale: 0.98 }}
                                  type="button"
                                  disabled={isDisabled}
                                  title={slot.conflict_reason || `${startTime} – ${endTime} WIB`}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all min-h-[48px] ${
                                    isZoomConflict
                                      ? 'border-rose-200 bg-rose-50/70 text-rose-500 cursor-not-allowed'
                                      : isBooked
                                      ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-70'
                                      : isSelected
                                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                                      : 'border-softborder bg-white text-darktext hover:bg-gray-50 font-medium'
                                  }`}
                                >
                                  <span className="text-xs">{startTime} – {endTime}</span>
                                  {isZoomConflict ? (
                                    <span className="text-[10px] font-bold">Zoom Penuh</span>
                                  ) : isBooked ? (
                                    <span className="text-[10px] font-bold">Penuh</span>
                                  ) : (
                                    isSelected && <Check className="w-4 h-4 text-emerald-600" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* Summary & Confirm */}
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-3"
            >
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Konfirmasi Jadwal Terpilih</span>
              </div>

              <div className="text-xs space-y-1 text-darktext">
                <p>Konselor: <strong>{activeTutor?.name}</strong></p>
                <p>
                  Waktu: <strong>{selectedDate}</strong> pukul{' '}
                  <strong>
                    {selectedSlot.start_time.substring(0, 5)} - {selectedSlot.end_time.substring(0, 5)} WIB
                  </strong>
                </p>
                <p className="text-[11px] text-mutedtext mt-1">
                  {caseMethod === 'ZOOM'
                    ? 'Ruang video meeting Zoom akan dibuat secara otomatis di dalam aplikasi.'
                    : caseMethod === 'CHAT'
                    ? 'Sesi akan berlangsung melalui Ruang Chat Konseling pribadi di dalam aplikasi.'
                    : 'Sesi tatap muka langsung di Ruang Layanan BK Kampus.'}
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={isBooking}
                onClick={handleConfirmBooking}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-soft-sm flex items-center justify-center gap-2 transition-all min-h-[48px]"
              >
                <span>{isBooking ? 'Menyimpan Jadwal...' : 'Konfirmasi Jadwal Ini'}</span>
                <Check className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </div>
      )}
    </PageTransition>
  );
};

export default BookingSchedule;
