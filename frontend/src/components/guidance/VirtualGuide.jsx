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
  Play,
  Settings2,
  Headphones,
  Check,
  X,
  Radio,
  SlidersHorizontal,
  Loader2,
  Mic,
} from 'lucide-react';

/**
 * Play a gentle, cheerful synthesized chime using Web Audio API
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
 * Global cache of active custom voice recordings recorded by admin/counselors
 */
let activeRecordingsMap = {};
let isFetchingRecordings = false;

export const loadActiveRecordings = async () => {
  if (isFetchingRecordings) return activeRecordingsMap;
  isFetchingRecordings = true;
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    const res = await fetch(`${apiBase}/voice-recordings/active`);
    if (res.ok) {
      const data = await res.json();
      activeRecordingsMap = data.recordings || {};
    }
  } catch (err) {
    console.warn('Could not load custom voice recordings:', err);
  } finally {
    isFetchingRecordings = false;
  }
  return activeRecordingsMap;
};

// Auto-fetch recordings on boot
if (typeof window !== 'undefined') {
  loadActiveRecordings();
}

/**
 * Helper to match recorded audio for a specific text or dialogue key
 */
export const findRecordedAudio = (text = '', dialogueKey = null) => {
  if (!activeRecordingsMap || Object.keys(activeRecordingsMap).length === 0) {
    return null;
  }

  // 1. Direct dialogue key match
  if (dialogueKey && activeRecordingsMap[dialogueKey]?.audio_url) {
    return activeRecordingsMap[dialogueKey];
  }

  if (!text) return null;

  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 2. Search for matching script
  for (const key in activeRecordingsMap) {
    const rec = activeRecordingsMap[key];
    if (!rec || !rec.audio_url) continue;

    const recClean = (rec.text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (recClean && (clean.includes(recClean) || recClean.includes(clean))) {
      return rec;
    }

    // Specific dialogue keyword fallbacks
    if (clean.includes('yukluangkan') && key === 'counseling_step_0') return rec;
    if (clean.includes('kendala') && key === 'counseling_step_1') return rec;
    if (clean.includes('berapalama') && key === 'counseling_step_2') return rec;
    if (clean.includes('memengaruhifokus') && key === 'counseling_step_3') return rec;
    if (clean.includes('upayamandiri') && key === 'counseling_step_4') return rec;
    if (clean.includes('harapan') && key === 'counseling_step_5') return rec;
    if (clean.includes('rangkuman') && key === 'counseling_step_6') return rec;
    if (clean.includes('narasiapbantu') && key === 'poke_1') return rec;
    if (clean.includes('ceritamuaman') && key === 'poke_2') return rec;
    if (clean.includes('kamuhebat') && key === 'poke_3') return rec;
    if (clean.includes('tipsdiatas') && key === 'poke_4') return rec;
  }

  return null;
};

/**
 * List of available Indonesian voices for Nara
 */
export const NARA_VOICES = [
  {
    id: 'custom_recording',
    name: 'Suara Rekaman Konselor / Sistem Bawaan',
    badge: '⭐ Standar Sistem',
    gender: 'Konselor',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold',
    character: 'Memutar suara rekaman asli konselor/admin jika sudah diisi di database. Jika belum diisi, otomatis memutar synthesizer lokal bawaan perangkat Anda.',
    sampleText: 'Halo! Saya Nara, asisten virtual Anda. Yuk luangkan 2-3 menit menjawab pertanyaan ini dengan santai.',
  },
  {
    id: 'browser',
    name: 'Synthesizer Lokal Browser',
    badge: '💻 Bawaan Komputer',
    gender: 'Sistem',
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    character: 'Synthesizer lokal bawaan dari perangkat atau sistem operasi Anda (bisa diakses offline).',
    sampleText: 'Ini adalah uji coba suara sintetis bawaan sistem operasi komputer Anda.',
  },
  {
    id: 'gadis',
    name: 'Nara Gadis (Neural Studio)',
    badge: '🌟 Neural Alami',
    gender: 'Wanita',
    color: 'teal',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    character: 'Suara perempuan Indonesia neural berintonasi halus, ramah, dan sangat alami.',
    sampleText: 'Halo! Saya Nara, asisten virtual Anda. Yuk luangkan dua menit menjawab pertanyaan ini dengan santai.',
  },
  {
    id: 'siti',
    name: 'Nara Siti (Santun & Tenang)',
    badge: '🍃 Lembut & Santun',
    gender: 'Wanita',
    color: 'teal',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    character: 'Karakter suara yang lebih tenang, teduh, santun, dan sangat menenangkan untuk suasana rileks.',
    sampleText: 'Tarik napas sejenak ya. Ceritamu aman dan dijamin kerahasiaannya bersama konselor.',
  },
  {
    id: 'google',
    name: 'Nara Google (Jernih & Lancar)',
    badge: '⚡ Artikulasi Jelas',
    gender: 'Wanita',
    color: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    character: 'Suara jernih khas Google berbahasa Indonesia dengan artikulasi tegas dan tempo teratur.',
    sampleText: 'Yuk pilih salah satu jawaban yang paling mewakili situasimu saat ini.',
  },
];

// Active Audio Instance Singleton
let currentAudioInstance = null;

/**
 * Stop any active Nara speech (both Audio stream & Web Speech API)
 */
export const stopNaraVoice = () => {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch {}
    currentAudioInstance = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
};

/**
 * Browser Web Speech API Synthesizer (Local SAPI / Browser Engine)
 */
const speakWithBrowserVoice = (text, { onStart, onEnd, onError } = {}) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.pitch = 1.08;
  utterance.rate = 0.95;

  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const idVoice = voices.find(
      (v) =>
        (v.lang === 'id-ID' || v.lang.toLowerCase().startsWith('id')) &&
        (v.name.toLowerCase().includes('gadis') ||
          v.name.toLowerCase().includes('siti') ||
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('wanita') ||
          v.name.toLowerCase().includes('natural'))
    ) || voices.find((v) => v.lang === 'id-ID' || v.lang.toLowerCase().startsWith('id'));

    if (idVoice) utterance.voice = idVoice;
  }

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
 * Helper to speak using backend Neural TTS stream
 */
