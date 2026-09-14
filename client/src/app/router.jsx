import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../shared/components/layout/MainLayout.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import DashboardPage from '../features/dashboard/DashboardPage.jsx';
import TransfersPage from '../features/transfers/TransfersPage.jsx';
import AlertsPage from '../features/alerts/AlertsPage.jsx';
import AuditPage from '../features/audit/AuditPage.jsx';

/**
 * Rutas iniciales de la aplicación.
 * /login vive fuera del layout con sidebar; el resto de rutas
 * comparten MainLayout (sidebar + header + contenido).
 *
 * Cuando se implemente autenticación real, aquí se agregará
 * la protección de rutas privadas.
 */
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'transfers', element: <TransfersPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'audit', element: <AuditPage /> },
    ],
  },
]);

export default router;
