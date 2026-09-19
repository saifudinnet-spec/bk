import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  PhoneOff,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Copy,
  Check,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Info,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Modal from '../common/Modal';
import CounseleeDiagnosticModal from '../counseling/CounseleeDiagnosticModal';

export const ZoomSDKView = ({
  sessionData,
  session = null,
  onLeaveSession,
  isTutor = false
}) => {
  const [showEndModal, setShowEndModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(true);
  const [participantCount, setParticipantCount] = useState(2);

  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // Fullscreen state listener
  useEffect(() => {
    const handleFsChange = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Broadcast resize to embedded Zoom iframe whenever fullscreen state changes
  useEffect(() => {
    const notifyResize = () => {
      window.dispatchEvent(new Event('resize'));
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.dispatchEvent(new Event('resize'));
        iframeRef.current.contentWindow.postMessage({ type: 'FULLSCREEN_CHANGE', isFullscreen }, '*');
      }
    };

    notifyResize();
    const t1 = setTimeout(notifyResize, 100);
    const t2 = setTimeout(notifyResize, 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } catch (e) {}
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      } catch (e) {}
    }
  };

  // Timer for session duration
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Safe extract session properties
  const data = sessionData?.data || sessionData || {};
  const meetingNumber = data.meeting_number || session?.meeting_number || '';
  const password = data.password || session?.meeting_password || '';
  const signature = data.signature || '';
  const sdkKey = data.sdk_key || '';
  const userName = data.user_name || (isTutor ? 'Tutor BK' : 'Mahasiswa');
  const userEmail = data.user_email || '';
  const directJoinUrl = data.direct_join_url || session?.meeting_url || '';
  const title = data.session_title || session?.counseling_case?.category || 'Sesi Video Konseling';
  const studentName = data.student_name || session?.user?.name || 'Mahasiswa';
  const tutorName = data.tutor_name || session?.tutor?.name || 'Tutor BK';

  // Construct iframe URL with query params
  const iframeSrc = `/zoom-embedded.html?mn=${encodeURIComponent(meetingNumber)}&pwd=${encodeURIComponent(password)}&name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}&sdkKey=${encodeURIComponent(sdkKey)}&signature=${encodeURIComponent(signature)}&url=${encodeURIComponent(directJoinUrl)}`;

  // Handle postMessage communication with embedded Zoom SDK
  useEffect(() => {
    const handleMessage = (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'ZOOM_EMBED_READY') {
        // Send initial config if iframe requested it
        iframeRef.current?.contentWindow?.postMessage({
          type: 'START_ZOOM',
          config: {
            meetingNumber,
            password,
            userName,
            userEmail,
            sdkKey,
            signature,
            directJoinUrl
          }
        }, '*');
      } else if (msg.type === 'ZOOM_JOIN_SUCCESS') {
        setIsConnected(true);
      } else if (msg.type === 'AUDIO_STATE_CHANGED') {
        setIsAudioMuted(Boolean(msg.isMuted));
      } else if (msg.type === 'VIDEO_STATE_CHANGED') {
        setIsVideoActive(Boolean(msg.isVideoOn));
      } else if (msg.type === 'ZOOM_USER_ADDED') {
        setRemoteUserJoined(true);
        setParticipantCount((prev) => Math.max(2, prev + 1));
      } else if (msg.type === 'ZOOM_USER_REMOVED') {
        setParticipantCount((prev) => Math.max(1, prev - 1));
      } else if (msg.type === 'ZOOM_MEETING_LEAVE') {
        onLeaveSession();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [meetingNumber, password, userName, userEmail, sdkKey, signature, directJoinUrl, onLeaveSession]);

  const handleToggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    iframeRef.current?.contentWindow?.postMessage({
      type: 'TOGGLE_MUTE',
      isMuted: nextMuted
    }, '*');
  };

  const handleToggleVideo = () => {
    const nextVideo = !isVideoActive;
    setIsVideoActive(nextVideo);
    iframeRef.current?.contentWindow?.postMessage({
      type: 'TOGGLE_VIDEO',
      isVideoOn: nextVideo
    }, '*');
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2500);
      } else {
        setCopiedPwd(true);
        setTimeout(() => setCopiedPwd(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div 
      ref={containerRef}
      data-zoom-fullscreen={isFullscreen ? 'true' : 'false'}
      className={`flex flex-col w-full h-full min-h-0 ${
        isFullscreen 
          ? 'fixed inset-0 z-[99999] bg-[#020617] p-1 sm:p-1.5 space-y-1' 
          : 'flex-1 space-y-2'
      }`}
    >
      {/* Sleek, Minimalist Top Header Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white rounded-xl px-3 sm:px-4 py-2 shadow-sm flex items-center justify-between gap-2 shrink-0">
        {/* Left Info: Live status + Title + Timer */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ZOOM LIVE
          </span>

          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100 truncate max-w-[150px] sm:max-w-xs md:max-w-md" title={title}>
              {title}
            </h2>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 shrink-0">
              <Clock className="w-3 h-3 text-blue-400" />
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        {/* Center / Right: Compact Credentials + Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Compact ID & Passcode Pill */}
          {meetingNumber && (
            <div className="hidden md:flex items-center bg-slate-800/80 border border-slate-700/70 rounded-lg text-[11px] text-slate-300 divide-x divide-slate-700/60 font-mono">
              <button
                onClick={() => handleCopy(meetingNumber, 'id')}
                className="px-2.5 py-1 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Salin Meeting ID"
              >
                <span className="text-slate-400 font-sans text-[10px]">ID</span>
                <span className="font-semibold text-white">{meetingNumber}</span>
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>

              {password && (
                <button
                  onClick={() => handleCopy(password, 'pwd')}
                  className="px-2.5 py-1 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  title="Salin Passcode"
                >
                  <span className="text-slate-400 font-sans text-[10px]">Pass</span>
                  <span className="font-semibold text-white">{password}</span>
                  {copiedPwd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              )}
            </div>
          )}

          {/* Tutor Diagnostic Tool */}
          {isTutor && (
            <button
              onClick={() => setShowDiagnosticModal(true)}
              className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Diagnostik Koneksi Konseli"
            >
              <Stethoscope className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden xl:inline">Diagnostik</span>
            </button>
          )}

          {/* Direct Join Link fallback (App Zoom) */}
          {directJoinUrl && (
            <a
              href={directJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors flex items-center gap-1"
              title="Buka langsung di aplikasi Zoom Desktop / Mobile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">App Zoom</span>
            </a>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/70 text-xs transition-colors cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={() => setShowEndModal(true)}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Video Container: Embedded Zoom SDK Iframe */}
      <div className={`relative w-full flex-1 min-h-0 bg-slate-950 overflow-hidden border border-slate-800/80 shadow-xl flex flex-col ${isFullscreen ? 'rounded-lg' : 'rounded-xl'}`}>
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Zoom Meeting SDK"
          allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-write; screen-wake-lock"
          className="w-full h-full border-0 block"
        />

        {/* Modern Floating Video Control Dock */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2.5 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 px-3 sm:px-4 py-2 rounded-full shadow-2xl transition-all pointer-events-auto select-none">
          {/* Mute/Unmute Mic Button */}
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isAudioMuted
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60'
            }`}
            title={isAudioMuted ? 'Nyalakan Mikrofon' : 'Bisukan Mikrofon'}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span>{isAudioMuted ? 'Bisu' : 'Mic Aktif'}</span>
          </button>

          {/* Start/Stop Camera Button */}
          <button
            onClick={handleToggleVideo}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              !isVideoActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60'
            }`}
            title={isVideoActive ? 'Hentikan Kamera Video' : 'Mulai Kamera Video'}
          >
            {!isVideoActive ? <VideoOff className="w-4 h-4 text-white" /> : <Video className="w-4 h-4 text-sky-400" />}
            <span>{!isVideoActive ? 'Kamera Mati' : 'Kamera Aktif'}</span>
          </button>

          <div className="hidden sm:block w-px h-5 bg-slate-700/60 mx-0.5" />

          {/* Participants Badge */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] font-medium text-slate-300"
            title={`${participantCount} orang terhubung di sesi konseling`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono font-semibold">{participantCount}</span>
            <span className="hidden md:inline">Peserta</span>
          </div>

          {/* Direct Link to App Zoom */}
          {directJoinUrl && (
            <a
              href={directJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-medium transition-colors"
              title="Buka langsung di aplikasi Zoom Desktop / Mobile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">App Zoom</span>
            </a>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 sm:py-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden lg:inline">{isFullscreen ? 'Keluar' : 'Penuh'}</span>
          </button>

          <div className="w-px h-5 bg-slate-700/60 mx-0.5" />

          {/* Leave Meeting Button */}
          <button
            onClick={() => setShowEndModal(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
            title="Selesaikan & Tinggalkan Sesi"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Diagnostic Modal for Tutor */}
      {isTutor && (
        <CounseleeDiagnosticModal
          isOpen={showDiagnosticModal}
          onClose={() => setShowDiagnosticModal(false)}
          session={session}
        />
      )}

      {/* End Session Confirmation Modal */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="Tinggalkan Ruang Konseling?"
        maxWidth="max-w-md"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {isTutor
              ? 'Apakah Anda ingin mengakhiri sesi ini? Anda akan diarahkan ke halaman pengisian ringkasan sesi & catatan konseling.'
              : 'Apakah Anda yakin ingin keluar dari ruang video konseling ini?'}
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setShowEndModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Tetap di Sesi
            </button>
            <button
              onClick={() => {
                setShowEndModal(false);
                onLeaveSession();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-soft-xs transition-colors"
            >
              Ya, Selesaikan Sesi
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ZoomSDKView;