const speakWithNeuralTts = (cleanText, voice, rate, { onStart, onEnd, onError } = {}) => {
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    const streamUrl = `${apiBase}/tts?text=${encodeURIComponent(cleanText)}&voice=${encodeURIComponent(voice)}&rate=${encodeURIComponent(rate)}`;

    const audio = new Audio(streamUrl);
    currentAudioInstance = audio;

    let hasStarted = false;

    audio.onplay = () => {
      hasStarted = true;
      if (onStart) onStart();
    };

    audio.onended = () => {
      currentAudioInstance = null;
      if (onEnd) onEnd();
    };

    audio.onerror = (e) => {
      console.warn('Backend TTS audio error, switching to browser speech synthesis fallback:', e);
      currentAudioInstance = null;
      speakWithBrowserVoice(cleanText, { onStart, onEnd, onError });
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Playback error or interrupted:', err);
        if (!hasStarted) {
          currentAudioInstance = null;
          if (onEnd) onEnd();
        }
      });
    }

    return true;
  } catch (err) {
    console.error('TTS execution error:', err);
    return speakWithBrowserVoice(cleanText, { onStart, onEnd, onError });
  }
};

/**
 * Speak Nara Voice:
 * 1. If admin recording exists -> play admin recording audio
 * 2. If no admin recording exists -> DEFAULT is local browser synthesizer
 * 3. If user manually chooses another voice -> use that voice
 */
