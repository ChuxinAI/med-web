import { Navigate, createBrowserRouter } from 'react-router-dom'
import { DoctorLayout } from './layouts/DoctorLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { DoctorLoginPage } from './pages/auth/DoctorLoginPage'
import { AdminLoginPage } from './pages/auth/AdminLoginPage'
import { ConsultationsPage } from './pages/doctor/ConsultationsPage'
import { ConsultationDetailPage } from './pages/doctor/ConsultationDetailPage'
import { CasesPage } from './pages/doctor/CasesPage'
import { KnowledgePage } from './pages/doctor/KnowledgePage'
import { SettingsPage } from './pages/doctor/SettingsPage'
import { ChatPage } from './pages/doctor/ChatPage'
import { PatientsPage } from './pages/doctor/PatientsPage'
import { PatientDetailPage } from './pages/doctor/PatientDetailPage'
import { CaseDetailPage } from './pages/doctor/CaseDetailPage'
import { UsersPage } from './pages/admin/UsersPage'
import { CatalogPage } from './pages/admin/CatalogPage'
import { AdminCasesStatsPage } from './pages/admin/StatsCasesPage'
import { AdminConsultationsStatsPage } from './pages/admin/StatsConsultationsPage'
import { AdminPatientsPage } from './pages/admin/StatsPatientsPage'
import { AdminSettingsPage } from './pages/admin/SettingsPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/doctor/login" replace /> },
  { path: '/login', element: <Navigate to="/doctor/login" replace /> },
  { path: '/doctor/login', element: <DoctorLoginPage /> },
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/doctor',
    element: <DoctorLayout />,
    children: [
      { index: true, element: <Navigate to="consultations" replace /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'consultations', element: <ConsultationsPage /> },
      { path: 'consultations/:caseId', element: <ConsultationDetailPage /> },
      { path: 'patients', element: <PatientsPage /> },
      { path: 'patients/:patientId', element: <PatientDetailPage /> },
      { path: 'cases', element: <CasesPage /> },
      { path: 'cases/:caseId', element: <CaseDetailPage /> },
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
      {
        path: 'stats',
        children: [
          { path: 'cases', element: <AdminCasesStatsPage /> },
          { path: 'consultations', element: <AdminConsultationsStatsPage /> },
          { path: 'patients', element: <AdminPatientsPage /> },
        ],
      },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  },
  { path: '/admin/*', element: <Navigate to="/admin/login" replace /> },
  { path: '*', element: <Navigate to="/doctor/login" replace /> },
])
