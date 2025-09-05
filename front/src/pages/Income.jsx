import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  Tag,
  CreditCard,
  BarChart3,
  PieChart,
  Download,
  Upload,
  User,
  Users
} from 'lucide-react';
import { incomeService, patientService, appointmentService } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Income = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [viewingIncome, setViewingIncome] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'charts'
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Categorías de ingresos
  const incomeCategories = [
    { value: 'consulta', label: 'Consulta Médica', color: 'bg-blue-100 text-blue-800' },
    { value: 'procedimiento', label: 'Procedimiento', color: 'bg-green-100 text-green-800' },
    { value: 'medicamento', label: 'Venta de Medicamentos', color: 'bg-purple-100 text-purple-800' },
    { value: 'laboratorio', label: 'Laboratorio', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'radiologia', label: 'Radiología', color: 'bg-red-100 text-red-800' },
    { value: 'especialidad', label: 'Especialidad', color: 'bg-pink-100 text-pink-800' },
    { value: 'urgencia', label: 'Urgencia', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'otros', label: 'Otros', color: 'bg-gray-100 text-gray-800' }
  ];

  // Obtener ingresos
  const { data: incomesResponse, isLoading, error } = useQuery({
    queryKey: ['incomes'],
    queryFn: incomeService.getAll
  });

  // Debug: Log de la respuesta
  console.log('incomesResponse:', incomesResponse);

  // Asegurar que incomes sea siempre un array
  const incomes = incomesResponse?.data?.ingresos || 
                  incomesResponse?.ingresos || 
                  (Array.isArray(incomesResponse) ? incomesResponse : []);

  // Debug: Log del array de ingresos
  console.log('incomes array:', incomes);

  // Obtener pacientes para el formulario
  const { data: patientsResponse } = useQuery({
    queryKey: ['patients'],
    queryFn: patientService.getAll
  });

  // Asegurar que patients sea siempre un array
  const patients = patientsResponse?.data?.pacientes || 
                   patientsResponse?.pacientes || 
                   (Array.isArray(patientsResponse) ? patientsResponse : []);

  // Obtener citas para el formulario
  const { data: appointmentsResponse } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentService.getAll
  });

  // Asegurar que appointments sea siempre un array
  const appointments = appointmentsResponse?.data?.citas || 
                       appointmentsResponse?.citas || 
                       (Array.isArray(appointmentsResponse) ? appointmentsResponse : []);

  // Crear ingreso
  const createMutation = useMutation({
    mutationFn: incomeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      toast.success('Ingreso registrado exitosamente');
      setShowModal(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al registrar ingreso');
    }
  });

  // Actualizar ingreso
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => incomeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      toast.success('Ingreso actualizado exitosamente');
      setShowModal(false);
      setEditingIncome(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar ingreso');
    }
  });

  // Eliminar ingreso
  const deleteMutation = useMutation({
    mutationFn: incomeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      toast.success('Ingreso eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar ingreso');
    }
  });

  // Filtrar ingresos
  const filteredIncomes = (Array.isArray(incomes) ? incomes : []).filter(income => {
    const matchesSearch = income.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         income.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || income.categoria === filterCategory;
    
    let matchesDateRange = true;
    if (filterDateRange !== 'all') {
      const incomeDate = new Date(income.fecha);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      switch (filterDateRange) {
        case 'this_month':
          matchesDateRange = incomeDate >= startOfMonth;
          break;
        case 'this_year':
          matchesDateRange = incomeDate >= startOfYear;
          break;
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          matchesDateRange = incomeDate >= lastMonth && incomeDate < thisMonth;
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // Calcular estadísticas
  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.monto, 0);
  const averageIncome = filteredIncomes.length > 0 ? totalIncome / filteredIncomes.length : 0;
  
  const incomesByCategory = incomeCategories.map(category => {
    const categoryIncomes = filteredIncomes.filter(income => income.categoria === category.value);
    const total = categoryIncomes.reduce((sum, income) => sum + income.monto, 0);
    return {
      ...category,
      total,
      count: categoryIncomes.length,
      percentage: totalIncome > 0 ? (total / totalIncome) * 100 : 0
    };
  }).filter(cat => cat.total > 0);

  // Manejar envío del formulario
  const onSubmit = (data) => {
    if (editingIncome) {
      updateMutation.mutate({ id: editingIncome.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Abrir modal para editar
  const handleEdit = (income) => {
    setEditingIncome(income);
    reset(income);
    setShowModal(true);
  };

  // Abrir modal para ver detalles
  const handleView = (income) => {
    setViewingIncome(income);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIncome(null);
    setViewingIncome(null);
    reset();
  };

  // Confirmar eliminación
  const handleDelete = (incomeId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
      deleteMutation.mutate(incomeId);
    }
  };

  // Obtener color de categoría
  const getCategoryColor = (category) => {
    const cat = incomeCategories.find(c => c.value === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  // Obtener etiqueta de categoría
  const getCategoryLabel = (category) => {
    const cat = incomeCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  // Obtener nombre del paciente
  const getPatientName = (patientId) => {
    const patient = patients?.find(p => p.id === patientId);
    return patient ? `${patient.nombre} ${patient.apellido}` : 'Paciente no encontrado';
  };

  // Obtener información de la cita
  const getAppointmentInfo = (appointmentId) => {
    const appointment = appointments?.find(a => a.id === appointmentId);
    return appointment ? appointment.motivo : 'Cita no encontrada';
  };

  if (isLoading) return <LoadingSpinner size="xl" />;
  if (error) return <div className="text-red-600">Error al cargar ingresos: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Ingresos</h1>
          <p className="text-gray-600">Controla y categoriza todos los ingresos de tu consulta</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'charts' : 'list')}
            className="btn-secondary"
          >
            {viewMode === 'list' ? (
              <>
                <BarChart3 className="h-4 w-4" />
                Ver Gráficos
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Ver Lista
              </>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar ingresos por descripción o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input"
              >
                <option value="all">Todas las categorías</option>
                {incomeCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="input"
              >
                <option value="all">Todo el período</option>
                <option value="this_month">Este mes</option>
                <option value="last_month">Mes pasado</option>
                <option value="this_year">Este año</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalIncome.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cantidad de Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">{filteredIncomes.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Promedio por Ingreso</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${averageIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pacientes Únicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredIncomes.map(i => i.pacienteId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vista de gráficos */}
      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de categorías */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Ingresos por Categoría</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {incomesByCategory.map((category) => (
                  <div key={category.value} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${category.color.split(' ')[0]}`}></div>
                      <span className="text-sm font-medium">{category.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${category.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen mensual */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Resumen Mensual</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {['this_month', 'last_month'].map((period) => {
                  const periodIncomes = (Array.isArray(incomes) ? incomes : []).filter(income => {
                    const incomeDate = new Date(income.fecha);
                    const now = new Date();
                    
                    if (period === 'this_month') {
                      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      return incomeDate >= startOfMonth;
                    } else {
                      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      return incomeDate >= lastMonth && incomeDate < thisMonth;
                    }
                  });
                  
                  const total = periodIncomes.reduce((sum, income) => sum + income.monto, 0);
                  const label = period === 'this_month' ? 'Este Mes' : 'Mes Pasado';
                  
                  return (
                    <div key={period} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{label}</span>
                      <span className="text-lg font-bold text-success-600">
                        ${total.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de lista */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Descripción</th>
                    <th className="table-header-cell">Paciente</th>
                    <th className="table-header-cell">Categoría</th>
                    <th className="table-header-cell">Monto</th>
                    <th className="table-header-cell">Fecha</th>
                    <th className="table-header-cell">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomes.map((income) => (
                    <tr key={income.id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">{income.descripcion}</p>
                          {income.notas && (
                            <p className="text-sm text-gray-600">{income.notas}</p>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">
                            {getPatientName(income.pacienteId)}
                          </p>
                          {income.citaId && (
                            <p className="text-sm text-gray-600">
                              {getAppointmentInfo(income.citaId)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getCategoryColor(income.categoria)}`}>
                          {getCategoryLabel(income.categoria)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <p className="font-bold text-success-600">
                          ${income.monto.toLocaleString()}
                        </p>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm text-gray-900">
                          {new Date(income.fecha).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(income)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(income)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(income.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredIncomes.length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron ingresos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear/editar ingreso */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    {...register('descripcion', { required: 'La descripción es requerida' })}
                    className="input"
                    placeholder="Descripción del ingreso"
                  />
                  {errors.descripcion && (
                    <p className="text-red-600 text-sm mt-1">{errors.descripcion.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paciente *
                    </label>
                    <select
                      {...register('pacienteId', { required: 'El paciente es requerido' })}
                      className="input"
                    >
                      <option value="">Seleccionar paciente</option>
                      {(Array.isArray(patients) ? patients : []).map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.nombre} {patient.apellido} - {patient.email}
                        </option>
                      ))}
                    </select>
                    {errors.pacienteId && (
                      <p className="text-red-600 text-sm mt-1">{errors.pacienteId.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cita (Opcional)
                    </label>
                    <select {...register('citaId')} className="input">
                      <option value="">Sin cita asociada</option>
                      {(Array.isArray(appointments) ? appointments : []).map(appointment => {
                        const patient = patients.find(p => p.id === appointment.pacienteId);
                        return (
                          <option key={appointment.id} value={appointment.id}>
                            {patient ? `${patient.nombre} ${patient.apellido}` : 'Paciente no encontrado'} - {appointment.motivo}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      {...register('categoria', { required: 'La categoría es requerida' })}
                      className="input"
                    >
                      <option value="">Seleccionar categoría</option>
                      {incomeCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {errors.categoria && (
                      <p className="text-red-600 text-sm mt-1">{errors.categoria.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('monto', { 
                        required: 'El monto es requerido',
                        min: { value: 0, message: 'El monto debe ser mayor a 0' }
                      })}
                      className="input"
                      placeholder="0.00"
                    />
                    {errors.monto && (
                      <p className="text-red-600 text-sm mt-1">{errors.monto.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    {...register('fecha', { required: 'La fecha es requerida' })}
                    className="input"
                  />
                  {errors.fecha && (
                    <p className="text-red-600 text-sm mt-1">{errors.fecha.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    {...register('notas')}
                    rows="3"
                    className="input"
                    placeholder="Notas adicionales sobre el ingreso"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      editingIncome ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del ingreso */}
      {viewingIncome && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Detalles del Ingreso</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <p className="text-gray-900">{viewingIncome.descripcion}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID</label>
                    <p className="text-gray-900">{viewingIncome.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paciente</label>
                    <p className="text-gray-900">{getPatientName(viewingIncome.pacienteId)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <span className={`badge ${getCategoryColor(viewingIncome.categoria)}`}>
                      {getCategoryLabel(viewingIncome.categoria)}
                    </span>
                  </div>
                </div>

                {viewingIncome.citaId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cita Asociada</label>
                    <p className="text-gray-900">{getAppointmentInfo(viewingIncome.citaId)}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto</label>
                    <p className="text-xl font-bold text-success-600">
                      ${viewingIncome.monto.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <p className="text-gray-900">
                      {new Date(viewingIncome.fecha).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {viewingIncome.notas && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas</label>
                    <p className="text-gray-900">{viewingIncome.notas}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="btn-secondary"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income; 