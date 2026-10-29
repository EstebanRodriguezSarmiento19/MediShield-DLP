import {createBrowserRouter,Navigate,Outlet} from 'react-router-dom';
import MainLayout from '../shared/components/layout/MainLayout.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';
import ConfirmRegistrationPage from '../features/auth/ConfirmRegistrationPage.jsx';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../features/auth/ResetPasswordPage.jsx';
import UsersPage from '../features/users/UsersPage.jsx';
import {AuthProvider,ProtectedRoute} from '../features/auth/AuthContext.jsx';
import DashboardPage from '../features/dashboard/DashboardPage.jsx';
import TransfersPage from '../features/transfers/TransfersPage.jsx';
import AlertsPage from '../features/alerts/AlertsPage.jsx';
import AuditPage from '../features/audit/AuditPage.jsx';
import RecipientsPage from '../features/recipients/RecipientsPage.jsx';
import RulesPage from '../features/rules/RulesPage.jsx';
import SecurityValidationPage from '../features/security/SecurityValidationPage.jsx';
import ProfilePage from '../features/profile/ProfilePage.jsx';
import PreferencesPage from '../features/preferences/PreferencesPage.jsx';
import RolesPage from '../features/roles/RolesPage.jsx';
import RouteErrorPage from '../shared/components/RouteErrorPage.jsx';

// Cada sección exige un permiso del catálogo; el servidor aplica la misma regla en cada endpoint.
export default createBrowserRouter([{element:<AuthProvider><Outlet/></AuthProvider>,errorElement:<RouteErrorPage/>,children:[
 {path:'/login',element:<LoginPage/>},
 {path:'/register',element:<RegisterPage/>},
 {path:'/register/confirm',element:<ConfirmRegistrationPage/>},
 {path:'/forgot-password',element:<ForgotPasswordPage/>},
 {path:'/reset-password',element:<ResetPasswordPage/>},
 {element:<ProtectedRoute/>,children:[{path:'/',element:<MainLayout/>,children:[
  {index:true,element:<Navigate to="/dashboard" replace/>},
  {path:'dashboard',element:<DashboardPage/>},{path:'recipients',element:<RecipientsPage/>},
  {path:'profile',element:<ProfilePage/>},{path:'preferences',element:<PreferencesPage/>},{path:'settings',element:<Navigate to="/profile" replace/>},
  {element:<ProtectedRoute roles={['admin']}/>,children:[{path:'admin/roles',element:<RolesPage/>}]},
  {element:<ProtectedRoute permission="usuarios.gestionar"/>,children:[{path:'users',element:<UsersPage/>}]},
  {element:<ProtectedRoute permission="transferencias.enviar"/>,children:[{path:'transfers',element:<TransfersPage/>}]},
  {element:<ProtectedRoute permission="alertas.ver"/>,children:[{path:'alerts',element:<AlertsPage/>}]},
  {element:<ProtectedRoute permission="auditoria.ver"/>,children:[{path:'audit',element:<AuditPage/>}]},
  {element:<ProtectedRoute permission="reglas.ver"/>,children:[{path:'rules',element:<RulesPage/>}]},
  {element:<ProtectedRoute permission="seguridad.ver"/>,children:[{path:'security-validation',element:<SecurityValidationPage/>}]}
 ]}]},
 {path:'*',element:<Navigate to="/dashboard" replace/>}
]}]);
