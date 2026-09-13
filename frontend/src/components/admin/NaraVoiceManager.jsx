import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Square,
  Play,
  RotateCcw,
  Upload,
  Trash2,
  CheckCircle2,
  Clock,
  Volume2,
  FileAudio,
  AlertCircle,
  Sparkles,
  Headphones,
  Save,
  X,
  Edit3,
  Copy,
  Check,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../store/ToastContext';

export const NaraVoiceManager = () => {
  const [recordings, setRecordings] = useState([]);
  const [stats, setStats] = useState({
    total_scripts: 0,
    recorded_count: 0,
    pending_count: 0,
    completion_percentage: 0,
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | recorded | pending
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Recording Modal State
  const [activeScriptToRecord, setActiveScriptToRecord] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordingState, setRecordingState] = useState('idle'); // idle | recording | preview | saving
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);

  // Edit / New Script Modal
  const [editingScript, setEditingScript] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingScript, setIsSavingScript] = useState(false);

  // Audio Upload file input ref
  const uploadInputRefs = useRef({});
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const { showSuccess, showError } = useToast();

  const loadRecordings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/voice-recordings');
      setRecordings(res.recordings || []);
      setStats(res.stats || {
        total_scripts: 0,
        recorded_count: 0,
        pending_count: 0,
        completion_percentage: 0,
      });
      setCategories(res.categories || []);
    } catch (err) {
      showError('Gagal memuat daftar naskah rekaman suara.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();

    return () => {
      stopRecordingCleanup();
    };
  }, []);

  // Cleanup active audio stream & timer
  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Open in-browser recording modal
  const handleOpenRecordModal = (script) => {
    stopRecordingCleanup();
    setActiveScriptToRecord(script);
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setIsRecordModalOpen(true);
  };

  // Start recording from microphone
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported mime type
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        setRecordingState('preview');
      };

      mediaRecorder.start(200);
      setRecordingState('recording');
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      showError('Tidak dapat mengakses mikrofon. Pastikan Anda mengizinkan akses mikrofon di browser.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopRecordingCleanup();
  };

  // Save recorded audio to database & server
  const saveRecordingToDatabase = async () => {
    if (!audioBlob || !activeScriptToRecord) return;

    setRecordingState('saving');
    try {
      const formData = new FormData();
      const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
      formData.append('audio', audioBlob, `${activeScriptToRecord.key}.${ext}`);
      formData.append('duration', recordingTime);

      const res = await api.post(`/admin/voice-recordings/${activeScriptToRecord.key}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showSuccess(`Suara untuk "${activeScriptToRecord.title}" berhasil disimpan!`);
      setIsRecordModalOpen(false);
      loadRecordings();
    } catch (err) {
      showError(err.message || 'Gagal menyimpan rekaman ke server.');
      setRecordingState('preview');
    }
  };

  // Handle direct file upload (MP3/WAV/WebM)
  const handleFileUpload = async (script, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showError('Ukuran file maksimal 20MB.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);

    try {
      showSuccess('Mengunggah file audio...');
      await api.post(`/admin/voice-recordings/${script.key}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showSuccess(`File audio untuk "${script.title}" berhasil diunggah!`);
      loadRecordings();
    } catch (err) {
      showError(err.message || 'Gagal mengunggah file audio.');
    }
  };

  // Delete audio recording
  const handleDeleteAudio = async (script) => {
    if (!window.confirm(`Hapus rekaman suara untuk "${script.title}"? Status naskah akan kembali menjadi belum direkam.`)) {
      return;
    }

    try {
      await api.delete(`/admin/voice-recordings/${script.key}/audio`);
      showSuccess('Rekaman suara berhasil dihapus.');
      loadRecordings();
    } catch (err) {
      showError('Gagal menghapus rekaman.');
    }
  };

  // Copy script text to clipboard
  const [copiedKey, setCopiedKey] = useState(null);
  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered recordings
  const filteredRecordings = recordings.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'recorded' && item.has_audio) ||
      (statusFilter === 'pending' && !item.has_audio);
    const matchSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchStatus && matchSearch;
  });

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Studio Banner & Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 p-6 sm:p-8 text-white shadow-soft-xl border border-emerald-700/50">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
            <Mic className="w-3.5 h-3.5 text-emerald-300" />
            <span>Studio Rekaman Suara Nara</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Isi Suara Asli Konselor untuk Asisten Virtual Nara
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
            Rekam langsung suara Anda dari mikrofon atau unggah audio studio untuk setiap dialog Nara.
            Suara yang tersimpan di database akan otomatis diputar saat mahasiswa mengisi formulir konseling atau berinteraksi dengan Nara.
          </p>
        </div>

        {/* Decorative Background Sound Wave */}
        <div className="absolute right-4 bottom-2 opacity-15 pointer-events-none flex items-end gap-1.5 h-28">
          {[40, 65, 85, 45, 95, 110, 70, 85, 120, 90, 60, 80, 50, 70].map((h, idx) => (
            <div
              key={idx}
              className="w-2.5 bg-white rounded-t-full"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Naskah</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileAudio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.total_scripts}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Seluruh dialog dalam sistem</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase">Sudah Direkam</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{stats.recorded_count}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Suara asli siap diputar</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase">Belum Diisi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats.pending_count}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Memakai suara sintetis</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Kelengkapan</span>
            <span className="text-xs font-extrabold text-emerald-700">{stats.completion_percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completion_percentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">
            {stats.recorded_count} dari {stats.total_scripts} naskah selesai
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-soft-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari naskah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="recorded">Sudah Ada Suara</option>
            <option value="pending">Belum Diisi</option>
          </select>

          <button
            type="button"
            onClick={loadRecordings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Segarkan Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Script Cards List */}
      <div className="space-y-4">
        {filteredRecordings.map((script) => {
          return (
            <div
              key={script.id}
              className={`p-5 rounded-2xl bg-white border transition-all ${
                script.has_audio
                  ? 'border-emerald-200 shadow-soft-sm'
                  : 'border-slate-200/90 hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Script Info & Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                      {script.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">#{script.key}</span>

                    {/* Status Badge */}
                    {script.has_audio ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Sudah Ada Suara {script.duration ? `(${formatTime(script.duration)})` : ''}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Belum Direkam</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900">{script.title}</h3>
                    {script.context_hint && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">{script.context_hint}</p>
                    )}
                  </div>

                  {/* The Teleprompter Text Box */}
                  <div className="relative p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 group">
                    <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed pr-8 select-text">
                      "{script.text}"
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(script.text, script.key)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 border border-slate-200 transition-colors"
                      title="Salin teks naskah"
                    >
                      {copiedKey === script.key ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Audio Player if already recorded */}
                  {script.has_audio && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <div className="w-full sm:w-auto flex-1">
                        <audio
                          controls
                          src={script.audio_url}
                          className="w-full h-8"
                          preload="metadata"
                        />
                      </div>
                      {script.user && (
                        <div className="text-[10px] text-slate-500 shrink-0">
                          Direkam oleh: <span className="font-bold text-slate-700">{script.user.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-1">
                  {/* Record Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenRecordModal(script)}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-soft-sm ${
                      script.has_audio
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{script.has_audio ? 'Rekam Ulang' : 'Rekam Suara'}</span>
                  </button>

                  {/* Upload Audio File Alternative */}
                  <button
                    type="button"
                    onClick={() => uploadInputRefs.current[script.key]?.click()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    title="Unggah file MP3, WAV, atau WebM"
                  >
                    <Upload className="w-3 h-3 text-slate-500" />
                    <span>Unggah File</span>
                  </button>

                  <input
                    type="file"
                    ref={(el) => (uploadInputRefs.current[script.key] = el)}
                    onChange={(e) => handleFileUpload(script, e)}
                    accept="audio/*,.mp3,.wav,.webm,.m4a,.ogg"
                    className="hidden"
                  />

                  {/* Delete Audio Button */}
                  {script.has_audio && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAudio(script)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Hapus rekaman suara"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* IN-BROWSER RECORDING STUDIO MODAL */}
      <AnimatePresence>
        {isRecordModalOpen && activeScriptToRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-emerald-100" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold tracking-tight">Studio Perekam Suara Nara</h3>
                    <p className="text-xs text-emerald-100/90 font-medium">{activeScriptToRecord.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopRecordingCleanup();
                    setIsRecordModalOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Teleprompter Script Area */}
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Naskah Yang Harus Dibaca:</span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Intonasi Ramah & Santai
                    </span>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-900 text-emerald-300 font-semibold text-base sm:text-lg leading-relaxed shadow-inner select-text text-center min-h-[90px] flex items-center justify-center">
                    "{activeScriptToRecord.text}"
                  </div>
                  <p className="text-[11px] text-slate-400 text-center italic">
                    💡 Tips: Bernapaslah sejenak, bicaralah dengan lembut dan tempo teratur seolah sedang menyapa mahasiswa secara langsung.
                  </p>
                </div>

                {/* Recorder Controls Area */}
                <div className="pt-2 border-t border-slate-100 flex flex-col items-center justify-center space-y-4">
                  {/* State 1: IDLE */}
                  {recordingState === 'idle' && (
                    <div className="text-center space-y-3 py-2">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer mx-auto"
                        title="Klik untuk mulai merekam suara"
                      >
                        <Mic className="w-9 h-9" />
                      </button>
                      <div className="text-sm font-extrabold text-slate-800">Klik Mikrofon Untuk Mulai Merekam</div>
                      <div className="text-xs text-slate-400">Pastikan izin mikrofon telah diaktifkan di browser Anda</div>
                    </div>
                  )}

                  {/* State 2: RECORDING */}
                  {recordingState === 'recording' && (
                    <div className="text-center space-y-4 py-2 w-full">
                      {/* Live timer & flashing indicator */}
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-black text-sm animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                        <span>MEREKAM: {formatTime(recordingTime)}</span>
                      </div>

                      {/* Animated Sound Wave Visualizer */}
                      <div className="flex items-center justify-center gap-1.5 h-12">
                        {[20, 45, 80, 55, 90, 100, 65, 85, 95, 70, 40, 60, 30].map((h, i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-emerald-500 rounded-full animate-bounce"
                            style={{
                              height: `${h}%`,
                              animationDelay: `${(i * 100) % 600}ms`,
                              animationDuration: '0.8s',
                            }}
                          />
                        ))}
                      </div>

                      {/* Stop Recording Button */}
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-500/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>Selesai & Berhenti Rekam</span>
                      </button>
                    </div>
                  )}

                  {/* State 3: PREVIEW & SAVE */}
                  {(recordingState === 'preview' || recordingState === 'saving') && (
                    <div className="w-full space-y-4 py-1">
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="text-xs text-emerald-950 font-medium flex-1">
                          <span className="font-extrabold">Rekaman Selesai ({formatTime(recordingTime)})</span>. Dengarkan kembali hasil suara Anda di bawah:
                        </div>
                      </div>

                      {audioPreviewUrl && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                          <audio
                            controls
                            src={audioPreviewUrl}
                            className="w-full h-9"
                            autoPlay
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={startRecording}
                          disabled={recordingState === 'saving'}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Ulangi Rekaman</span>
                        </button>

                        <button
                          type="button"
                          onClick={saveRecordingToDatabase}
                          disabled={recordingState === 'saving'}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-soft-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          {recordingState === 'saving' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Menyimpan ke Database...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Simpan Suara ke Database</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NaraVoiceManager;
