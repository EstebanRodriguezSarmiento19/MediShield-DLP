import {createBrowserRouter,Navigate,Outlet} from 'react-router-dom';
import MainLayout from '../shared/components/layout/MainLayout.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import {AuthProvider,ProtectedRoute} from '../features/auth/AuthContext.jsx';
import DashboardPage from '../features/dashboard/DashboardPage.jsx';
import TransfersPage from '../features/transfers/TransfersPage.jsx';
import AlertsPage from '../features/alerts/AlertsPage.jsx';
import AuditPage from '../features/audit/AuditPage.jsx';
import RecipientsPage from '../features/recipients/RecipientsPage.jsx';
import RulesPage from '../features/rules/RulesPage.jsx';
import RouteErrorPage from '../shared/components/RouteErrorPage.jsx';
export default createBrowserRouter([{element:<AuthProvider><Outlet/></AuthProvider>,errorElement:<RouteErrorPage/>,children:[
 {path:'/login',element:<LoginPage/>},
 {element:<ProtectedRoute/>,children:[{path:'/',element:<MainLayout/>,children:[
  {index:true,element:<Navigate to="/dashboard" replace/>},
  {path:'dashboard',element:<DashboardPage/>},{path:'recipients',element:<RecipientsPage/>},
  {element:<ProtectedRoute roles={['admin','usuario']}/>,children:[{path:'transfers',element:<TransfersPage/>}]},
  {element:<ProtectedRoute roles={['admin','analista']}/>,children:[
   {path:'alerts',element:<AlertsPage/>},{path:'audit',element:<AuditPage/>},{path:'rules',element:<RulesPage/>}
  ]}
 ]}]},
 {path:'*',element:<Navigate to="/dashboard" replace/>}
]}]);
