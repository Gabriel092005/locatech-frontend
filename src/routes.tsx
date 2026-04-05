import { createBrowserRouter } from 'react-router-dom';

// Layouts
import { AuthLayoutPacient } from './pages/_layouts/auth';
import { AppLayoutAdmin } from './pages/_layouts/app';
import { SimpleLayout } from './pages/_layouts/simple'; 
import { GestorLayout } from './pages/_layouts/gestor'; 

// Páginas
import { SignUpGestor } from './pages/auth/sign-up';
import { Home } from './pages/auth/lading-page';
import { SelectAccountType } from './pages/auth/accountType';
import { SuccessAccount } from './pages/auth/succseeAccount';
import { ErrorAccount } from './pages/auth/errorAccount';
import LocaTechDashboard from './pages/app/dashboard/dasboard';
import NotificacoesPage from './pages/app/dashboard/notificacoes'; 
import { NotificacoesGestor } from './pages/app/dashboard/notificacoes-gestor'; 
import DefinicoesDashPage from './pages/app/dashboard/dasboard-details';
import PerfilPage from './pages/app/dashboard/perfil'; 
import { PerfilGestor } from './pages/app/dashboard/perfil-gestor'; 
import { EditarPosto } from './pages/app/dashboard/editar-posto'; // IMPORTADO
import { Monitoramento } from './pages/app/dashboard/monitoramento'; 
import { Sobre } from './pages/auth/sobre';
import { ComoFunciona } from './pages/auth/como-funciona';
import { Contactos } from './pages/auth/contactos';


export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayoutAdmin />, 
    children: [
      { path: '', element: <LocaTechDashboard /> }, 
      { path: 'dashboard', element: <LocaTechDashboard /> },
      { path: 'perfil', element: <PerfilPage /> }, 
      { path: 'detail/:id', element: <DefinicoesDashPage /> },
      { path: 'notificacoes', element: <NotificacoesPage /> }
    ],
  },
  
  // Bloco para Dashboard do Gestor
  {
    path: '/gestor',
    element: <GestorLayout />, 
    children: [
      { path: 'monitoramento', element: <Monitoramento /> },
      { path: 'notificacoes', element: <NotificacoesGestor /> },
      { path: 'perfil', element: <PerfilGestor /> }, 
      { path: 'editar-posto', element: <EditarPosto /> }, // ROTA ADICIONADA
    ],
  },

  {
    path: '/',
    element: <SimpleLayout />, 
    children: [
      { path: 'sobre', element: <Sobre /> }, 
    ],
  },
  {
    path: '/',
    element: <AuthLayoutPacient />, 
    children: [
      { path: 'contactos', element: <Contactos /> },
      { path: 'como-funciona', element: <ComoFunciona /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayoutPacient />, 
    children: [
      { index: true, element: <Home /> }, 
      { path: 'select-type', element: <SelectAccountType /> }, 
      { path: 'sign-up-gestor', element: <SignUpGestor /> },
      { path: 'success', element: <SuccessAccount /> }, 
      { path: 'error', element: <ErrorAccount /> },
    ],
  },
]);