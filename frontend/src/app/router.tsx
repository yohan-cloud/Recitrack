import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { FirstLoginRoute } from '../components/common/first-login-route'
import { ProtectedRoute } from '../components/common/protected-route'
import { StudentLayout } from '../layouts/student-layout'
import { StudentAnnouncementsPage } from '../pages/student/announcements-page'
import { TeacherLayout } from '../layouts/teacher-layout'
import { LoginPage } from '../pages/auth/login-page'
import { StudentDashboardPage } from '../pages/student/dashboard-page'
import { StudentHistoryPage } from '../pages/student/history-page'
import { StudentProfilePage } from '../pages/student/profile-page'
import { StudentSettingsPage } from '../pages/student/settings-page'
import { ClassesPage } from '../pages/teacher/classes-page'
import { ClassDetailsPage } from '../pages/teacher/class-details-page'
import { TeacherSettingsPage } from '../pages/teacher/settings-page'
import { TeacherDashboardPage } from '../pages/teacher/dashboard-page'
import { SectionsPage } from '../pages/teacher/sections-page'
import { StudentManagementPage } from '../pages/teacher/student-management-page'
import { AnnouncementsPage } from '../pages/teacher/announcements-page'

const AnalyticsPage = lazy(() => import('../pages/teacher/analytics-page').then((module) => ({ default: module.AnalyticsPage })))
const ReportsPage = lazy(() => import('../pages/teacher/reports-page').then((module) => ({ default: module.ReportsPage })))

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">Loading page...</div>}>
      {children}
    </Suspense>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route path="dashboard" element={<TeacherDashboardPage />} />
          <Route path="sections" element={<SectionsPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:classId" element={<ClassDetailsPage />} />
          <Route path="students" element={<StudentManagementPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="analytics" element={<LazyPage><AnalyticsPage /></LazyPage>} />
          <Route path="reports" element={<LazyPage><ReportsPage /></LazyPage>} />
          <Route path="settings" element={<TeacherSettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route element={<FirstLoginRoute />}>
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="announcements" element={<StudentAnnouncementsPage />} />
            <Route path="history" element={<StudentHistoryPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
