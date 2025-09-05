import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileType
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { dashboardService, reportService } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const [selectedReport, setSelectedReport] = useState('dashboard');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Obtener datos del dashboard
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard', selectedPeriod],
    queryFn: () => dashboardService.getMain({ periodo: selectedPeriod })
  });

  // Obtener gráficos
  const { data: chartsData, isLoading: chartsLoading, error: chartsError } = useQuery({
    queryKey: ['charts', selectedPeriod],
    queryFn: async () => {
      // Obtener datos de diferentes tipos de gráficos
      const [ingresosData, gastosData, citasData, pacientesData] = await Promise.all([
        dashboardService.getCharts({ tipo: 'ingresos', periodo: selectedPeriod }),
        dashboardService.getCharts({ tipo: 'gastos', periodo: selectedPeriod }),
        dashboardService.getCharts({ tipo: 'citas', periodo: selectedPeriod }),
        dashboardService.getCharts({ tipo: 'pacientes', periodo: selectedPeriod })
      ]);

      return {
        ingresos: ingresosData.data,
        gastos: gastosData.data,
        citas: citasData.data,
        pacientes: pacientesData.data
      };
    }
  });

  // Mutaciones para descargar reportes
  const downloadFinancialReport = useMutation({
    mutationFn: (params) => reportService.downloadFinancialReport(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-financiero-${selectedPeriod}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Reporte financiero descargado exitosamente');
    },
    onError: () => {
      toast.error('Error al descargar el reporte financiero');
    }
  });

  const downloadAppointmentsReport = useMutation({
    mutationFn: (params) => reportService.downloadAppointmentsReport(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-citas-${selectedPeriod}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Reporte de citas descargado exitosamente');
    },
    onError: () => {
      toast.error('Error al descargar el reporte de citas');
    }
  });

  const downloadPatientsReport = useMutation({
    mutationFn: () => reportService.downloadPatientsReport(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reporte-pacientes.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Reporte de pacientes descargado exitosamente');
    },
    onError: () => {
      toast.error('Error al descargar el reporte de pacientes');
    }
  });

  const downloadCompleteReport = useMutation({
    mutationFn: (params) => reportService.downloadCompleteReport(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-completo-${selectedPeriod}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Reporte completo descargado exitosamente');
    },
    onError: () => {
      toast.error('Error al descargar el reporte completo');
    }
  });

  // Colores para gráficos
  const colors = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    gray: '#6B7280'
  };

  // Preparar datos para gráficos
  const prepareChartData = () => {
    if (!chartsData) return {};

    // Procesar datos de ingresos
    const ingresosPorFecha = chartsData.ingresos?.datos || [];
    const totalIngresos = ingresosPorFecha.reduce((sum, item) => sum + (item.valor || 0), 0);

    // Procesar datos de gastos
    const gastosPorFecha = chartsData.gastos?.datos || [];
    const totalGastos = gastosPorFecha.reduce((sum, item) => sum + (item.valor || 0), 0);

    // Procesar datos de citas
    const citasPorFecha = chartsData.citas?.datos || [];
    const citasPorEstado = {};
    citasPorFecha.forEach(item => {
      if (item.estado) {
        citasPorEstado[item.estado] = (citasPorEstado[item.estado] || 0) + (item.valor || 0);
      }
    });

    // Procesar datos de pacientes
    const pacientesPorFecha = chartsData.pacientes?.datos || [];
    const totalPacientes = pacientesPorFecha.reduce((sum, item) => sum + (item.valor || 0), 0);

    return {
      // Datos para gráfico de ingresos vs gastos
      incomeVsExpenses: [
        { name: 'Ingresos', value: totalIngresos, color: colors.success },
        { name: 'Gastos', value: totalGastos, color: colors.danger }
      ],
      
      // Datos para gráfico de citas por estado
      appointmentsByStatus: Object.entries(citasPorEstado).map(([estado, cantidad]) => ({
        name: estado,
        value: cantidad,
        color: estado === 'completada' ? colors.success : 
               estado === 'programada' ? colors.primary : 
               estado === 'cancelada' ? colors.danger : colors.warning
      })),
      
      // Datos para gráfico de tendencia temporal
      temporalTrend: {
        ingresos: ingresosPorFecha.map(item => ({
          fecha: item.fecha,
          valor: item.valor || 0
        })),
        gastos: gastosPorFecha.map(item => ({
          fecha: item.fecha,
          valor: item.valor || 0
        })),
        citas: citasPorFecha.map(item => ({
          fecha: item.fecha,
          valor: item.valor || 0,
          estado: item.estado
        })),
        pacientes: pacientesPorFecha.map(item => ({
          fecha: item.fecha,
          valor: item.valor || 0
        }))
      },
      
      // Resumen general
      summary: {
        totalIngresos,
        totalGastos,
        ganancia: totalIngresos - totalGastos,
        totalCitas: Object.values(citasPorEstado).reduce((sum, val) => sum + val, 0),
        totalPacientes
      }
    };
  };

  const chartData = prepareChartData();

  // Manejar descarga de reportes
  const handleDownloadReport = (reportType) => {
    const params = {
      periodo: selectedPeriod,
      ...(customDateRange.startDate && customDateRange.endDate && {
        fechaInicio: customDateRange.startDate,
        fechaFin: customDateRange.endDate
      })
    };

    switch (reportType) {
      case 'financial':
        downloadFinancialReport.mutate(params);
        break;
      case 'appointments':
        downloadAppointmentsReport.mutate(params);
        break;
      case 'patients':
        downloadPatientsReport.mutate();
        break;
      case 'complete':
        downloadCompleteReport.mutate(params);
        break;
      default:
        break;
    }
  };

  if (dashboardLoading || chartsLoading) return <LoadingSpinner size="xl" />;
  if (dashboardError || chartsError) return <div className="text-red-600">Error al cargar datos: {dashboardError?.message || chartsError?.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600">Genera reportes detallados y visualiza estadísticas de tu consulta</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Análisis
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input"
              >
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mes</option>
                <option value="trimestre">Este Trimestre</option>
                <option value="año">Este Año</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>
            
            {selectedPeriod === 'personalizado' && (
              <div className="flex gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botones de descarga de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleDownloadReport('financial')}
          disabled={downloadFinancialReport.isPending}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="card-content text-center">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Reporte Financiero</h3>
            <p className="text-sm text-gray-600">Ingresos, gastos y balance</p>
            {downloadFinancialReport.isPending && <LoadingSpinner size="sm" className="mt-2" />}
          </div>
        </button>

        <button
          onClick={() => handleDownloadReport('appointments')}
          disabled={downloadAppointmentsReport.isPending}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="card-content text-center">
            <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Reporte de Citas</h3>
            <p className="text-sm text-gray-600">Agenda y asistencia</p>
            {downloadAppointmentsReport.isPending && <LoadingSpinner size="sm" className="mt-2" />}
          </div>
        </button>

        <button
          onClick={() => handleDownloadReport('patients')}
          disabled={downloadPatientsReport.isPending}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="card-content text-center">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-3">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Reporte de Pacientes</h3>
            <p className="text-sm text-gray-600">Base de datos completa</p>
            {downloadPatientsReport.isPending && <LoadingSpinner size="sm" className="mt-2" />}
          </div>
        </button>

        <button
          onClick={() => handleDownloadReport('complete')}
          disabled={downloadCompleteReport.isPending}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="card-content text-center">
            <div className="p-3 bg-indigo-100 rounded-lg w-fit mx-auto mb-3">
              <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Reporte Completo</h3>
            <p className="text-sm text-gray-600">Todos los datos integrados</p>
            {downloadCompleteReport.isPending && <LoadingSpinner size="sm" className="mt-2" />}
          </div>
        </button>
      </div>

      {/* Resumen de métricas */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${dashboardData.ingresosTotales?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-danger-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gastos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${dashboardData.gastosTotales?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Balance Neto</p>
                  <p className={`text-2xl font-bold ${(dashboardData.balanceNeto || 0) >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    ${dashboardData.balanceNeto?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Users className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pacientes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.pacientesActivos || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ingresos vs Gastos */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Ingresos vs Gastos</h3>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="value" fill={colors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Citas por Estado */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Citas por Estado</h3>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={chartData.appointmentsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.appointmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Tendencia Mensual */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tendencia Mensual</h3>
          </div>
          <div className="card-content">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.temporalTrend.ingresos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke={colors.success} name="Ingresos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Ingresos por Categoría */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Ingresos por Categoría</h3>
          </div>
          <div className="card-content">
            <div className="text-center py-8">
              <p className="text-gray-600">Los datos de ingresos por categoría se obtienen del dashboard principal</p>
              <p className="text-sm text-gray-500">Total ingresos: ${chartData.summary?.totalIngresos?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de resumen detallado */}
      {dashboardData && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Resumen Detallado</h3>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Métrica</th>
                    <th className="table-header-cell">Valor</th>
                    <th className="table-header-cell">Comparación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table-row">
                    <td className="table-cell font-medium">Total de Citas</td>
                    <td className="table-cell">{dashboardData.totalCitas || 0}</td>
                    <td className="table-cell">
                      <span className="text-success-600">+{dashboardData.citasCompletadas || 0} completadas</span>
                    </td>
                  </tr>
                  <tr className="table-row">
                    <td className="table-cell font-medium">Pacientes Nuevos</td>
                    <td className="table-cell">{dashboardData.pacientesNuevos || 0}</td>
                    <td className="table-cell">
                      <span className="text-primary-600">+{dashboardData.crecimientoPacientes || 0}% vs período anterior</span>
                    </td>
                  </tr>
                  <tr className="table-row">
                    <td className="table-cell font-medium">Tasa de Asistencia</td>
                    <td className="table-cell">{dashboardData.tasaAsistencia || 0}%</td>
                    <td className="table-cell">
                      <span className="text-success-600">+{dashboardData.mejoraAsistencia || 0}% vs período anterior</span>
                    </td>
                  </tr>
                  <tr className="table-row">
                    <td className="table-cell font-medium">Ingreso Promedio por Cita</td>
                    <td className="table-cell">${dashboardData.ingresoPromedioCita?.toLocaleString() || '0'}</td>
                    <td className="table-cell">
                      <span className="text-success-600">+{dashboardData.crecimientoIngresoPromedio || 0}% vs período anterior</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 