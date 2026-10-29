import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventario from './pages/Inventario';
import Clientes from './pages/Clientes';
import CuentasPorCobrar from './pages/CuentasPorCobrar';
import ReportesCxC from './pages/ReportesCxC';
import Proveedores from './pages/Proveedores';
import OrdenesCompra from './pages/OrdenesCompra';
import TasaCambio from './pages/TasaCambio';
import Usuarios from './pages/Usuarios';
import HistorialFacturas from './pages/HistorialFacturas';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import LibroDiario from './pages/contabilidad/LibroDiario';
import LibroMayor from './pages/contabilidad/LibroMayor';

function AppRoutes() {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando ARLUC...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user && profile ? <Navigate to="/dashboard" /> : <Login />} />
      
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/cuentas-por-cobrar" element={<CuentasPorCobrar />} />
        <Route path="/cuentas-por-cobrar/reportes" element={<ReportesCxC />} />
        
        {/* Admin-only routes */}
        <Route path="/reportes" element={
          <ProtectedRoute requiereAdmin><Reportes /></ProtectedRoute>
        } />
        <Route path="/inventario" element={
          <ProtectedRoute requiereAdmin><Inventario /></ProtectedRoute>
        } />
        <Route path="/proveedores" element={
          <ProtectedRoute requiereAdmin><Proveedores /></ProtectedRoute>
        } />
        <Route path="/ordenes-compra" element={
          <ProtectedRoute requiereAdmin><OrdenesCompra /></ProtectedRoute>
        } />
        <Route path="/tasa-cambio" element={
          <ProtectedRoute requiereAdmin><TasaCambio /></ProtectedRoute>
        } />
        <Route path="/contabilidad/libro-diario" element={
          <ProtectedRoute requiereAdmin><LibroDiario /></ProtectedRoute>
        } />
        <Route path="/contabilidad/libro-mayor" element={
          <ProtectedRoute requiereAdmin><LibroMayor /></ProtectedRoute>
        } />
        <Route path="/usuarios" element={
          <ProtectedRoute requiereAdmin><Usuarios /></ProtectedRoute>
        } />
        <Route path="/historial" element={
          <ProtectedRoute requiereAdmin><HistorialFacturas /></ProtectedRoute>
        } />
        <Route path="/configuracion" element={
          <ProtectedRoute requiereAdmin><Configuracion /></ProtectedRoute>
        } />
      </Route>


      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--card-shadow)',
              },
              success: { iconTheme: { primary: '#22C55E', secondary: 'var(--bg-elevated)' } },
              error: { iconTheme: { primary: '#EF4444', secondary: 'var(--bg-elevated)' } },
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
