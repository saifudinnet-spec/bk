import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  HeartHandshake,
  Smile,
  CheckCircle2,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  HelpCircle,
  Lightbulb,
  Square,
  Play
} from 'lucide-react';

/**
 * Play a gentle, cheerful synthesized chime using Web Audio API
 * (Clippy / Office Assistant sound feel, zero external audio assets)
 */
const playAssistantChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Arpeggio note: C5 -> E5 -> G5
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  } catch (e) {
    // AudioContext blocked or not supported, ignore silently
  }
};

/**
 * Nara Speech Synthesis Engine
 * Menghasilkan narasi suara perempuan Indonesia yang halus, ramah, dan santai.
 */
export const speakNaraVoice = (text, { onStart, onEnd, onError } = {}) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip emojis and formatting characters so TTS pronounces naturally
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*_~`#💡❓✨🎉]/g, '')
    .trim();

  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'id-ID';

  // Tuned for natural, gentle, feminine warmth in Indonesian
  utterance.pitch = 1.08; // Sedikit lebih tinggi untuk kelembutan suara perempuan
  utterance.rate = 0.95;  // Tempo tenang, ramah, dan mudah dipahami
  utterance.volume = 1.0;

  // Voice lookup with Indonesian female priority
  const setBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // 1. Indonesian female neural voice (Windows / Edge: Gadis, Siti)
    const indonesianFemale = voices.find(
      (v) =>
        (v.lang === 'id-ID' || v.lang.toLowerCase().startsWith('id')) &&
        (v.name.toLowerCase().includes('gadis') ||
          v.name.toLowerCase().includes('siti') ||
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('wanita') ||
          v.name.toLowerCase().includes('natural'))
    );

    // 2. Google Bahasa Indonesia in Chrome
    const googleId = voices.find(
      (v) =>
        (v.lang === 'id-ID' || v.lang.toLowerCase().startsWith('id')) &&
        v.name.toLowerCase().includes('google')
    );

    // 3. Any Indonesian voice
    const anyId = voices.find(
      (v) =>
        v.lang === 'id-ID' ||
        v.lang.toLowerCase().startsWith('id') ||
        v.lang.toLowerCase().startsWith('in')
    );

    // 4. Fallback: Any gentle female voice
    const fallbackFemale = voices.find(
      (v) =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('zira')
    );

    utterance.voice = indonesianFemale || googleId || anyId || fallbackFemale || null;
  };

  setBestVoice();

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    if (onEnd) onEnd();
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
  return true;
};

/**
 * Stop any active Nara speech
 */
export const stopNaraVoice = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Nara – 3D Interactive Virtual Assistant (Clippy-Style)
 * With Indonesian Female Voice (Speech Synthesis) & 3D Interactive Avatar
 */
export const VirtualGuide = ({
  mode = 'sidebar', // 'sidebar' | 'floating' | 'assistant' | 'avatar' | 'compact'
  expression = 'neutral', // 'neutral' | 'listening' | 'encouraging' | 'positive'
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  speechText = '',
  stepTitle = 'Panduan Asesmen',
  onTipClick = null,
  onWhyClick = null,
  tipsAvailable = false,
  whyAvailable = false,
  isMinimized = false,
  onToggleMinimize = null,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isPoked, setIsPoked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pokeMessage, setPokeMessage] = useState(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  
  // Persisted auto-voice preference
  const [autoVoice, setAutoVoice] = useState(() => {
    try {
      return localStorage.getItem('bk_nara_autovoice') === 'true';
    } catch {
      return false;
    }
  });

  const characterRef = useRef(null);

  // Status labels & icons
  const statusLabels = {
    neutral: 'Siap Memandu',
    listening: 'Mencatat Jawaban...',
    encouraging: 'Mendampingi Anda',
    positive: 'Asesmen Selesai! 🎉',
  };

  const statusIcons = {
    neutral: Sparkles,
    listening: Smile,
    encouraging: HeartHandshake,
    positive: CheckCircle2,
  };

  // High-Resolution 3D Clean Cutout Sprites
  const poseImages = {
    neutral: '/images/guidance/nara_intro_cutout_clean.png',
    listening: '/images/guidance/nara_listening_cutout_clean.png',
    encouraging: '/images/guidance/nara_listening_cutout_clean.png',
    positive: '/images/guidance/nara_positive_cutout_clean.png',
  };

  const activeImageSrc = poseImages[expression] || poseImages.neutral;
  const StatusIcon = statusIcons[expression] || Sparkles;

  // Initialize browser voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        window.speechSynthesis.getVoices();
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      stopNaraVoice();
    };
  }, []);

  // 3D Mouse Tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Speak handler
  const handleSpeak = useCallback((customText = null) => {
    if (!soundEnabled) return;

    if (isSpeaking) {
      stopNaraVoice();
      setIsSpeaking(false);
      return;
    }

    const targetText = customText || pokeMessage || speechText;
    if (!targetText) return;

    speakNaraVoice(targetText, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [soundEnabled, isSpeaking, pokeMessage, speechText]);

  // Auto-speak on step / speechText change if autoVoice is enabled
  useEffect(() => {
    if (autoVoice && soundEnabled && speechText && !isMinimized && !pokeMessage) {
      const timer = setTimeout(() => {
        handleSpeak(speechText);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [speechText, autoVoice, soundEnabled, isMinimized]);

  // Interactive Poke / Click Response
  const handlePoke = () => {
    setIsPoked(true);
    if (soundEnabled) {
      playAssistantChime();
    }

    const playfulMessages = [
      'Halo! Nara siap bantu jika ada pertanyaan yang membingungkan.',
      'Jawab dengan santai ya, ceritamu aman dan privat bersama konselor.',
      'Kamu hebat sudah mengambil langkah pertama untuk konseling!',
      'Butuh panduan lebih dalam? Klik tombol Tips di atas ya.',
    ];
    const randomMsg = playfulMessages[Math.floor(Math.random() * playfulMessages.length)];
    setPokeMessage(randomMsg);

    // Speak poke message with gentle Indonesian female voice
    if (soundEnabled) {
      setTimeout(() => {
        handleSpeak(randomMsg);
      }, 150);
    }

    // Reset poke bounce after animation finishes
    setTimeout(() => {
      setIsPoked(false);
    }, 600);

    // Reset temporary poke message after 6 seconds
    setTimeout(() => {
      setPokeMessage(null);
    }, 6000);
  };

  // Avatar / Compact Mode
  if (mode === 'avatar' || mode === 'compact') {
    const avatarSizes = {
      sm: 'w-10 h-10',
      md: 'w-12 h-12 sm:w-14 sm:h-14',
      lg: 'w-16 h-16 sm:w-20 sm:h-20',
    };

    return (
      <div className={`relative shrink-0 ${className}`}>
        <motion.div
          animate={{ y: [0, -3, 0], scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
          className={`${avatarSizes[size] || avatarSizes.md} rounded-full ring-2 ring-emerald-500/40 p-0.5 bg-gradient-to-br from-emerald-100 to-teal-50 shadow-soft-sm overflow-hidden transition-transform duration-300 hover:scale-105`}
        >
          {!imageError ? (
            <img
              src="/images/guidance/nara_avatar.jpg"
              alt="Nara - Asisten Virtual"
              className="w-full h-full object-cover rounded-full"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-emerald-700 flex items-center justify-center text-white font-black text-sm">
              NR
            </div>
          )}
        </motion.div>
        {/* Active Status Dot */}
        <span
          className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-2xs"
          title="Nara aktif memandu"
        />
      </div>
    );
  }

  // Minimized Floating Badge Mode
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-soft-xl border border-emerald-200/90 cursor-pointer hover:scale-105 transition-all ${className}`}
        onClick={onToggleMinimize}
        title="Buka panduan asisten Nara"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-emerald-500 shrink-0">
          <img
            src="/images/guidance/nara_avatar.jpg"
            alt="Nara"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left pr-1">
          <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
            <span>Nara</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Buka panduan</div>
        </div>
        <Maximize2 className="w-3.5 h-3.5 text-emerald-700 ml-1" />
      </motion.div>
    );
  }

  // Determine character image height based on size
  const characterHeights = {
    sm: 'h-24 sm:h-28',
    md: 'h-32 sm:h-36 md:h-40',
    lg: 'h-44 sm:h-48',
  };
  const activeHeight = characterHeights[size] || characterHeights.md;

  // Pure 3D Character Standalone Figure
  const render3DCharacter = () => (
    <div
      ref={characterRef}
      className="relative flex flex-col items-center select-none group"
      style={{ perspective: 1000 }}
    >
      {/* Floating Star / Sparkle particles during poke */}
      <AnimatePresence>
        {isPoked && (
          <>
            <motion.div
              initial={{ opacity: 1, y: 0, x: -15, scale: 0.5 }}
              animate={{ opacity: 0, y: -45, x: -28, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute top-4 left-4 text-amber-400 text-lg pointer-events-none z-30"
            >
              ⭐
            </motion.div>
            <motion.div
              initial={{ opacity: 1, y: 0, x: 15, scale: 0.5 }}
              animate={{ opacity: 0, y: -50, x: 28, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, delay: 0.05 }}
              className="absolute top-2 right-4 text-emerald-400 text-base pointer-events-none z-30"
            >
              ✨
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3D Animated Cutout Character */}
      <motion.div
        onClick={handlePoke}
        animate={{
          // Levitation & breathing rhythm (subtle speaking bounce when speaking)
          y: isPoked ? [0, -20, 0] : isSpeaking ? [0, -10, 0, -5, 0] : [0, -8, 0],
          scale: isPoked ? [1, 1.05, 1] : isSpeaking ? [1, 1.025, 1] : [1, 1.015, 1],
          // 3D perspective mouse tracking
          rotateY: mouseOffset.x * 12,
          rotateX: -mouseOffset.y * 6,
          // Subtle natural side-tilt
          rotateZ: isPoked ? [0, -3, 3, 0] : [-1, 1, -1],
        }}
        transition={{
          y: isPoked
            ? { duration: 0.45, ease: 'easeOut' }
            : isSpeaking
            ? { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }
            : { repeat: Infinity, duration: 3.4, ease: 'easeInOut' },
          scale: isPoked
            ? { duration: 0.45, ease: 'easeOut' }
            : isSpeaking
            ? { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }
            : { repeat: Infinity, duration: 3.4, ease: 'easeInOut' },
          rotateZ: isPoked
            ? { duration: 0.45, ease: 'easeOut' }
            : { repeat: Infinity, duration: 4.2, ease: 'easeInOut' },
          rotateY: { type: 'spring', stiffness: 120, damping: 18 },
          rotateX: { type: 'spring', stiffness: 120, damping: 18 },
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative cursor-pointer transition-transform z-20"
        title="Klik Nara untuk mendengar sapaan suaranya!"
      >
        {/* Soft Ambient Character Back-glow */}
        <div className="absolute inset-0 -m-2 bg-gradient-to-b from-emerald-300/20 via-teal-200/15 to-transparent rounded-full blur-xl pointer-events-none -z-10" />

        {/* Character Image Cutout */}
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImageSrc}
            src={activeImageSrc}
            alt="Nara - Asisten Virtual Ruang BK"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`${activeHeight} w-auto object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.16)] drop-shadow-[0_3px_8px_rgba(5,150,105,0.12)]`}
            onError={() => setImageError(true)}
          />
        </AnimatePresence>

        {/* Status Pill Badge Floating Below Character */}
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-emerald-200 shadow-soft-xs text-[9px] font-bold text-emerald-800 flex items-center gap-1.5 whitespace-nowrap"
        >
          {isSpeaking ? (
            <>
              <Volume2 className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span className="text-emerald-700 font-extrabold">Nara Berbicara...</span>
            </>
          ) : (
            <>
              <StatusIcon className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
              <span>{statusLabels[expression] || 'Siap Memandu'}</span>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* 3D Levitating Ground Shadow */}
      <motion.div
        animate={{
          scaleX: isPoked ? [1, 0.55, 1] : [1, 0.75, 1],
          scaleY: isPoked ? [1, 0.5, 1] : [1, 0.7, 1],
          opacity: isPoked ? [0.35, 0.1, 0.35] : [0.3, 0.14, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 3.4,
          ease: 'easeInOut',
        }}
        className="w-20 sm:w-28 h-2 bg-emerald-950/25 rounded-full blur-[3px] mt-1 pointer-events-none"
      />
    </div>
  );

  // Standalone Floating Mode
  if (mode === 'floating') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        {render3DCharacter()}
      </div>
    );
  }

  // SIDEBAR MODE (NARA DISAMPING FORM - CLIPPY ASSISTANT STYLE)
  if (mode === 'sidebar') {
    return (
      <div className={`flex flex-col items-center w-full max-w-sm lg:max-w-xs mx-auto ${className}`}>
        {/* Speech Bubble Card */}
        <div className="w-full relative p-3 sm:p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-100 shadow-2xs text-slate-800 space-y-2">
          {/* Arrow Pointer Pointing Downwards to Nara's Head on Desktop */}
          <div className="hidden lg:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-emerald-100/90" />

          {/* Header Bar */}
          <div className="flex items-center justify-between gap-1.5 border-b border-emerald-50/80 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-emerald-950 tracking-tight flex items-center gap-1">
                <span>Nara</span>
                <span className="text-emerald-600 text-[11px]">✨</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopNaraVoice();
                  setSoundEnabled(!soundEnabled);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
              >
                {soundEnabled ? <Volume2 className="w-3 h-3 text-emerald-600" /> : <VolumeX className="w-3 h-3 text-rose-500" />}
              </button>

              {onToggleMinimize && (
                <button
                  type="button"
                  onClick={onToggleMinimize}
                  className="p-1 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  title="Minimalkan panduan Nara"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
              )}

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {stepTitle}
              </span>
            </div>
          </div>

          {/* Speech Text */}
          <AnimatePresence mode="wait">
            <motion.p
              key={pokeMessage || speechText}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.2 }}
              className={`text-xs leading-relaxed font-medium ${
                pokeMessage
                  ? 'text-emerald-950 font-semibold bg-emerald-50/85 p-2 rounded-xl border border-emerald-200/70'
                  : 'text-slate-700'
              }`}
            >
              {pokeMessage || speechText}
            </motion.p>
          </AnimatePresence>

          {/* Nara Voice Player Bar (Dedicated Voice Controls) */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-emerald-50/80 text-[11px]">
            <button
              type="button"
              onClick={() => handleSpeak()}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] transition-all cursor-pointer shadow-2xs ${
                isSpeaking
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90'
              }`}
              title={isSpeaking ? 'Hentikan suara Nara' : 'Dengarkan suara perempuan Indonesia yang halus'}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-2.5 h-2.5 fill-rose-600 text-rose-600" />
                  <span>Hentikan Suara</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-600" />
                  <span>Suara Nara 🎙️</span>
                </>
              )}
            </button>

            {/* Audio Wave Visualizer while speaking / Auto-voice toggle */}
            {isSpeaking ? (
              <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50/90 border border-emerald-200/60">
                <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-3 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-0.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <span className="text-[9px] text-emerald-800 font-bold ml-1">Bicara</span>
              </div>
            ) : (
              <label className="flex items-center gap-1 text-[10px] text-slate-400 font-medium cursor-pointer hover:text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={autoVoice}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAutoVoice(val);
                    try {
                      localStorage.setItem('bk_nara_autovoice', val ? 'true' : 'false');
                    } catch {}
                  }}
                  className="w-3 h-3 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span>Auto Suara</span>
              </label>
            )}
          </div>

          {/* Action Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
            {tipsAvailable && onTipClick && (
              <button
                type="button"
                onClick={onTipClick}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-[11px] transition-colors min-h-[26px]"
              >
                <Lightbulb className="w-3 h-3 text-amber-600" />
                <span>Tips</span>
              </button>
            )}

            {whyAvailable && onWhyClick && (
              <button
                type="button"
                onClick={onWhyClick}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] transition-colors min-h-[26px]"
              >
                <HelpCircle className="w-3 h-3 text-slate-500" />
                <span>Kenapa?</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePoke}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-colors ml-auto min-h-[26px]"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Sapa</span>
            </button>
          </div>
        </div>

        {/* 3D Character below speech bubble */}
        <div className="mt-2 flex justify-center">
          {render3DCharacter()}
        </div>
      </div>
    );
  }

  // Horizontal Assistant Experience (Speech Bubble beside Character)
  return (
    <div className={`relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 ${className}`}>
      {/* 3D Moving Assistant Character */}
      <div className="shrink-0 flex justify-center">
        {render3DCharacter()}
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 min-w-0 w-full pt-1">
        <div className="relative p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-100 shadow-soft-sm text-slate-800 space-y-3">
          {/* Speech Bubble Pointer Arrow */}
          <div className="hidden sm:block absolute -left-2 top-9 w-4 h-4 bg-white rotate-45 border-l border-b border-emerald-100/90" />

          {/* Assistant Header Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-emerald-50 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-black text-emerald-950 tracking-tight flex items-center gap-1.5">
                <span>Saya Nara, asisten virtual Anda.</span>
                <span className="text-emerald-600 text-xs">✨</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopNaraVoice();
                  setSoundEnabled(!soundEnabled);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                title={soundEnabled ? 'Matikan suara panduan' : 'Nyalakan suara panduan'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
              </button>

              {onToggleMinimize && (
                <button
                  type="button"
                  onClick={onToggleMinimize}
                  className="p-1 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  title="Minimalkan panduan Nara"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              )}

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {stepTitle}
              </span>
            </div>
          </div>

          {/* Speech Body */}
          <AnimatePresence mode="wait">
            <motion.p
              key={pokeMessage || speechText}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.22 }}
              className={`text-xs sm:text-[13px] leading-relaxed font-medium ${
                pokeMessage ? 'text-emerald-900 font-semibold bg-emerald-50/60 p-2 rounded-xl' : 'text-slate-700'
              }`}
            >
              {pokeMessage || speechText || 'Silakan ikuti instruksi pengisian di bawah ini.'}
            </motion.p>
          </AnimatePresence>

          {/* Voice Player Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => handleSpeak()}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs transition-all cursor-pointer shadow-2xs ${
                isSpeaking
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90'
              }`}
              title={isSpeaking ? 'Hentikan suara Nara' : 'Dengarkan suara perempuan Indonesia yang halus'}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
                  <span>Hentikan Suara</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dengarkan Suara Nara 🎙️</span>
                </>
              )}
            </button>

            {/* Audio Wave Visualizer / Auto-voice option */}
            {isSpeaking ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/60">
                <span className="w-0.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-4 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-0.5 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <span className="text-[10px] text-emerald-800 font-bold ml-1">Nara Berbicara</span>
              </div>
            ) : (
              <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium cursor-pointer hover:text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={autoVoice}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAutoVoice(val);
                    try {
                      localStorage.setItem('bk_nara_autovoice', val ? 'true' : 'false');
                    } catch {}
                  }}
                  className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span>Suara Otomatis Setiap Step</span>
              </label>
            )}
          </div>

          {/* Interactive Action Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            {tipsAvailable && onTipClick && (
              <button
                type="button"
                onClick={onTipClick}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-semibold text-[11px] transition-colors"
              >
                <Lightbulb className="w-3 h-3 text-amber-600" />
                <span>Tips Pengisian</span>
              </button>
            )}

            {whyAvailable && onWhyClick && (
              <button
                type="button"
                onClick={onWhyClick}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] transition-colors"
              >
                <HelpCircle className="w-3 h-3 text-slate-500" />
                <span>Kenapa Ditanyakan?</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePoke}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-semibold text-[11px] transition-colors ml-auto"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Sapa Nara</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualGuide;
