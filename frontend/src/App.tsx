import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Import Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { CollectorDashboard } from './pages/CollectorDashboard';
import { RecyclerDashboard } from './pages/RecyclerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { MunicipalDashboard } from './pages/MunicipalDashboard';
import { ReportWaste } from './pages/ReportWaste';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';

import { useAuth } from './context/AuthContext';

const RootRoute: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'admin': return <Navigate to="/admin" replace />;
      case 'municipal': return <Navigate to="/municipal" replace />;
      case 'collector': return <Navigate to="/collector" replace />;
      case 'recycler': return <Navigate to="/recycler" replace />;
      default: return <Navigate to="/citizen" replace />;
    }
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Private Citizen Routes */}
              <Route 
                path="/citizen" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/report-waste" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <ReportWaste />
                  </ProtectedRoute>
                } 
              />

              {/* Private Collector Routes */}
              <Route 
                path="/collector" 
                element={
                  <ProtectedRoute allowedRoles={['collector']}>
                    <CollectorDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Private Recycler Routes */}
              <Route 
                path="/recycler" 
                element={
                  <ProtectedRoute allowedRoles={['recycler']}>
                    <RecyclerDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Private Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Private Municipal Routes */}
              <Route 
                path="/municipal" 
                element={
                  <ProtectedRoute allowedRoles={['municipal']}>
                    <MunicipalDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Shared Private Routes */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/leaderboard" 
                element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
