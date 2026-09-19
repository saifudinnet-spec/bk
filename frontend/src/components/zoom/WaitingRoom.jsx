import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  Info,
  ArrowRight,
  Stethoscope,
  Sparkles,
  Volume2,
  Headphones,
  CheckCircle2,
  Zap,
  ExternalLink,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import CounseleeDiagnosticModal from '../counseling/CounseleeDiagnosticModal';

export const WaitingRoom = ({ session, onJoin, isTutor = false }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Device permissions & preview state
  const [devicePermission, setDevicePermission] = useState('idle'); // 'idle' | 'requesting' | 'granted' | 'denied' | 'insecure_http'
  const [mediaStream, setMediaStream] = useState(null);
  const [micLevel, setMicLevel] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(true);

  const previewVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const [checklist, setChecklist] = useState({
    headset: false,
    quietRoom: false,
    stableNetwork: true,
  });

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const playTestAudio = () => {
    try {
      setIsPlayingTestSound(true);
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        setIsPlayingTestSound(false);
        return;
      }
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(() => setIsPlayingTestSound(false), 500);
    } catch {
      setIsPlayingTestSound(false);
    }
  };

  // Request browser camera & microphone permissions immediately
  const requestPermissions = async () => {
    setDevicePermission('requesting');

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Check if getUserMedia is supported in current context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (!window.isSecureContext && !isLocalhost) {
        setDevicePermission('insecure_http');
      } else {
        setDevicePermission('denied');
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });

      mediaStreamRef.current = stream;
      setMediaStream(stream);
      setDevicePermission('granted');
      setIsCameraActive(true);
      setIsMicActive(true);

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.play().catch(() => {});
      }

      // Live microphone meter
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyserRef.current = analyser;
          analyser.fftSize = 256;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (e) {
        // Audio meter optional
      }
    } catch (err) {
      console.warn('getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setDevicePermission('denied');
      } else if (!window.isSecureContext && !isLocalhost) {
        setDevicePermission('insecure_http');
      } else {
        setDevicePermission('denied');
      }
    }
  };

  const stopMediaStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping media track:', e);
      }
      mediaStreamRef.current = null;
    }
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
    setMediaStream(null);
  };

  const handleJoin = () => {
    stopMediaStream();
    onJoin(true);
  };

  const toggleCamera = () => {
    const stream = mediaStreamRef.current || mediaStream;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraActive(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    const stream = mediaStreamRef.current || mediaStream;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicActive(audioTrack.enabled);
      }
    }
  };

  const copyToClipboard = (text, type) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  // Auto-request camera and mic permissions on mount
  useEffect(() => {
    requestPermissions();

    return () => {
      stopMediaStream();
    };
  }, []);

  // Re-attach video stream if element or stream changes
  useEffect(() => {
    if (previewVideoRef.current && mediaStream) {
      previewVideoRef.current.srcObject = mediaStream;
      previewVideoRef.current.play().catch(() => {});
    }
  }, [mediaStream]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const start = new Date(session.start_at).getTime();
      const end = new Date(session.end_at).getTime();
      const fifteenMinsBefore = start - 15 * 60 * 1000;

      const isTestCase = Boolean(
        session.counseling_case?.case_number?.startsWith('TEST-') ||
        session.counseling_case?.category?.toLowerCase().includes('uji')
      );

      if (isTestCase || (now >= fifteenMinsBefore && now <= end)) {
        setCanJoin(true);
        setTimeLeft('Sesi siap dimulai!');
      } else if (now > end) {
        setCanJoin(false);
        setTimeLeft('Sesi telah berakhir.');
      } else {
        setCanJoin(false);
        const diff = fifteenMinsBefore - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours > 0 ? `${hours} jam ` : ''}${minutes} menit ${seconds} detik`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const startDate = new Date(session.start_at);
  const endDate = new Date(session.end_at);
  const partnerName = isTutor ? session.user?.name : session.tutor?.name;
  const partnerRole = isTutor ? 'Klien / Mahasiswa' : 'Konselor Bimbingan Konseling';

  return (
    <div className="w-full h-full max-w-6xl mx-auto flex flex-col justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-soft-lg overflow-hidden flex flex-col max-h-[calc(100vh-3.5rem)]">
        {/* Compact Top Ribbon */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ruang Tunggu Konseling
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              {session.counseling_case?.category ? `Konseling ${session.counseling_case.category}` : 'Konseling Online'}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 shrink-0 font-medium">
            <div className="hidden sm:flex items-center gap-1 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{startDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
            </div>
            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-teal-50 text-teal-800 border border-teal-200">
              {timeLeft}
            </span>
          </div>
        </div>

        {/* 2-Column Split Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center flex-1 min-h-0 overflow-y-auto">
          {/* LEFT COLUMN: Camera & Microphone Preview (Col 1-7) */}
          <div className="lg:col-span-7 flex flex-col space-y-2.5">
            {/* Live Camera View Box */}
            <div className="relative w-full aspect-[16/10] sm:aspect-video max-h-[360px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              {devicePermission === 'granted' ? (
                <>
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                      isCameraActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <CameraOff className="w-8 h-8 mb-1.5 opacity-60 text-slate-500" />
                      <span className="font-medium">Kamera dinonaktifkan</span>
                    </div>
                  )}

                  {/* Overlaid Bottom Controls: Camera, Mic, Volume Meter */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleCamera}
                        title={isCameraActive ? 'Matikan Kamera' : 'Nyalakan Kamera'}
                        className={`p-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
                          isCameraActive ? 'bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isCameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={toggleMic}
                        title={isMicActive ? 'Mute Mic' : 'Unmute Mic'}
                        className={`p-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
                          isMicActive ? 'bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Mic volume meter */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-700/60 text-[11px] text-white">
                      <Mic className={`w-3.5 h-3.5 ${micLevel > 5 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-75"
                          style={{ width: `${isMicActive ? micLevel : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : devicePermission === 'requesting' ? (
                <div className="text-center p-4 space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Meminta izin kamera & mic browser...</p>
                </div>
              ) : devicePermission === 'denied' ? (
                <div className="text-center p-4 space-y-2">
                  <CameraOff className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">Izin Kamera atau Mikrofon Ditolak</p>
                  <button
                    type="button"
                    onClick={requestPermissions}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Coba Izin Lagi</span>
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">Browser Membatasi Kamera di IP Jaringan Lokal</p>
                  <button
                    type="button"
                    onClick={requestPermissions}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Cek Ulang Izin</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick check indicators below camera */}
            <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kamera & Audio Siap digunakan</span>
              </span>
              <button
                type="button"
                onClick={playTestAudio}
                disabled={isPlayingTestSound}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 transition-colors cursor-pointer"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingTestSound ? 'animate-bounce text-emerald-600' : ''}`} />
                <span>{isPlayingTestSound ? 'Memutar...' : 'Tes Audio'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Partner Card + Primary Join Action + Zoom Info (Col 8-12) */}
          <div className="lg:col-span-5 flex flex-col space-y-3 justify-center">
            {/* Counselor / Partner Card */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-soft-xs">
                    {partnerName?.charAt(0) || 'K'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{partnerName || 'Konselor BK'}</p>
                  <p className="text-[10px] text-emerald-800 font-medium truncate">{partnerRole}</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 shadow-soft-xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{canJoin ? 'Siap di Ruang Sesi' : 'Terjadwal'}</span>
              </span>
            </div>

            {/* Tutor diagnostic button if tutor */}
            {isTutor && (
              <button
                type="button"
                onClick={() => setShowDiagnosticModal(true)}
                className="w-full py-1.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                <span>Lihat Asesmen Konseli</span>
              </button>
            )}

            {/* PRIMARY BUTTON: Join Live Meeting */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all cursor-pointer border-b-[3px] border-b-emerald-800 group"
            >
              <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Masuk Video Konseling</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <p className="text-[10px] text-center text-slate-400 -mt-1.5">
              Tatap muka terenkripsi langsung di aplikasi Ruang BK
            </p>

            {/* Compact Credentials Box */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">ID Sesi</span>
                  <span className="font-bold text-slate-800">{session.meeting_number || session.zoom_meeting_id || '-'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">Pass</span>
                  <span className="font-bold text-slate-800">{session.meeting_password || 'bk1234'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyToClipboard(session.meeting_number || session.zoom_meeting_id, 'id')}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-sans text-slate-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Salin Meeting ID"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId ? 'Tersalin' : 'Salin ID'}</span>
                </button>
                {session.meeting_url && (
                  <a
                    href={session.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-[10px] font-sans text-blue-700 font-medium flex items-center gap-1 transition-colors"
                    title="Buka di Aplikasi Zoom Bawaan"
                  >
                    <ExternalLink className="w-3 h-3 text-blue-600" />
                    <span>App Zoom</span>
                  </a>
                )}
              </div>
            </div>

            {/* Confidentiality / Privacy assurance */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Sesi ini privat dan terjaga kerahasiaannya.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Counselee Diagnostic Modal */}
      {showDiagnosticModal && (
        <CounseleeDiagnosticModal
          isOpen={showDiagnosticModal}
          counseleeUser={session.user}
          caseItem={session.counseling_case}
          assessmentAnswers={session.counseling_case?.assessment_answers}
          onClose={() => setShowDiagnosticModal(false)}
        />
      )}
    </div>
  );
};

export default WaitingRoom;
