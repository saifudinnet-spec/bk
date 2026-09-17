import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Share2,
  Users,
  Shield,
  Send,
  X,
  Sparkles,
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import Modal from '../common/Modal';
import CounseleeDiagnosticModal from '../counseling/CounseleeDiagnosticModal';

export const ZoomMockView = ({ sessionData, session = null, onLeaveSession, isTutor = false }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'Sistem BK',
      text: 'Selamat datang di ruang konseling daring.',
      time: 'Baru saja',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const streamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const myPeerId = useRef('peer_' + Math.random().toString(36).slice(2, 9) + '_' + (isTutor ? 'tutor' : 'student'));

  const channelName = 'bk_meeting_' + (session?.id || sessionData?.meeting_number || 'default');

  // Automatically attach remoteStream to remote video element when available
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Initialize and request user webcam/mic
  const startCamera = async () => {
    try {
      setCameraError(null);
      const isHttpNonLocal = typeof window !== 'undefined' && 
        window.location.protocol === 'http:' && 
        !['localhost', '127.0.0.1'].includes(window.location.hostname);

      if (!navigator?.mediaDevices?.getUserMedia) {
        if (isHttpNonLocal) {
          setCameraError('Browser HP memblokir kamera di jaringan HTTP. Diperlukan HTTPS atau izin Chrome Flags.');
        } else {
          setCameraError('Peramban tidak mendukung akses kamera/mikrofon.');
        }
        setIsVideoOff(true);
        setHasWebcam(false);
        return;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (firstErr) {
        console.warn('Initial media request failed, attempting mobile video fallback:', firstErr);
        // Fallback for mobile devices if high resolution or audio combined constraint fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      }

      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setHasWebcam(true);
      setIsVideoOff(false);

      // Add tracks to active WebRTC connection if ready
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          const senders = peerConnectionRef.current.getSenders();
          const alreadyAdded = senders.some((s) => s.track && s.track.kind === track.kind);
          if (!alreadyAdded) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        });
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({ type: 'PEER_HELLO', sender: myPeerId.current });
        }
      }
    } catch (err) {
      console.warn('Webcam stream unavailable or permission denied:', err);
      const isHttpNonLocal = typeof window !== 'undefined' && 
        window.location.protocol === 'http:' && 
        !['localhost', '127.0.0.1'].includes(window.location.hostname);

      if (isHttpNonLocal && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        setCameraError('Browser HP memblokir izin kamera via HTTP (bukan HTTPS).');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak di browser HP Anda.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Perangkat kamera/webcam tidak ditemukan.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Kamera fisik sedang digunakan oleh tab atau aplikasi lain.');
      } else {
        setCameraError('Kamera tidak dapat diakses (' + (err.message || err.name) + ')');
      }
      setIsVideoOff(true);
      setHasWebcam(false);
    }
  };

  useEffect(() => {
    startCamera();

    // Setup WebRTC Inter-Tab Video Bridge (same device / multi-tab / local network)
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(channelName);
      broadcastChannelRef.current = channel;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      });
      peerConnectionRef.current = pc;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, streamRef.current);
        });
      }

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const s = event.streams[0];
          setRemoteStream(s);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = s;
            remoteVideoRef.current.play().catch(() => {});
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.postMessage({
            type: 'ICE_CANDIDATE',
            sender: myPeerId.current,
            candidate: event.candidate,
          });
        }
      };

      const sendOffer = async () => {
        try {
          if (pc.signalingState !== 'closed') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.postMessage({
              type: 'OFFER',
              sender: myPeerId.current,
              sdp: pc.localDescription,
            });
          }
        } catch (e) {
          console.warn('WebRTC offer creation error:', e);
        }
      };

      channel.onmessage = async (event) => {
        const data = event.data;
        if (!data || data.sender === myPeerId.current) return;

        if (data.type === 'PEER_HELLO') {
          await sendOffer();
        } else if (data.type === 'OFFER') {
          try {
            if (pc.signalingState !== 'closed') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              channel.postMessage({
                type: 'ANSWER',
                sender: myPeerId.current,
                sdp: pc.localDescription,
              });
            }
          } catch (e) {
            console.warn('WebRTC offer handling error:', e);
          }
        } else if (data.type === 'ANSWER') {
          try {
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            }
          } catch (e) {
            console.warn('WebRTC answer handling error:', e);
          }
        } else if (data.type === 'ICE_CANDIDATE') {
          try {
            if (data.candidate && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (e) {
            console.warn('WebRTC ICE candidate error:', e);
          }
        } else if (data.type === 'CHAT_MSG') {
          setChatMessages((prev) => [...prev, data.payload]);
        }
      };

      // Announce arrival to existing peers in room
      channel.postMessage({ type: 'PEER_HELLO', sender: myPeerId.current });
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [channelName]);

  const handleToggleVideo = async () => {
    if (isVideoOff) {
      if (streamRef.current && streamRef.current.getVideoTracks().length > 0) {
        streamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = true;
        });
        setIsVideoOff(false);
      } else {
        await startCamera();
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => {
          track.stop(); // Stop hardware track so another tab can use it
        });
      }
      setHasWebcam(false);
      setIsVideoOff(true);
    }
  };

  const handleToggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
  };

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg = {
      sender: isTutor ? sessionData.tutor_name : sessionData.student_name,
      text: inputMsg.trim(),
      time: timeStr,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'CHAT_MSG',
        sender: myPeerId.current,
        payload: newMsg,
      });
    }
    setInputMsg('');
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] max-h-[850px] bg-slate-950 rounded-3xl overflow-hidden flex flex-col text-white shadow-2xl border border-slate-800 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Terhubung • {formatTime(seconds)}</span>
          </div>
          <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
            {sessionData.session_title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isTutor && session?.user && (
            <button
              type="button"
              onClick={() => setShowDiagnosticModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-xs"
              title="Lihat Data Konseli & Asesmen Lengkap"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-200" />
              <span>Data Konseli</span>
            </button>
          )}
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-xl text-[11px] font-mono border border-slate-700">
            Mode SDK: Development (Simulator WebRTC)
          </span>
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="relative flex-1 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden bg-slate-900">
        {/* Remote Participant (Tutor or Student) */}
        {(() => {
          const remoteName = isTutor ? sessionData.student_name : sessionData.tutor_name;
          const remotePhoto = !isTutor
            ? (session?.tutor?.tutor_profile?.photo || session?.tutor?.avatar || '/images/counselor_ahmad.jpg')
            : (session?.user?.avatar || null);

          return (
            <div className="relative flex items-center justify-center bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden shadow-inner w-full h-full min-h-[300px]">
              {/* Remote Real Video Stream from WebRTC */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  remoteStream ? 'block' : 'hidden'
                }`}
              />

              {/* Fallback avatar card when remote camera stream is not yet active */}
              {!remoteStream && (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  {remotePhoto ? (
                    <div className="relative mb-3">
                      <img
                        src={remotePhoto}
                        alt={remoteName}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-xl border-2 border-emerald-400/50"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                    </div>
                  ) : (
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-3xl font-black shadow-xl mb-3 border-2 border-emerald-400/40"
                    >
                      {remoteName?.charAt(0) || 'P'}
                    </motion.div>
                  )}

                  <h3 className="text-sm sm:text-base font-bold text-slate-100">
                    {remoteName}
                  </h3>
                  <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                    {isTutor ? 'Klien Konseling' : 'Konselor Bimbingan Konseling'}
                  </p>

                  {/* Audio Waveform Indicator */}
                  <div className="flex items-center gap-1 mt-4">
                    {[40, 75, 55, 90, 60, 45, 80, 50].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [`${h * 0.3}px`, `${h * 0.7}px`, `${h * 0.3}px`] }}
                        transition={{ repeat: Infinity, duration: 0.8 + (i % 3) * 0.2, ease: 'easeInOut' }}
                        className="w-1 bg-emerald-500 rounded-full"
                      />
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3 max-w-[240px]">
                    Menghubungkan video inter-tab WebRTC...
                  </p>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-slate-200 border border-slate-800 flex items-center gap-2 z-10">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{remoteName}</span>
                {remoteStream && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE VIDEO
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Local Self Video (Real Webcam Support) */}
        <div className="relative flex items-center justify-center bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden shadow-inner w-full h-full min-h-[300px]">
          {/* Real Device Webcam Video Feed */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
              !isVideoOff && hasWebcam ? 'block' : 'hidden'
            }`}
          />

          {/* Fallback avatar when camera is off or not accessible */}
          {(isVideoOff || !hasWebcam) && (
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 text-slate-400 flex items-center justify-center text-2xl font-bold mb-2 shadow-md">
                {sessionData.user_name?.charAt(0) || 'Y'}
              </div>
              <p className="text-xs font-bold text-slate-300">
                {cameraError || (isVideoOff ? 'Kamera Dinonaktifkan' : 'Kamera Tidak Terdeteksi')}
              </p>

              {/* Guide for Mobile / HTTP security */}
              {cameraError && typeof window !== 'undefined' && window.location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(window.location.hostname) && (
                <div className="mt-3 text-[11px] text-amber-300 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-left space-y-1 max-w-xs">
                  <p className="font-semibold flex items-center gap-1 text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Kebijakan Browser HP (HTTP):
                  </p>
                  <p className="text-amber-200/90 leading-relaxed text-[10px]">
                    Chrome/Safari HP memblokir kamera di jaringan WiFi via HTTP. Buka <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">chrome://flags</code> di HP dan aktifkan <em>"Insecure origins treated as secure"</em> untuk IP ini.
                  </p>
                </div>
              )}

              {cameraError && cameraError.includes('tab atau aplikasi lain') && (
                <div className="mt-3 text-[11px] text-amber-300 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-left space-y-1">
                  <p className="font-semibold flex items-center gap-1 text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Info Kamera (1 Laptop):
                  </p>
                  <p className="text-amber-200/90 leading-relaxed text-[11px]">
                    Webcam fisik laptop sedang aktif di Tab Klien. Pada 1 laptop, webcam tidak bisa dipakai oleh 2 tab secara bersamaan.
                  </p>
                  <p className="text-emerald-400 font-medium text-[10px] pt-1">
                    ✓ Video Klien tetap tampil live di layar kiri via WebRTC.
                  </p>
                </div>
              )}

              {cameraError && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-3 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 transition-colors inline-flex items-center gap-1.5 shadow-soft-xs"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Coba Nyalakan Kamera</span>
                </button>
              )}
            </div>
          )}

          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-slate-200 border border-slate-800 flex items-center gap-2 z-10">
            <span>{sessionData.user_name} (Anda)</span>
            {isMuted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
          </div>
        </div>

        {/* Chat Drawer Side Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-20 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Obrolan Sesi</span>
                </h4>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.sender === (isTutor ? sessionData.tutor_name : sessionData.student_name)
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5">
                      {msg.sender} • {msg.time}
                    </span>
                    <div
                      className={`p-2.5 rounded-2xl max-w-[85%] ${
                        msg.sender === (isTutor ? sessionData.tutor_name : sessionData.student_name)
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik pesan di ruang rapat..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 bg-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Meeting Controls */}
      <div className="px-4 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-4 z-10">
        {/* Mic toggle */}
        <button
          onClick={handleToggleAudio}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
            isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={isMuted ? 'Nyalakan Mikrofon' : 'Matikan Mikrofon'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video camera toggle */}
        <button
          onClick={handleToggleVideo}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
            isVideoOff ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={isVideoOff ? 'Nyalakan Kamera' : 'Matikan Kamera'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen share toggle */}
        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`hidden sm:flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
            isScreenSharing ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Bagi Layar"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Chat Drawer toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
          title="Buka Obrolan"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        {/* End Call Button */}
        <button
          onClick={() => setShowEndModal(true)}
          className="flex items-center justify-center gap-2 px-5 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition-colors"
          title="Akhiri Sesi"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline">Akhiri Sesi</span>
        </button>
      </div>

      {/* End Call Confirmation Modal */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="Akhiri Sesi Konseling?"
      >
        <p className="text-xs text-mutedtext mb-5 leading-relaxed">
          {isTutor
            ? 'Anda akan diarahkan ke formulir ringkasan sesi konseling dan catatan tindak lanjut untuk mahasiswa.'
            : 'Apakah Anda yakin ingin menyelesaikan sesi video konseling ini?'}
        </p>

        <div className="flex gap-2.5 justify-end">
          <button
            onClick={() => setShowEndModal(false)}
            className="px-4 py-2.5 rounded-xl border border-softborder text-xs font-semibold text-darktext hover:bg-gray-50 transition-colors"
          >
            Kembali ke Sesi
          </button>
          <button
            onClick={() => {
              setShowEndModal(false);
              onLeaveSession();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft-sm transition-colors"
          >
            Ya, Selesaikan Sesi
          </button>
        </div>
      </Modal>

      {/* Counselee Diagnostic Modal */}
      {showDiagnosticModal && session?.user && (
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

export default ZoomMockView;
