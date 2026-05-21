import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { AuthLayoutPacient } from './pages/_layouts/auth';
import { AppLayoutAdmin } from './pages/_layouts/app';
import { SimpleLayout } from './pages/_layouts/simple';

// Páginas
import { Home } from './pages/auth/lading-page';
import { SelectAccountType } from './pages/auth/accountType';
import { SignUpUnificado } from './pages/auth/sign-up-unificado';
import { SuccessAccount } from './pages/auth/succseeAccount';
import { ErrorAccount } from './pages/auth/errorAccount';
import LocaTechDashboard from './pages/app/dashboard/dasboard';
import { NotificacoesGestor } from './pages/app/dashboard/notificacoes-gestor';
import DefinicoesDashPage from './pages/app/dashboard/dasboard-details';
import PerfilPage from './pages/app/dashboard/perfil';
import { EditarPosto } from './pages/app/dashboard/editar-posto';
import { Monitoramento } from './pages/app/dashboard/monitoramento';
import { DefinicoesGestor } from './pages/app/dashboard/definicoes-gestor'; 
import { MonitoramentoDetalhado } from './pages/app/dashboard/monitoramento-detalhado';
import { Sobre } from './pages/auth/sobre';
import { ComoFunciona } from './pages/auth/como-funciona';
import { Contactos } from './pages/auth/contactos';
import LoginPage from './pages/app/dashboard/login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UnauthorizedPage } from './pages/auth/unauthorized';
import { SavedPostsPage } from './pages/app/dashboard/saved-posts';

export const router = createBrowserRouter([

  // ── Página inicial — Login ────────────────────────────────────────────────
  {
    path: '/',
    element: <LoginPage />,
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    path: '/auth',
    element: <AuthLayoutPacient />,
    children: [
      { index: true,                element: <Navigate to="/auth/login" replace /> },
      { path: 'login',             element: <LoginPage /> },
      { path: 'landing',           element: <Home /> },
      { path: 'select-type',       element: <SelectAccountType /> },
      { path: 'sign-up',           element: <SignUpUnificado /> },
      { path: 'success',           element: <SuccessAccount /> },
      { path: 'error',             element: <ErrorAccount /> },
    ],
  },

  // ── Acesso Negado ───────────────────────────────────────────────────────
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },

  // ── Dashboard Unificado (Todas as roles) ──────────────────────────────
  {
    path: '/dashboard',
    element: <ProtectedRoute allowedRoles={['MEMBER', 'GESTOR', 'ADMIN']}>
      <AppLayoutAdmin />
    </ProtectedRoute>,
    children: [
      { index: true,           element: <LocaTechDashboard /> },
      { path: 'perfil',        element: <PerfilPage /> },
      { path: 'detail/:id',    element: <DefinicoesDashPage /> },
      { path: 'salvos',        element: <SavedPostsPage /> },
      // Rotas exclusivas para GESTOR
      { path: 'monitoramento', element: <ProtectedRoute allowedRoles={['GESTOR', 'ADMIN']}><Monitoramento /></ProtectedRoute> },
      { path: 'analise',       element: <ProtectedRoute allowedRoles={['GESTOR', 'ADMIN']}><MonitoramentoDetalhado /></ProtectedRoute> },
      { path: 'notificacoes', element: <ProtectedRoute allowedRoles={['GESTOR', 'ADMIN']}><NotificacoesGestor /></ProtectedRoute> },
      { path: 'editar-posto', element: <ProtectedRoute allowedRoles={['GESTOR', 'ADMIN']}><EditarPosto /></ProtectedRoute> },
      { path: 'definicoes',   element: <ProtectedRoute allowedRoles={['GESTOR', 'ADMIN']}><DefinicoesGestor /></ProtectedRoute> },
    ],
  },

  // ── Páginas públicas ──────────────────────────────────────────────────────
  {
    path: '/',
    element: <SimpleLayout />,
    children: [
      { path: 'sobre',          element: <Sobre /> },
    ],
  },
  {
    path: '/',
    element: <AuthLayoutPacient />,
    children: [
      { path: 'contactos',      element: <Contactos /> },
      { path: 'como-funciona',  element: <ComoFunciona /> },
    ],
  },
]);