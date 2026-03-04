import { createBrowserRouter } from 'react-router-dom';
import { AuthLayoutPacient } from './pages/_layouts/auth';
import { SignUpGestor } from './pages/auth/sign-up';
import { AppLayoutAdmin } from './pages/_layouts/app';
import { Home } from './pages/auth/lading-page';
import { SelectAccountType } from './pages/auth/accountType';
import { SuccessAccount } from './pages/auth/succseeAccount';
import { ErrorAccount } from './pages/auth/errorAccount';
import LocaTechDashboard from './pages/app/dashboard/dasboard';
import NotificacoesPage from './pages/app/dashboard/notificacoes';
import DefinicoesDashPage from './pages/app/dashboard/dasboard-details';
import PerfilPage from './pages/app/dashboard/perfil';


export const router = createBrowserRouter([
{
  path: '/',
  element: <AppLayoutAdmin />, 
  children: [
    {path:'', element:<LocaTechDashboard></LocaTechDashboard>},
    {path:'dashboard', element:<LocaTechDashboard></LocaTechDashboard>},
    {path:'perfil', element:<PerfilPage></PerfilPage>},
    {
  path: '/detail/:id', // O ':' indica que o ID é dinâmico
  element: <DefinicoesDashPage />, 
},
{path:'notificacoes', element:<NotificacoesPage></NotificacoesPage>}
  ],
},
{
    path: '/auth',
    element: <AuthLayoutPacient />, // Layout com fundo de posto e vidro
    children: [
      { index: true, element: <Home /> }, // Use 'index: true' em vez de path: '/'
      { path: 'select-type', element: <SelectAccountType /> }, 
      { path: 'sign-up-gestor', element: <SignUpGestor /> },
      { path: 'success', element: <SuccessAccount /> }, // Imagem 4
      { path: 'error', element: <ErrorAccount /> },     // Imagem 5
    ],
  },
]);