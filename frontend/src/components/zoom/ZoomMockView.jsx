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
  AlertCircle,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../common/Modal';
import CounseleeDiagnosticModal from '../counseling/CounseleeDiagnosticModal';

export const ZoomMockView = ({ sessionData, session = null, onLeaveSession, onSwitchToLiveSDK, isTutor = false }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [isVirtualCamera, setIsVirtualCamera] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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
  const isMountedRef = useRef(true);
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

  const animFrameIdRef = useRef(null);
  const processedSignalIdsRef = useRef(new Set());
  const signalingPollingRef = useRef(null);
  // Buffer for ICE candidates that arrive before remoteDescription is set
  const iceCandidateBufferRef = useRef([]);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // ignore
    }
  };

  // Broadcast WebRTC signaling both locally (inter-tab) and over local network (Laravel API relay)
  const broadcastSignal = async (signalData) => {
    // 1. Same-device inter-tab BroadcastChannel
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(signalData);
      } catch (e) {}
    }
    // 2. Cross-laptop network signaling relay
    try {
      await api.post('/zoom/signaling', {
        session_id: session?.id || sessionData?.meeting_number,
        type: signalData.type,
        sender: myPeerId.current,
        payload: signalData.payload || null,
        sdp: signalData.sdp || null,
        candidate: signalData.candidate || null,
      });
    } catch (e) {
      // Network signaling failed or offline
    }
  };

  // Virtual Camera: generates an animated canvas stream for devices where physical webcam is blocked by HTTP
  const startVirtualCamera = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let frame = 0;
      const render = () => {
        frame++;
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 640, 480);
        grad.addColorStop(0, '#022c22');
        grad.addColorStop(0.5, '#064e3b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 480);

        // Animated soft waves
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(320, 240, 140 + i * 35 + Math.sin((frame + i * 20) * 0.05) * 15, 0, Math.PI * 2);
          ctx.fill();
        }

        // Center Avatar Circle
        const bounce = Math.sin(frame * 0.06) * 4;
        ctx.save();
        ctx.translate(320, 200 + bounce);

        ctx.beginPath();
        ctx.arc(0, 0, 65, 0, Math.PI * 2);
        ctx.fillStyle = '#059669';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#34d399';
        ctx.stroke();

        // Initial letter
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sessionData?.user_name?.charAt(0) || 'P', 0, 0);
        ctx.restore();

        // User name
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sessionData?.user_name || 'Peserta', 320, 310);

        // Subtitle
        ctx.fillStyle = '#a7f3d0';
        ctx.font = '13px sans-serif';
        ctx.fillText(isTutor ? 'Konselor Bimbingan Konseling' : 'Mahasiswa / Klien', 320, 335);

        // Virtual Camera Badge
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('● LIVE STREAM (KAMERA VIRTUAL)', 320, 380);

        animFrameIdRef.current = requestAnimationFrame(render);
      };
      render();

      const vStream = canvas.captureStream(30);

      // Create dummy silent audio track so WebRTC has both video & audio
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          gain.gain.value = 0.0001;
          osc.connect(gain);
          const dest = audioCtx.createMediaStreamDestination();
          gain.connect(dest);
          osc.start();
          dest.stream.getAudioTracks().forEach((track) => vStream.addTrack(track));
        }
      } catch (e) {}

      streamRef.current = vStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = vStream;
        localVideoRef.current.play().catch(() => {});
      }

      setHasWebcam(true);
      setIsVideoOff(false);
      setIsVirtualCamera(true);
      setCameraError(null);

      // Attach tracks to WebRTC peer connection
      if (peerConnectionRef.current) {
        const pc = peerConnectionRef.current;
        vStream.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          const existingSender = senders.find((s) => s.track && s.track.kind === track.kind);
          if (!existingSender) {
            pc.addTrack(track, vStream);
          } else if (existingSender.replaceTrack) {
            existingSender.replaceTrack(track);
          }
        });
        broadcastSignal({ type: 'PEER_HELLO', sender: myPeerId.current });
      }
    } catch (err) {
      console.error('Failed to start virtual camera:', err);
    }
  };

  // Initialize and request user webcam/mic
  // Initialize and request user webcam/mic
  const startCamera = async () => {
    try {
      setCameraError(null);
      const isHttpNonLocal = typeof window !== 'undefined' && 
        window.location.protocol === 'http:' && 
        !['localhost', '127.0.0.1'].includes(window.location.hostname);

      if (!navigator?.mediaDevices?.getUserMedia) {
        if (isHttpNonLocal) {
          setCameraError('Browser memblokir kamera di jaringan HTTP (10.78.3.2). Kamera Virtual Simulasi diaktifkan.');
        } else {
          setCameraError('Peramban tidak mendukung akses kamera/mikrofon. Kamera Virtual Simulasi diaktifkan.');
        }
        startVirtualCamera();
        return false;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (firstErr) {
        console.warn('Initial media request failed, attempting mobile/simple fallback:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      }

      // Check if unmounted while getUserMedia prompt was pending
      if (!isMountedRef.current) {
        if (stream) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (e) {}
          });
        }
        return false;
      }

      if (typeof window !== 'undefined') {
        window.__bkActiveMediaStreams = window.__bkActiveMediaStreams || new Set();
        window.__bkActiveMediaStreams.add(stream);
      }

      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setHasWebcam(true);
      setIsVideoOff(false);
      setIsVirtualCamera(false);
      setCameraError(null);

      // Add tracks to active WebRTC connection if ready
      if (peerConnectionRef.current) {
        const pc = peerConnectionRef.current;
        stream.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          const alreadyAdded = senders.some((s) => s.track && s.track.kind === track.kind);
          if (!alreadyAdded) {
            pc.addTrack(track, stream);
          } else {
            const sender = senders.find((s) => s.track && s.track.kind === track.kind);
            if (sender && sender.replaceTrack) {
              sender.replaceTrack(track);
            }
          }
        });
        broadcastSignal({ type: 'PEER_HELLO', sender: myPeerId.current });
      }
      return true;
    } catch (err) {
      console.warn('Webcam stream unavailable or permission denied:', err);
      const isHttpNonLocal = typeof window !== 'undefined' && 
        window.location.protocol === 'http:' && 
        !['localhost', '127.0.0.1'].includes(window.location.hostname);

      if (isHttpNonLocal && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        setCameraError('Browser memblokir izin kamera via HTTP (10.78.3.2). Kamera Virtual Simulasi diaktifkan.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak di browser. Kamera Virtual Simulasi diaktifkan.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Perangkat kamera/webcam tidak ditemukan. Kamera Virtual Simulasi diaktifkan.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Kamera fisik sedang digunakan oleh aplikasi/tab lain. Kamera Virtual Simulasi diaktifkan.');
      } else {
        setCameraError('Kamera tidak dapat diakses (' + (err.message || err.name) + '). Kamera Virtual diaktifkan.');
      }
      startVirtualCamera();
      return false;
    }
  };

  useEffect(() => {
    // Reset ICE buffer on new session
    iceCandidateBufferRef.current = [];

    // 1. Setup WebRTC PeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    });
    peerConnectionRef.current = pc;

    // Log ICE connection state changes for debugging
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState, '| signaling:', pc.signalingState);
    };
    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] Signaling state changed:', pc.signalingState);
    };

    // Helper to ensure current local stream tracks are attached to pc
    const attachLocalTracks = () => {
      if (streamRef.current && pc.signalingState !== 'closed') {
        streamRef.current.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          if (!senders.some((s) => s.track && s.track.kind === track.kind)) {
            pc.addTrack(track, streamRef.current);
          }
        });
      }
    };

    // Drain the ICE candidate buffer once remoteDescription is set
    const drainIceCandidateBuffer = async () => {
      if (!pc.remoteDescription) return;
      const buf = iceCandidateBufferRef.current.splice(0);
      for (const candidate of buf) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC] Drained buffered ICE candidate');
        } catch (e) {
          console.warn('[WebRTC] Failed to drain ICE candidate:', e);
        }
      }
    };

    // 2. Start Camera (real or virtual fallback)
    startCamera();

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
        console.log('[WebRTC] Sending ICE candidate:', event.candidate.candidate.substring(0, 60));
        broadcastSignal({
          type: 'ICE_CANDIDATE',
          sender: myPeerId.current,
          candidate: event.candidate,
        });
      } else {
        console.log('[WebRTC] ICE gathering complete');
      }
    };

    const sendOffer = async () => {
      try {
        // Prevent re-offering if already negotiating
        if (pc.signalingState !== 'stable' && pc.signalingState !== 'closed') {
          console.log('[WebRTC] Skipping offer – not stable. State:', pc.signalingState);
          return;
        }
        if (pc.signalingState === 'closed') return;
        attachLocalTracks();
        console.log('[WebRTC] Creating offer...');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        broadcastSignal({
          type: 'OFFER',
          sender: myPeerId.current,
          sdp: pc.localDescription,
        });
        console.log('[WebRTC] Offer sent');
      } catch (e) {
        console.warn('[WebRTC] Offer creation error:', e);
      }
    };

    // Central incoming signal dispatcher (handles messages from either BroadcastChannel or Network Relay)
    const handleIncomingSignal = async (data) => {
      if (!data || data.sender === myPeerId.current) return;
      console.log('[WebRTC] Received signal:', data.type, 'from', data.sender);

      if (data.type === 'PEER_HELLO') {
        // *** FIX: Only tutor initiates offer. Student waits for offer. ***
        // This prevents both sides from simultaneously trying to create offers
        // which corrupts the WebRTC signaling state machine.
        if (isTutor && pc.signalingState === 'stable') {
          attachLocalTracks();
          await sendOffer();
        } else if (!isTutor) {
          // Student acknowledges and attaches tracks, ready to receive offer
          attachLocalTracks();
          console.log('[WebRTC] Student: ready, awaiting offer from tutor');
        }
      } else if (data.type === 'OFFER') {
        try {
          if (pc.signalingState === 'closed') return;
          // If we're also an offerer in a collision, student always rolls back
          if (pc.signalingState === 'have-local-offer') {
            if (!isTutor) {
              // Student rolls back its own offer to accept tutor's
              await pc.setLocalDescription({ type: 'rollback' });
            } else {
              // Tutor ignores student's duplicate offer attempt
              console.log('[WebRTC] Tutor ignoring incoming offer (glare), already offered');
              return;
            }
          }
          attachLocalTracks();
          console.log('[WebRTC] Setting remote description (offer)...');
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await drainIceCandidateBuffer();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          broadcastSignal({
            type: 'ANSWER',
            sender: myPeerId.current,
            sdp: pc.localDescription,
          });
          console.log('[WebRTC] Answer sent');
        } catch (e) {
          console.warn('[WebRTC] Offer handling error:', e);
        }
      } else if (data.type === 'ANSWER') {
        try {
          if (pc.signalingState === 'have-local-offer') {
            console.log('[WebRTC] Setting remote description (answer)...');
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await drainIceCandidateBuffer();
            console.log('[WebRTC] Answer applied, ICE buffer drained');
          } else {
            console.warn('[WebRTC] Received ANSWER in unexpected state:', pc.signalingState);
          }
        } catch (e) {
          console.warn('[WebRTC] Answer handling error:', e);
        }
      } else if (data.type === 'ICE_CANDIDATE') {
        try {
          if (!data.candidate) return;
          if (pc.remoteDescription) {
            // remoteDescription already set → apply immediately
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('[WebRTC] ICE candidate applied immediately');
          } else {
            // *** FIX: Buffer the candidate instead of dropping it ***
            iceCandidateBufferRef.current.push(data.candidate);
            console.log('[WebRTC] ICE candidate buffered (no remoteDesc yet). Buffer size:', iceCandidateBufferRef.current.length);
          }
        } catch (e) {
          console.warn('[WebRTC] ICE candidate error:', e);
        }
      } else if (data.type === 'CHAT_MSG') {
        setChatMessages((prev) => {
          if (prev.some((m) => m.time === data.payload?.time && m.text === data.payload?.text && m.sender === data.payload?.sender)) {
            return prev;
          }
          return [...prev, data.payload];
        });
      }
    };

    // 3. Inter-tab BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(channelName);
      broadcastChannelRef.current = channel;
      channel.onmessage = (event) => {
        handleIncomingSignal(event.data);
      };
    }

    // 4. Network Signaling Relay Poller (Connects Laptop 1 & Laptop 2 over WiFi / LAN)
    let lastSignalTime = 0;
    const pollNetworkSignals = async () => {
      try {
        const res = await api.get(`/zoom/signaling?session_id=${session?.id || sessionData?.meeting_number}&sender=${myPeerId.current}&after=${lastSignalTime}`);
        if (res && Array.isArray(res.signals)) {
          for (const sig of res.signals) {
            if (sig.sender !== myPeerId.current && !processedSignalIdsRef.current.has(sig.id)) {
              processedSignalIdsRef.current.add(sig.id);
              await handleIncomingSignal(sig);
            }
          }
          if (res.server_time) {
            lastSignalTime = res.server_time;
          }
        }
      } catch (e) {
        // Silent network error
      }
    };

    // Active polling every 800ms for fast P2P WebRTC handshake across laptops
    signalingPollingRef.current = setInterval(pollNetworkSignals, 800);
    pollNetworkSignals();

    // Clear stale signals from previous attempts, then announce arrival
    const sessionIdForSignal = session?.id || sessionData?.meeting_number;
    api.delete(`/zoom/signaling?session_id=${sessionIdForSignal}`).catch(() => {});
    // Announce arrival to room (with small delay so camera has time to initialize)
    setTimeout(() => {
      console.log('[WebRTC] Sending PEER_HELLO as', isTutor ? 'TUTOR' : 'STUDENT');
      broadcastSignal({ type: 'PEER_HELLO', sender: myPeerId.current });
    }, 1500);

    return () => {
      isMountedRef.current = false;
      if (signalingPollingRef.current) {
        clearInterval(signalingPollingRef.current);
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
        if (typeof window !== 'undefined' && window.__bkActiveMediaStreams) {
          window.__bkActiveMediaStreams.delete(streamRef.current);
        }
        streamRef.current = null;
      }
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        try {
          const s = localVideoRef.current.srcObject;
          if (s && s.getTracks) {
            s.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (e) {}
            });
          }
        } catch (e) {}
        localVideoRef.current.srcObject = null;
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [channelName, isTutor]);

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
    broadcastSignal({
      type: 'CHAT_MSG',
      sender: myPeerId.current,
      payload: newMsg,
    });
    setInputMsg('');
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] max-h-[850px] bg-slate-950 rounded-3xl overflow-hidden flex flex-col text-white shadow-2xl border border-slate-800 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Terhubung • {formatTime(seconds)}</span>
          </div>
          <span className="text-xs text-slate-300 font-bold truncate">
            {sessionData.session_title}
          </span>
          <span className="hidden sm:inline-block font-mono text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-700 shrink-0">
            #{session?.id || sessionData?.meeting_number}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          {/* Tombol Salin Link Sesi Video Konseling */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Salin tautan ruang video untuk dibuka langsung di laptop lain"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Link Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Salin Link Video Sesi #{session?.id || sessionData?.meeting_number}</span>
                <span className="md:hidden">Salin Link</span>
              </>
            )}
          </button>

          {isTutor && session?.user && (
            <button
              type="button"
              onClick={() => setShowDiagnosticModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-xs"
              title="Lihat Data Konseli & Asesmen Lengkap"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-200" />
              <span className="hidden sm:inline">Data Konseli</span>
            </button>
          )}
          {onSwitchToLiveSDK && (
            <button
              type="button"
              onClick={onSwitchToLiveSDK}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-xs cursor-pointer"
              title="Beralih ke Live Zoom Meeting SDK Resmi"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ke Live Zoom SDK</span>
            </button>
          )}
          <span className="hidden lg:inline-block bg-slate-800 text-slate-300 px-3 py-1 rounded-xl text-[11px] font-mono border border-slate-700">
            WebRTC Relay
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
          {/* Real Device Webcam or Virtual Video Feed */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
              !isVideoOff && hasWebcam ? 'block' : 'hidden'
            }`}
          />

          {/* Badge when Virtual Camera is Active */}
          {!isVideoOff && hasWebcam && isVirtualCamera && (
            <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-amber-500/20 backdrop-blur-md text-[11px] font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1.5 z-10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Kamera Virtual (HTTP)</span>
            </div>
          )}

          {/* Notification banner if on HTTP when Virtual Camera is active */}
          {!isVideoOff && hasWebcam && isVirtualCamera && typeof window !== 'undefined' && window.location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(window.location.hostname) && (
            <div className="absolute top-3 left-3 right-3 max-w-sm mx-auto p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 text-slate-200 z-10 text-[11px] shadow-lg flex items-center justify-center gap-2">
              <span className="text-emerald-300 flex items-center gap-1.5 text-[10.5px]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Kamera Virtual Simulasi Aktif & Terhubung ke Lawan Bicara</span>
              </span>
            </div>
          )}

          {/* Fallback avatar when camera is off or not accessible */}
          {(isVideoOff || !hasWebcam) && (
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 text-slate-400 flex items-center justify-center text-2xl font-bold mb-2 shadow-md">
                {sessionData.user_name?.charAt(0) || 'Y'}
              </div>
              <p className="text-xs font-bold text-slate-300">
                {cameraError || (isVideoOff ? 'Kamera Dinonaktifkan' : 'Kamera Tidak Terdeteksi')}
              </p>

              {/* Guide for HTTP / Chrome Security Policy */}
              {typeof window !== 'undefined' && window.location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(window.location.hostname) && (
                <div className="mt-3 text-[11px] text-amber-300 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-left space-y-2 max-w-xs">
                  <p className="font-semibold flex items-center gap-1 text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Kebijakan Browser Chrome (Akses HTTP):
                  </p>
                  <p className="text-amber-200/90 leading-relaxed text-[10px]">
                    Chrome otomatis mengunci setting kamera pada IP lokal HTTP (<code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">10.78.3.2</code>).
                  </p>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={startVirtualCamera}
                      className="w-full text-[11px] font-bold text-emerald-300 bg-emerald-600/30 hover:bg-emerald-600/50 p-2 rounded-xl border border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5 shadow-soft-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Aktifkan Kamera Virtual Simulasi</span>
                    </button>
                  </div>
                  <details className="text-[10px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-700/50 cursor-pointer">
                    <summary className="font-semibold text-amber-300">Cara Buka Izin Kamera Fisik di Chrome</summary>
                    <ol className="list-decimal pl-4 mt-1 space-y-1 text-slate-300 text-[10px]">
                      <li>Buka tab baru: <code className="bg-black/50 px-1 py-0.5 rounded text-amber-200 font-mono">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></li>
                      <li>Masukkan: <code className="bg-black/50 px-1 py-0.5 rounded text-amber-200 font-mono">http://10.78.3.2:5173</code></li>
                      <li>Ubah ke <b>Enabled</b> lalu klik <b>Relaunch</b>.</li>
                    </ol>
                  </details>
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

              <button
                type="button"
                onClick={startCamera}
                className="mt-3 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-soft-xs"
              >
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Coba Nyalakan Kamera Fisik</span>
              </button>
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
