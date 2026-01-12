import { Navigate, createBrowserRouter } from 'react-router-dom'
import { DoctorLayout } from './layouts/DoctorLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { ConsultationsPage } from './pages/doctor/ConsultationsPage'
import { ConsultationDetailPage } from './pages/doctor/ConsultationDetailPage'
import { CasesPage } from './pages/doctor/CasesPage'
import { KnowledgePage } from './pages/doctor/KnowledgePage'
import { SettingsPage } from './pages/doctor/SettingsPage'
import { UsersPage } from './pages/admin/UsersPage'
import { CatalogPage } from './pages/admin/CatalogPage'
import { AdminCasesPage } from './pages/admin/CasesPage'
import { AuditPage } from './pages/admin/AuditPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/doctor',
    element: <DoctorLayout />,
    children: [
      { index: true, element: <Navigate to="consultations" replace /> },
      { path: 'consultations', element: <ConsultationsPage /> },
      { path: 'consultations/:caseId', element: <ConsultationDetailPage /> },
      { path: 'cases', element: <CasesPage /> },
      { path: 'knowledge', element: <KnowledgePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="users" replace /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'cases', element: <AdminCasesPage /> },
      { path: 'audit', element: <AuditPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])
