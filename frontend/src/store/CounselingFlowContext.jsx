import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ruangbk_counseling_flow_v1';

const CounselingFlowContext = createContext(null);

export const CounselingFlowProvider = ({ children }) => {
  const [flowState, setFlowState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse counseling flow state:', e);
    }
    return {
      selectedTopic: null,
      selectedCounselor: null,
      customTopic: '',
      assessmentData: null,
      selectedMethod: 'ZOOM', // 'CHAT' | 'ZOOM' | 'OFFLINE'
      selectedSlot: null,
      entryPath: null, // 'topic' | 'counselor' | 'screening'
      screeningResponse: null,
    };
  });

  // Persist to sessionStorage on state change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(flowState));
    } catch (e) {
      console.warn('Failed to save counseling flow state:', e);
    }
  }, [flowState]);

  // Jalur A: Start with Topic chosen from Landing Page
  const startWithTopic = useCallback((topic) => {
    setFlowState((prev) => ({
      ...prev,
      selectedTopic: topic,
      selectedCounselor: null,
      customTopic: '',
      entryPath: 'topic',
    }));
  }, []);

  // Jalur B: Start with Counselor chosen from Landing Page
  const startWithCounselor = useCallback((counselor) => {
    setFlowState((prev) => ({
      ...prev,
      selectedCounselor: counselor,
      selectedTopic: null,
      customTopic: '',
      entryPath: 'counselor',
    }));
  }, []);

  // Jalur C: Start with Screening Assessment Result
  const startWithScreening = useCallback((screeningData, matchedTopic = null) => {
    const topCategory = screeningData?.category_scores?.[0]?.category || 'Akademik & Skripsi';
    const primaryTopic = matchedTopic || {
      id: 1,
      title: topCategory,
      tag: 'Hasil Evaluasi Screening',
    };

    const impactVal = screeningData?.category_scores?.[0]?.level === 'Tinggi' ? 4 : (screeningData?.category_scores?.[0]?.level === 'Sedang' ? 3 : 2);

    const assessment = {
      topic: topCategory,
      main_issue: `Asesmen Kebutuhan: ${topCategory}`,
      duration: '1–4 minggu',
      impact_level: impactVal,
      previous_efforts: 'Pengisian screening evaluasi mandiri',
      story: `Berdasarkan pengisian instrumen evaluasi mandiri (${screeningData?.questionnaire?.title || 'Screening Kebutuhan Mahasiswa'}). Area bimbingan utama: ${topCategory} (Tingkat: ${screeningData?.category_scores?.[0]?.level || 'Perlu Pendampingan'}).`,
      screening_response_id: screeningData?.id || null,
    };

    setFlowState((prev) => ({
      ...prev,
      selectedTopic: primaryTopic,
      selectedCounselor: null,
      customTopic: '',
      assessmentData: assessment,
      entryPath: 'screening',
      screeningResponse: screeningData,
    }));
  }, []);

  const setSelectedTopic = useCallback((topic, custom = '') => {
    setFlowState((prev) => ({
      ...prev,
      selectedTopic: topic,
      customTopic: custom,
    }));
  }, []);

  const setSelectedCounselor = useCallback((counselor) => {
    setFlowState((prev) => ({
      ...prev,
      selectedCounselor: counselor,
    }));
  }, []);

  const setAssessmentData = useCallback((data) => {
    setFlowState((prev) => ({
      ...prev,
      assessmentData: data,
    }));
  }, []);

  const setSelectedMethod = useCallback((method) => {
    setFlowState((prev) => ({
      ...prev,
      selectedMethod: method,
      selectedSlot: null, // reset slot if method changed
    }));
  }, []);

  const setSelectedSlot = useCallback((slot) => {
    setFlowState((prev) => ({
      ...prev,
      selectedSlot: slot,
    }));
  }, []);

  const resetFlow = useCallback(() => {
    const fresh = {
      selectedTopic: null,
      selectedCounselor: null,
      customTopic: '',
      assessmentData: null,
      selectedMethod: 'ZOOM',
      selectedSlot: null,
      entryPath: null,
      screeningResponse: null,
    };
    setFlowState(fresh);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  }, []);

  const hasActiveBooking = Boolean(flowState.selectedTopic && flowState.selectedCounselor);

  return (
    <CounselingFlowContext.Provider
      value={{
        ...flowState,
        hasActiveBooking,
        startWithTopic,
        startWithCounselor,
        startWithScreening,
        setSelectedTopic,
        setSelectedCounselor,
        setAssessmentData,
        setSelectedMethod,
        setSelectedSlot,
        resetFlow,
      }}
    >
      {children}
    </CounselingFlowContext.Provider>
  );
};

export const useCounselingFlow = () => {
  const context = useContext(CounselingFlowContext);
  if (!context) {
    throw new Error('useCounselingFlow must be used within a CounselingFlowProvider');
  }
  return context;
};

export default CounselingFlowContext;
