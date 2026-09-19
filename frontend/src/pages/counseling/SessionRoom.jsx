import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import WaitingRoom from '../../components/zoom/WaitingRoom';
import ZoomMockView from '../../components/zoom/ZoomMockView';
import ZoomSDKView from '../../components/zoom/ZoomSDKView';
import CounselingChatRoom from '../../components/counseling/CounselingChatRoom';
import OfflineSessionView from '../../components/counseling/OfflineSessionView';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import PageTransition from '../../components/common/PageTransition';

export const SessionRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isTutor } = useAuth();
  const { showSuccess, showError } = useToast();

  const [session, setSession] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [forceMock, setForceMock] = useState(null);

  // Load session information
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/${id}`);
        setSession(res.data?.data || res.data);
      } catch (err) {
        showError(err.response?.data?.message || err.message || 'Gagal memuat informasi sesi konseling.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [id, showError]);

  const handleJoinMeeting = async (forceTest = false) => {
    setIsJoining(true);
    try {
      // Obtain secure Zoom SDK signature from backend
      const res = await api.post('/zoom/signature', { session_id: id, force_test: forceTest });
      const payload = res?.data || res;
      if (payload) {
        setSignatureData(payload);
        setIsInMeeting(true);
        if (payload.is_mock) {
          showSuccess('Terhubung ke simulasi video konseling (WebRTC).');
        } else {
          showSuccess('Terhubung ke ruang konseling Zoom Meeting SDK.');
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Gagal memulai ruang konseling.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveSession = () => {
    setIsInMeeting(false);
    setForceMock(null);
    if (isTutor) {
      // Tutor redirected to write session summary & notes
      navigate(`/counseling/session/${id}/summary`);
    } else {
      showSuccess('Sesi konseling telah selesai. Terima kasih.');
      navigate('/app');
    }
  };

  if (isLoading) {
    return <CardSkeleton height="h-96" />;
  }

  if (!session) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-softborder">
        <p className="text-sm text-mutedtext">Sesi konseling tidak ditemukan atau Anda tidak terdaftar.</p>
        <button
          onClick={() => navigate('/app')}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const method = (session.method || session.counseling_case?.method || 'ZOOM').toUpperCase();

  return (
    <PageTransition className="w-full flex-1 flex flex-col">
      {/* 1. CHAT METHOD */}
      {method === 'CHAT' && (
        <div className="w-full h-[calc(100vh-3rem)] min-h-[550px] flex flex-col">
          <CounselingChatRoom
            session={session}
            user={user}
            isTutor={isTutor}
            onLeaveSession={handleLeaveSession}
          />
        </div>
      )}

      {/* 2. OFFLINE / TATAP MUKA METHOD */}
      {method === 'OFFLINE' && (
        <OfflineSessionView
          session={session}
          user={user}
          isTutor={isTutor}
          onLeaveSession={handleLeaveSession}
        />
      )}

      {/* 3. ZOOM VIDEO METHOD */}
      {method === 'ZOOM' && (
        <AnimatePresence mode="wait">
          {isJoining ? (
            <motion.div
              key="joining"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-softborder"
            >
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
              <h3 className="text-base font-bold text-darktext">Menyiapkan ruang konseling...</h3>
              <p className="text-xs text-mutedtext mt-1">Mengamankan koneksi video dan verifikasi identitas sesi</p>
            </motion.div>
          ) : isInMeeting && signatureData ? (
            <motion.div
              key={(forceMock !== null ? forceMock : Boolean(signatureData?.is_mock)) ? 'meeting-mock' : 'meeting-sdk'}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex-1 flex flex-col"
            >
              {(forceMock !== null ? forceMock : Boolean(signatureData?.is_mock)) ? (
                <ZoomMockView
                  sessionData={signatureData}
                  session={session}
                  isTutor={isTutor}
                  onLeaveSession={handleLeaveSession}
                  onSwitchToLiveSDK={() => setForceMock(false)}
                />
              ) : (
                <ZoomSDKView
                  sessionData={signatureData}
                  session={session}
                  isTutor={isTutor}
                  onLeaveSession={handleLeaveSession}
                  onSwitchToMock={() => setForceMock(true)}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col justify-center"
            >
              <WaitingRoom
                session={session}
                isTutor={isTutor}
                onJoin={handleJoinMeeting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </PageTransition>
  );
};

export default SessionRoom;
