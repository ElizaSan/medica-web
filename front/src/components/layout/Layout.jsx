import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Obtener el título de la página actual
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/patients':
        return 'Pacientes';
      case '/appointments':
        return 'Citas';
      case '/expenses':
        return 'Gastos';
      case '/income':
        return 'Ingresos';
      case '/prescriptions':
        return 'Recetas';
      case '/reports':
        return 'Reportes';
      case '/profile':
        return 'Perfil';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móviles */}
      <div className="lg:hidden">
        <div
          className={`fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header
          title={getPageTitle()}
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Contenido de la página */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 