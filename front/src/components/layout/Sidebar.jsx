import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  BarChart3,
  User,
  X,
  Stethoscope,
} from 'lucide-react';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Vista general del sistema',
    },
    {
      name: 'Pacientes',
      href: '/patients',
      icon: Users,
      description: 'Gestión de pacientes',
    },
    {
      name: 'Citas',
      href: '/appointments',
      icon: Calendar,
      description: 'Programación de citas',
    },
    {
      name: 'Gastos',
      href: '/expenses',
      icon: DollarSign,
      description: 'Control de gastos',
    },
    {
      name: 'Ingresos',
      href: '/income',
      icon: TrendingUp,
      description: 'Registro de ingresos',
    },
    {
      name: 'Recetas',
      href: '/prescriptions',
      icon: FileText,
      description: 'Gestión de recetas',
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: BarChart3,
      description: 'Generación de reportes',
    },
    {
      name: 'Perfil',
      href: '/profile',
      icon: User,
      description: 'Configuración de perfil',
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-lg">
      {/* Header del sidebar */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Sistema Médico</h1>
            <p className="text-xs text-gray-500">Gestión Integral</p>
          </div>
        </div>
        
        {/* Botón de cerrar para móviles */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Información del usuario */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              Dr. {user?.nombre} {user?.apellido}
            </p>
            <p className="text-xs text-gray-500">{user?.especialidad}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
              title={item.description}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  location.pathname === item.href
                    ? 'text-primary-600'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
        >
          <svg
            className="mr-3 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 