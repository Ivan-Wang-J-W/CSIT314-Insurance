/**
 * App root — wires providers, initialises mock data, and declares every route.
 *
 * Architecture (BCE):
 *   src/entity    domain models (plain OO classes)
 *   src/control   controllers + localStorage-backed data store
 *   src/boundary  React components (pages + reusable UI)
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

import { theme } from './boundary/common/theme.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { initDataStore } from './control/dataStore.js';
import { ROLES } from './entity/User.js';

import Layout from './boundary/common/Layout.jsx';
import ProtectedRoute from './boundary/common/ProtectedRoute.jsx';

// Auth
import Login from './boundary/auth/Login.jsx';
import Register from './boundary/auth/Register.jsx';

// Admin
import AdminDashboard from './boundary/admin/AdminDashboard.jsx';
import UserManagement from './boundary/admin/UserManagement.jsx';

// Fundraiser
import FRDashboard from './boundary/fundraiser/FRDashboard.jsx';
import CreateFSA from './boundary/fundraiser/CreateFSA.jsx';
import ManageFSA from './boundary/fundraiser/ManageFSA.jsx';
import FSAAnalytics from './boundary/fundraiser/FSAAnalytics.jsx';
import FRHistory from './boundary/fundraiser/FRHistory.jsx';

// Donee
import DoneeDashboard from './boundary/donee/DoneeDashboard.jsx';
import BrowseFSA from './boundary/donee/BrowseFSA.jsx';
import FSADetail from './boundary/donee/FSADetail.jsx';
import Favorites from './boundary/donee/Favorites.jsx';
import DonationHistory from './boundary/donee/DonationHistory.jsx';

// Platform
import PlatformDashboard from './boundary/platform/PlatformDashboard.jsx';
import CategoryManagement from './boundary/platform/CategoryManagement.jsx';
import Reports from './boundary/platform/Reports.jsx';

// Shared pages
import LandingPage from './boundary/common/LandingPage.jsx';
import ProfilePage from './boundary/common/ProfilePage.jsx';

// Seed mock data at module load so every page has data to render.
initDataStore();

/** Root: show landing page for guests, redirect logged-in users to their dashboard. */
function RootPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LandingPage />;
  const home = {
    [ROLES.ADMIN]: '/admin',
    [ROLES.FUNDRAISER]: '/fundraiser',
    [ROLES.DONEE]: '/donee',
    [ROLES.PLATFORM_MANAGER]: '/platform',
  }[user.role] || '/login';
  return <Navigate to={home} replace />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Authenticated shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Admin */}
                <Route path="/admin" element={
                  <ProtectedRoute roles={[ROLES.ADMIN]}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute roles={[ROLES.ADMIN]}><UserManagement /></ProtectedRoute>
                } />

                {/* Fundraiser */}
                <Route path="/fundraiser" element={
                  <ProtectedRoute roles={[ROLES.FUNDRAISER]}><FRDashboard /></ProtectedRoute>
                } />
                <Route path="/fundraiser/create" element={
                  <ProtectedRoute roles={[ROLES.FUNDRAISER]}><CreateFSA /></ProtectedRoute>
                } />
                <Route path="/fundraiser/manage" element={
                  <ProtectedRoute roles={[ROLES.FUNDRAISER]}><ManageFSA /></ProtectedRoute>
                } />
                <Route path="/fundraiser/analytics" element={
                  <ProtectedRoute roles={[ROLES.FUNDRAISER]}><FSAAnalytics /></ProtectedRoute>
                } />
                <Route path="/fundraiser/history" element={
                  <ProtectedRoute roles={[ROLES.FUNDRAISER]}><FRHistory /></ProtectedRoute>
                } />

                {/* Donee */}
                <Route path="/donee" element={
                  <ProtectedRoute roles={[ROLES.DONEE]}><DoneeDashboard /></ProtectedRoute>
                } />
                <Route path="/donee/browse" element={
                  <ProtectedRoute roles={[ROLES.DONEE]}><BrowseFSA /></ProtectedRoute>
                } />
                <Route path="/donee/favorites" element={
                  <ProtectedRoute roles={[ROLES.DONEE]}><Favorites /></ProtectedRoute>
                } />
                <Route path="/donee/history" element={
                  <ProtectedRoute roles={[ROLES.DONEE]}><DonationHistory /></ProtectedRoute>
                } />

                {/* Platform Manager */}
                <Route path="/platform" element={
                  <ProtectedRoute roles={[ROLES.PLATFORM_MANAGER]}><PlatformDashboard /></ProtectedRoute>
                } />
                <Route path="/platform/categories" element={
                  <ProtectedRoute roles={[ROLES.PLATFORM_MANAGER]}><CategoryManagement /></ProtectedRoute>
                } />
                <Route path="/platform/reports" element={
                  <ProtectedRoute roles={[ROLES.PLATFORM_MANAGER]}><Reports /></ProtectedRoute>
                } />

                {/* Shared: any signed-in user can open an FSA detail or their profile */}
                <Route path="/fsa/:id"  element={<FSADetail />} />
                <Route path="/profile"  element={<ProfilePage />} />
              </Route>

              <Route path="/" element={<RootPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
