import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Robots } from './pages/Robots';
import { RobotDetails } from './pages/RobotDetails';
import { Predictions } from './pages/Predictions';
import { Maintenance } from './pages/Maintenance';
import { ErrorLogs } from './pages/ErrorLogs';
import { Analytics } from './pages/Analytics';
import { Users } from './pages/Users';
import { LoadingSpinner } from './components/common/Modal';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Initializing ROBOCARE session..." size="lg" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const GuestRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Checking session..." size="md" />
      </div>
    );
  }
  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="robots" element={<Robots />} />
        <Route path="robots/:id" element={<RobotDetails />} />
        <Route path="predictions" element={<Predictions />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="errors" element={<ErrorLogs />} />
        <Route path="analytics" element={<Analytics />} />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
