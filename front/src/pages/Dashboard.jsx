import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getMain({ periodo: 'mes' }),
    refetchInterval: 300000, // Refrescar cada 5 minutos
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: dashboardService.getAlerts
  });

  if (isLoading) {
    return <LoadingSpinner size="xl" className="h-64" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-danger-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error al cargar el dashboard
        </h3>
        <p className="text-gray-600">
          No se pudieron cargar los datos. Inténtalo de nuevo más tarde.
        </p>
      </div>
    );
  }

  const data = dashboardData?.data || {};

  const stats = [
    {
      name: 'Pacientes',
      value: data.metricas.totalPacientes || 0,
      change: data.metricas.nuevosPacientes || 0,
      changeType: 'increase',
      icon: Users,
      color: 'primary',
    },
    {
      name: 'Citas Hoy',
      value: data.metricas.citasHoy || 0,
      change: data.metricas.citasPendientes || 0,
      changeType: 'pending',
      icon: Calendar,
      color: 'warning',
    },
    {
      name: 'Ingresos del Mes',
      value: `$${(data.metricas.totalIngresos || 0).toLocaleString()}`,
      change: data.porcentajeIngresos || 0,
      changeType: 'increase',
      icon: TrendingUp,
      color: 'success',
    },
    {
      name: 'Gastos del Mes',
      value: `$${(data.metricas.totalGastos || 0).toLocaleString()}`,
      change: data.porcentajeGastos || 0,
      changeType: 'decrease',
      icon: DollarSign,
      color: 'danger',
    },
  ];

  const recentAppointments = data.proximasCitas || [];
  const alerts = alertsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Título y descripción */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Vista general de tu consultorio médico
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center">
                  {stat.changeType === 'increase' ? (
                    <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                  ) : stat.changeType === 'decrease' ? (
                    <TrendingUp className="h-4 w-4 text-danger-500 mr-1 transform rotate-180" />
                  ) : (
                    <Clock className="h-4 w-4 text-warning-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === 'increase'
                        ? 'text-success-600'
                        : stat.changeType === 'decrease'
                        ? 'text-danger-600'
                        : 'text-warning-600'
                    }`}
                  >
                    {stat.change > 0 ? '+' : ''}
                    {typeof stat.change === 'number' ? `${stat.change}%` : stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximas citas */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Próximas Citas</h3>
              <p className="card-description">
                Citas programadas para hoy y los próximos días
              </p>
            </div>
            <div className="card-content">
              {recentAppointments.length > 0 ? (
                <div className="space-y-4">
                  {recentAppointments.slice(0, 5).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.paciente?.nombre} {appointment.paciente?.apellido}
                          </p>
                          <p className="text-sm text-gray-600">{appointment.motivo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(appointment.fecha).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.hora}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay citas próximas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alertas y notificaciones */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Alertas</h3>
              <p className="card-description">
                Notificaciones importantes del sistema
              </p>
            </div>
            <div className="card-content">
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.tipo === 'warning'
                          ? 'bg-warning-50 border-warning-400'
                          : alert.tipo === 'error'
                          ? 'bg-danger-50 border-danger-400'
                          : 'bg-success-50 border-success-400'
                      }`}
                    >
                      <div className="flex items-start">
                        {alert.tipo === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-warning-500 mr-2 mt-0.5" />
                        ) : alert.tipo === 'error' ? (
                          <AlertTriangle className="h-5 w-5 text-danger-500 mr-2 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-success-500 mr-2 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {alert.titulo}
                          </p>
                          <p className="text-sm text-gray-600">{alert.mensaje}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay alertas pendientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="card-title">Acciones Rápidas</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <button className="w-full btn btn-primary btn-sm">
                  <Users className="h-4 w-4 mr-2" />
                  Nuevo Paciente
                </button>
                <button className="w-full btn btn-secondary btn-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programar Cita
                </button>
                <button className="w-full btn btn-secondary btn-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Crear Receta
                </button>
                <button className="w-full btn btn-secondary btn-sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Registrar Ingreso
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 