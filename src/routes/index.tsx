import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import AuthLayout from '../layouts/AuthLayout';
import Home from '../pages/Home';
import Listings from '../pages/Listings';
import HouseboatDetails from '../pages/HouseboatDetails';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import PendingApproval from '../pages/PendingApproval';
import AuthCallback from '../pages/AuthCallback';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import GuestRoute from '../components/GuestRoute';

// Host Portal Imports
import HostLayout from '../layouts/HostLayout';
import HostRegister from '../pages/host/HostRegister';
import VesselOnboarding from '../pages/host/VesselOnboarding';
import HostDashboard from '../pages/host/HostDashboard';

// Admin Portal Imports
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';

export const router = createBrowserRouter([
  // 1. Customer Booking Journey & Public Routes
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'search',
        element: <Listings />,
      },
      {
        path: 'houseboat/:id',
        element: <HouseboatDetails />,
      },
      // Email Verification
      {
        path: 'verify-email',
        element: <VerifyEmail />,
      },
      // Pending Approval Page
      {
        path: 'pending-approval',
        element: <PendingApproval />,
      },
      // Host Registration & Listing Wizard (Requires HOST role verification)
      {
        path: 'host/register',
        element: (
          <ProtectedRoute allowedRoles={['HOST']}>
            <HostRegister />
          </ProtectedRoute>
        ),
      },
      {
        path: 'host/onboarding',
        element: (
          <ProtectedRoute allowedRoles={['HOST']}>
            <VesselOnboarding />
          </ProtectedRoute>
        ),
      },
      // 2. Protected Customer Routes
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // 3. Host Portal Dashboard Layout
  {
    path: 'host',
    element: (
      <ProtectedRoute allowedRoles={['HOST']}>
        <HostLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <HostDashboard />,
      },
    ],
  },
  // 4. Admin Portal Dashboard Layout
  {
    path: 'admin',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <AdminDashboard />,
      },
    ],
  },
  // 5. User Credentials Portals (AuthLayout + GuestRoute guards)
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <GuestRoute>
            <Login />
          </GuestRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestRoute>
            <Register />
          </GuestRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        ),
      },
    ],
  },
  // Google OAuth callback landing route
  {
    path: 'auth/callback',
    element: <AuthCallback />,
  },
  // 6. Catch-all / 404 Route
  {
    path: '*',
    element: <NotFound />,
  },
]);
