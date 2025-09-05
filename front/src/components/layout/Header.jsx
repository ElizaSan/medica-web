import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ title, user, onMenuClick }) => {
  const { logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Lado izquierdo */}
        <div className="flex items-center">
          {/* Botón de menú para móviles */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Título de la página */}
          <h1 className="ml-4 lg:ml-0 text-2xl font-semibold text-gray-900">
            {title}
          </h1>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center space-x-4">
          {/* Barra de búsqueda */}
          <div className="hidden md:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Notificaciones */}
          <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-danger-500 rounded-full"></span>
          </button>

          {/* Perfil del usuario */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                Dr. {user?.nombre} {user?.apellido}
              </p>
              <p className="text-xs text-gray-500">{user?.especialidad}</p>
            </div>
            
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 