export const speakNaraVoice = (
  text,
  {
    voiceId = null,
    rate = null,
    dialogueKey = null,
    onStart,
    onEnd,
    onError,
  } = {}
) => {
  stopNaraVoice();

  if (!text) {
    if (onEnd) onEnd();
    return false;
  }

  // Clean text
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*_~`#💡❓✨🎉🎙️]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return false;
  }

  const selectedVoice = voiceId || localStorage.getItem('bk_nara_voice_choice') || 'custom_recording';
  const selectedRate = rate || localStorage.getItem('bk_nara_voice_rate') || '+0%';

  // 1. Default Mode: Admin Recorded Audio -> Fallback to Local Browser Synthesizer!
  if (selectedVoice === 'custom_recording') {
    const recordedAudio = findRecordedAudio(cleanText, dialogueKey);
    if (recordedAudio && recordedAudio.audio_url) {
      try {
        const audio = new Audio(recordedAudio.audio_url);
        currentAudioInstance = audio;

        audio.onplay = () => {
          if (onStart) onStart();
        };

        audio.onended = () => {
          currentAudioInstance = null;
          if (onEnd) onEnd();
        };

        audio.onerror = (e) => {
          console.warn('Recorded audio playback error, falling back to local browser synthesizer:', e);
          currentAudioInstance = null;
          speakWithBrowserVoice(cleanText, { onStart, onEnd, onError });
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio play interrupted:', err);
            currentAudioInstance = null;
            if (onEnd) onEnd();
          });
        }

        return true;
      } catch (err) {
        console.warn('Error playing recorded audio:', err);
      }
    }

    // Default Fallback when not yet recorded by admin: Synthesizer lokal bawaan dari perangkat / sistem!
    return speakWithBrowserVoice(cleanText, { onStart, onEnd, onError });
  }

  // 2. Local Browser Synthesizer explicitly chosen
  if (selectedVoice === 'browser') {
    return speakWithBrowserVoice(cleanText, { onStart, onEnd, onError });
  }

  // 3. Chosen Neural Voice (gadis, siti, google)
  return speakWithNeuralTts(cleanText, selectedVoice, selectedRate, { onStart, onEnd, onError });
};

/**
 * Voice Settings Modal Component
 */
export const VoiceSettingsModal = ({
  isOpen,
  onClose,
  activeVoiceId,
  onSelectVoice,
  activeRate,
  onSelectRate,
  autoVoice,
  onToggleAutoVoice,
  onTestVoice,
  testingVoiceId,
  hasRecordingsCount,
}) => {
  if (!isOpen) return null;

  const rateOptions = [
    { label: 'Santai (0.9x)', value: '-10%' },
    { label: 'Normal (1.0x)', value: '+0%' },
    { label: 'Cepat (1.1x)', value: '+10%' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Headphones className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Karakter Suara Nara</h3>
              <p className="text-xs text-emerald-100/90 font-medium">Pilih karakter suara yang paling nyaman didengar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Voice Cards */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Pilihan Karakter Suara
            </label>
            <div className="space-y-2">
              {NARA_VOICES.map((v) => {
                const isSelected = activeVoiceId === v.id;
                const isTestingThis = testingVoiceId === v.id;

                return (
                  <div
                    key={v.id}
                    className={`relative p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">{v.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${v.badgeClass}`}>
                            {v.badge}
                          </span>
                          {v.id === 'custom_recording' && hasRecordingsCount > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              {hasRecordingsCount} Rekaman Tersedia
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                          {v.character}
                        </p>
                      </div>

                      {/* Right Action: Test Button & Radio */}
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => onTestVoice(v)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            isTestingThis
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                              : 'bg-white hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200 shadow-2xs'
                          }`}
                          title="Dengarkan contoh suara ini"
                        >
                          {isTestingThis ? (
                            <>
                              <Square className="w-2.5 h-2.5 fill-rose-600 text-rose-600" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                              <span>Tes</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectVoice(v.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'border-2 border-slate-300 hover:border-emerald-500'
                          }`}
                          title={isSelected ? 'Suara aktif' : 'Pilih suara ini'}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Speed / Rate Setting */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Kecepatan Suara
            </label>
            <div className="grid grid-cols-3 gap-2">
              {rateOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectRate(opt.value)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    activeRate === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Voice Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <div>
              <div className="text-xs font-bold text-emerald-950">Suara Otomatis</div>
              <div className="text-[11px] text-slate-500 font-medium">Nara langsung berbicara tanpa harus ditekan tombolnya</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoVoice}
                onChange={(e) => onToggleAutoVoice(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft-sm transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Nara – 3D Interactive Virtual Assistant (Clippy-Style)
 * Featuring Automatic Speech, Custom Human Voice Recordings & Local Synthesizer Default
 */
export const VirtualGuide = ({
  mode = 'sidebar', // 'sidebar' | 'floating' | 'assistant' | 'avatar' | 'compact'
  expression = 'neutral', // 'neutral' | 'listening' | 'encouraging' | 'positive'
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  speechText = '',
  dialogueKey = null, // Optional key to map directly to custom recording (e.g. 'counseling_step_0')
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

  // Custom Recordings Cache state
  const [hasRecordingsCount, setHasRecordingsCount] = useState(0);

  // Voice Settings State (Default: 'custom_recording' with local browser synth fallback)
  const [voiceChoice, setVoiceChoice] = useState(() => {
    try {
      return localStorage.getItem('bk_nara_voice_choice') || 'custom_recording';
    } catch {
      return 'custom_recording';
    }
  });

  const [voiceRate, setVoiceRate] = useState(() => {
    try {
      return localStorage.getItem('bk_nara_voice_rate') || '+0%';
    } catch {
      return '+0%';
    }
  });

  // Auto Voice defaults to TRUE so Nara talks automatically without being asked
  const [autoVoice, setAutoVoice] = useState(() => {
    try {
      const saved = localStorage.getItem('bk_nara_autovoice');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const characterRef = useRef(null);

  // Sync voice settings dynamically if modified in Admin Panel
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setVoiceChoice(localStorage.getItem('bk_nara_voice_choice') || 'custom_recording');
        setVoiceRate(localStorage.getItem('bk_nara_voice_rate') || '+0%');
        const auto = localStorage.getItem('bk_nara_autovoice');
        setAutoVoice(auto === null ? true : auto === 'true');
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load custom recordings count on mount
  useEffect(() => {
    loadActiveRecordings().then((map) => {
      setHasRecordingsCount(Object.keys(map || {}).length);
    });
  }, []);

  // Check if current dialogue has a recorded human audio
  const currentRecordedAudio = findRecordedAudio(pokeMessage || speechText, dialogueKey);

  // Active Voice Meta
  const activeVoiceMeta = NARA_VOICES.find((v) => v.id === voiceChoice) || NARA_VOICES[0];

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

  // Cleanup on unmount
  useEffect(() => {
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
  const handleSpeak = useCallback((customText = null, overrideVoice = null, overrideKey = null) => {
    if (!soundEnabled) return;

    if (isSpeaking) {
      stopNaraVoice();
      setIsSpeaking(false);
      return;
    }

    const targetText = customText || pokeMessage || speechText;
    if (!targetText) return;

    speakNaraVoice(targetText, {
      voiceId: overrideVoice || voiceChoice,
      rate: voiceRate,
      dialogueKey: overrideKey || (customText ? null : dialogueKey),
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [soundEnabled, isSpeaking, pokeMessage, speechText, voiceChoice, voiceRate, dialogueKey]);

  // AUTO-SPEAK: Nara directly speaks automatically when dialogue appears or step changes!
  useEffect(() => {
    if (autoVoice && soundEnabled && speechText && !isMinimized && !pokeMessage) {
      const timer = setTimeout(() => {
        handleSpeak(speechText, null, dialogueKey);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [speechText, dialogueKey, autoVoice, soundEnabled, isMinimized]);

  // Interactive Poke / Click Response
  const handlePoke = () => {
    setIsPoked(true);
    if (soundEnabled) {
      playAssistantChime();
    }

    const playfulMessages = [
      { text: 'Halo! Nara siap bantu jika ada pertanyaan yang membingungkan.', key: 'poke_1' },
      { text: 'Jawab dengan santai ya, ceritamu aman dan privat bersama konselor.', key: 'poke_2' },
      { text: 'Kamu hebat sudah mengambil langkah pertama untuk konseling!', key: 'poke_3' },
      { text: 'Butuh panduan lebih dalam? Klik tombol Tips di atas ya.', key: 'poke_4' },
    ];
    const chosen = playfulMessages[Math.floor(Math.random() * playfulMessages.length)];
    setPokeMessage(chosen.text);

    if (soundEnabled) {
      setTimeout(() => {
        handleSpeak(chosen.text, null, chosen.key);
      }, 150);
    }

    setTimeout(() => {
      setIsPoked(false);
    }, 600);

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
          y: isPoked ? [0, -20, 0] : isSpeaking ? [0, -10, 0, -5, 0] : [0, -8, 0],
          scale: isPoked ? [1, 1.05, 1] : isSpeaking ? [1, 1.025, 1] : [1, 1.015, 1],
          rotateY: mouseOffset.x * 12,
          rotateX: -mouseOffset.y * 6,
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
        <div className="absolute inset-0 -m-2 bg-gradient-to-b from-emerald-300/20 via-teal-200/15 to-transparent rounded-full blur-xl pointer-events-none -z-10" />

        <img
          src={activeImageSrc}
          alt="Nara - Asisten Virtual Ruang BK"
          className={`${activeHeight} w-auto object-contain drop-shadow-[0_12px_24px_rgba(5,150,105,0.22)] select-none pointer-events-none transition-all duration-300`}
          loading="eager"
        />

        {/* Floating Expression Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          key={expression}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 shadow-soft-sm whitespace-nowrap border z-30 bg-white/95 text-slate-700 border-emerald-200 backdrop-blur-md"
        >
          <StatusIcon className="w-3 h-3 text-emerald-600" />
          <span>{statusLabels[expression] || 'Siap Memandu'}</span>
        </motion.div>
      </motion.div>

      {/* 3D Dynamic Floor Contact Shadow */}
      <motion.div
        animate={{
          scale: isPoked ? [1, 0.7, 1] : isSpeaking ? [0.95, 1.05, 0.95] : [0.9, 1.1, 0.9],
          opacity: isPoked ? [0.6, 0.2, 0.6] : [0.35, 0.55, 0.35],
        }}
        transition={{
          repeat: Infinity,
          duration: isSpeaking ? 1.6 : 3.4,
          ease: 'easeInOut',
        }}
        className="w-24 sm:w-32 h-3.5 bg-emerald-950/20 rounded-full blur-xs mt-1"
      />
    </div>
  );

  // SIDEBAR MODE (NARA DISAMPING FORM - CLIPPY ASSISTANT STYLE)
  if (mode === 'sidebar') {
    return (
      <div className={`relative flex flex-col ${className}`}>
        {/* Speech Bubble on Top with pointer pointing down to Nara */}
        <div className="relative p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-100 shadow-soft-sm text-slate-800 space-y-2.5">
          {/* Arrow Pointer Pointing Downwards to Nara's Head */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-emerald-100/90" />

          {/* Assistant Header */}
          <div className="flex items-center justify-between gap-1.5 border-b border-emerald-50 pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="text-xs font-black text-emerald-950 tracking-tight truncate flex items-center gap-1">
                <span>Nara</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100 truncate max-w-[120px]">
                  {currentRecordedAudio && voiceChoice === 'custom_recording'
                    ? 'Suara Asli Konselor'
                    : 'Suara Sistem'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopNaraVoice();
                  setSoundEnabled(!soundEnabled);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                title={soundEnabled ? 'Matikan suara panduan' : 'Nyalakan suara panduan'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
              </button>

              {onToggleMinimize && (
                <button
                  type="button"
                  onClick={onToggleMinimize}
                  className="p-1 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Minimalkan panduan Nara"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              )}
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

          {/* Action Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
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
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 ml-1 hidden sm:inline-block">
                  {currentRecordedAudio && voiceChoice === 'custom_recording'
                    ? 'Suara Asli Konselor'
                    : 'Suara Sistem'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopNaraVoice();
                  setSoundEnabled(!soundEnabled);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                title={soundEnabled ? 'Matikan suara panduan' : 'Nyalakan suara panduan'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
              </button>

              {onToggleMinimize && (
                <button
                  type="button"
                  onClick={onToggleMinimize}
                  className="p-1 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
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

          {/* Interactive Action Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-100 text-xs">
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
