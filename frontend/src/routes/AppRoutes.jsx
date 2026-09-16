import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';

// Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { DashboardSkeleton } from '../components/common/LoadingSkeleton';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
const ArticlesPage = lazy(() => import('../pages/articles/ArticlesPage'));
const ArticleDetailPage = lazy(() => import('../pages/articles/ArticleDetailPage'));
const Login = lazy(() => import('../pages/auth/Login'));
const RegisterStudent = lazy(() => import('../pages/auth/RegisterStudent'));
const RegisterGeneral = lazy(() => import('../pages/auth/RegisterGeneral'));

const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard'));
const Profile = lazy(() => import('../pages/student/Profile'));
const History = lazy(() => import('../pages/student/History'));

const QuestionnaireRunner = lazy(() => import('../pages/questionnaire/QuestionnaireRunner'));
const ScreeningResult = lazy(() => import('../pages/questionnaire/ScreeningResult'));

const CounselingRequest = lazy(() => import('../pages/counseling/CounselingRequest'));
const BookingSchedule = lazy(() => import('../pages/counseling/BookingSchedule'));
const CaseDetail = lazy(() => import('../pages/counseling/CaseDetail'));
const SessionRoom = lazy(() => import('../pages/counseling/SessionRoom'));
const SessionSummary = lazy(() => import('../pages/counseling/SessionSummary'));
const CounselorsByTopicPage = lazy(() => import('../pages/counseling/CounselorsByTopicPage'));
const CounselorDetailPage = lazy(() => import('../pages/counseling/CounselorDetailPage'));
const CounselingWizard = lazy(() => import('../pages/counseling/CounselingWizard'));

const TutorDashboard = lazy(() => import('../pages/tutor/TutorDashboard'));
const TutorStudents = lazy(() => import('../pages/tutor/TutorStudents'));
const TutorSchedule = lazy(() => import('../pages/tutor/TutorSchedule'));
const TutorProfile = lazy(() => import('../pages/tutor/TutorProfile'));

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));

const PageLoader = () => (
  <div className="p-6 max-w-xl mx-auto w-full">
    <DashboardSkeleton />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/artikel" element={<ArticlesPage />} />
        <Route path="/artikel/:id" element={<ArticleDetailPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:id" element={<ArticleDetailPage />} />

        {/* Public Counseling Discovery (Jalur A & Jalur B) */}
        <Route path="/konselor" element={<CounselorsByTopicPage />} />
        <Route path="/konselor/:id" element={<CounselorDetailPage />} />
        <Route path="/counselors" element={<CounselorsByTopicPage />} />
        <Route path="/counselors/:id" element={<CounselorDetailPage />} />

        {/* Auth Pages */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login?tab=student" replace />} />
          <Route path="/register/student" element={<Navigate to="/login?tab=student" replace />} />
          <Route path="/register/general" element={<RegisterGeneral />} />
        </Route>

        {/* Student & General User Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['STUDENT', 'GENERAL']}>
                <AppLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="screening" element={<QuestionnaireRunner />} />
          <Route path="screening/result/:id" element={<ScreeningResult />} />
          <Route path="counseling/wizard" element={<CounselingWizard />} />
          <Route path="counseling/new" element={<CounselingWizard />} />
          <Route path="counseling" element={<CounselorsByTopicPage />} />
          <Route path="counseling/book/:caseId" element={<BookingSchedule />} />
          <Route path="cases/:id" element={<CaseDetail />} />
          <Route path="sessions/:id" element={<SessionRoom />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Video Counseling Session Internal Route (Accessible by Student & Tutor) */}
        <Route
          path="/counseling/session/:id"
          element={
            <ProtectedRoute>
              <AppLayout showHeader={false} />
            </ProtectedRoute>
          }
        >
          <Route index element={<SessionRoom />} />
        </Route>

        {/* Tutor Post-Session Notes Route */}
        <Route
          path="/counseling/session/:id/summary"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['TUTOR', 'ADMIN']}>
                <AppLayout showHeader={false} />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<SessionSummary />} />
        </Route>

        {/* Tutor Portal Routes */}
        <Route
          path="/tutor"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['TUTOR']}>
                <AppLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<TutorDashboard />} />
          <Route path="schedule" element={<TutorSchedule />} />
          <Route path="cases" element={<TutorStudents />} />
          <Route path="cases/:id" element={<CaseDetail />} />
          <Route path="students" element={<Navigate to="/tutor/cases" replace />} />
          <Route path="profile" element={<TutorProfile />} />
        </Route>

        {/* Admin Portal Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminDashboard />} />
          <Route path="audit-logs" element={<AdminDashboard />} />
          <Route path="settings" element={<AdminDashboard />} />
        </Route>

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
