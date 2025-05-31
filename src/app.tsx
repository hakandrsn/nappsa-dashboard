import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Home from './pages/Home';
import Categories from './pages/Categories';
import Items from './pages/Items';
import Recommendations from './pages/Recommendations';
import LoginPage from './pages/auth/LoginPage';

// Korumalı rota bileşeni
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
console.log("AppRoutes");
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="categories" element={<Categories />} />
        <Route path="items" element={<Items />} />
        <Route path="recommendations" element={<Recommendations />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <AppRoutes />
    </>
  );
};

export default App;
