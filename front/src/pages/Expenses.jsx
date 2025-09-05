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
  TrendingDown,
  Calendar,
  Tag,
  Receipt,
  BarChart3,
  PieChart,
  Download,
  Upload
} from 'lucide-react';
import { expenseService } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'charts'
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Categorías de gastos
  const expenseCategories = [
    { value: 'equipamiento', label: 'Equipamiento Médico', color: 'bg-blue-100 text-blue-800' },
    { value: 'suministros', label: 'Suministros', color: 'bg-green-100 text-green-800' },
    { value: 'personal', label: 'Personal', color: 'bg-purple-100 text-purple-800' },
    { value: 'renta', label: 'Renta/Local', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'servicios', label: 'Servicios Públicos', color: 'bg-red-100 text-red-800' },
    { value: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-800' },
    { value: 'seguros', label: 'Seguros', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'otros', label: 'Otros', color: 'bg-gray-100 text-gray-800' }
  ];

  // Obtener gastos
  const { data: expensesResponse, isLoading, error } = useQuery({
    queryKey: ['expenses'],
    queryFn: expenseService.getAll
  });

  // Debug: Log de la respuesta
  console.log('expensesResponse:', expensesResponse);

  // Asegurar que expenses sea siempre un array
  const expenses = expensesResponse?.data?.gastos || 
                   expensesResponse?.gastos || 
                   (Array.isArray(expensesResponse) ? expensesResponse : []);

  // Debug: Log del array de gastos
  console.log('expenses array:', expenses);

  // Crear gasto
  const createMutation = useMutation({
    mutationFn: expenseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      toast.success('Gasto registrado exitosamente');
      setShowModal(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al registrar gasto');
    }
  });

  // Actualizar gasto
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => expenseService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      toast.success('Gasto actualizado exitosamente');
      setShowModal(false);
      setEditingExpense(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar gasto');
    }
  });

  // Eliminar gasto
  const deleteMutation = useMutation({
    mutationFn: expenseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      toast.success('Gasto eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar gasto');
    }
  });

  // Filtrar gastos
  const filteredExpenses = (Array.isArray(expenses) ? expenses : []).filter(expense => {
    const matchesSearch = expense.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || expense.categoria === filterCategory;
    
    let matchesDateRange = true;
    if (filterDateRange !== 'all') {
      const expenseDate = new Date(expense.fecha);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      switch (filterDateRange) {
        case 'this_month':
          matchesDateRange = expenseDate >= startOfMonth;
          break;
        case 'this_year':
          matchesDateRange = expenseDate >= startOfYear;
          break;
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          matchesDateRange = expenseDate >= lastMonth && expenseDate < thisMonth;
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // Calcular estadísticas
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.monto, 0);
  const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
  
  const expensesByCategory = expenseCategories.map(category => {
    const categoryExpenses = filteredExpenses.filter(expense => expense.categoria === category.value);
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.monto, 0);
    return {
      ...category,
      total,
      count: categoryExpenses.length,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
    };
  }).filter(cat => cat.total > 0);

  // Manejar envío del formulario
  const onSubmit = (data) => {
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Abrir modal para editar
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    reset(expense);
    setShowModal(true);
  };

  // Abrir modal para ver detalles
  const handleView = (expense) => {
    setViewingExpense(expense);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setViewingExpense(null);
    reset();
  };

  // Confirmar eliminación
  const handleDelete = (expenseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      deleteMutation.mutate(expenseId);
    }
  };

  // Obtener color de categoría
  const getCategoryColor = (category) => {
    const cat = expenseCategories.find(c => c.value === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  // Obtener etiqueta de categoría
  const getCategoryLabel = (category) => {
    const cat = expenseCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (isLoading) return <LoadingSpinner size="xl" />;
  if (error) return <div className="text-red-600">Error al cargar gastos: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Gastos</h1>
          <p className="text-gray-600">Controla y categoriza todos los gastos de tu consulta</p>
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
                <Receipt className="h-4 w-4" />
                Ver Lista
              </>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Gasto
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
                  placeholder="Buscar gastos por descripción o categoría..."
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
                {expenseCategories.map(category => (
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
              <div className="p-2 bg-danger-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-danger-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Gastos</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Receipt className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cantidad de Gastos</p>
                <p className="text-2xl font-bold text-gray-900">{filteredExpenses.length}</p>
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
                <p className="text-sm text-gray-600">Promedio por Gasto</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${averageExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <Tag className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categorías Usadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {expensesByCategory.length}
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
              <h3 className="card-title">Gastos por Categoría</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {expensesByCategory.map((category) => (
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
                  const periodExpenses = (Array.isArray(expenses) ? expenses : []).filter(expense => {
                    const expenseDate = new Date(expense.fecha);
                    const now = new Date();
                    
                    if (period === 'this_month') {
                      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      return expenseDate >= startOfMonth;
                    } else {
                      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      return expenseDate >= lastMonth && expenseDate < thisMonth;
                    }
                  });
                  
                  const total = periodExpenses.reduce((sum, expense) => sum + expense.monto, 0);
                  const label = period === 'this_month' ? 'Este Mes' : 'Mes Pasado';
                  
                  return (
                    <div key={period} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{label}</span>
                      <span className="text-lg font-bold text-danger-600">
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
                    <th className="table-header-cell">Categoría</th>
                    <th className="table-header-cell">Monto</th>
                    <th className="table-header-cell">Fecha</th>
                    <th className="table-header-cell">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">{expense.descripcion}</p>
                          {expense.notas && (
                            <p className="text-sm text-gray-600">{expense.notas}</p>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getCategoryColor(expense.categoria)}`}>
                          {getCategoryLabel(expense.categoria)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <p className="font-bold text-danger-600">
                          ${expense.monto.toLocaleString()}
                        </p>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm text-gray-900">
                          {new Date(expense.fecha).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(expense)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
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
            
            {filteredExpenses.length === 0 && (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron gastos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear/editar gasto */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
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
                    placeholder="Descripción del gasto"
                  />
                  {errors.descripcion && (
                    <p className="text-red-600 text-sm mt-1">{errors.descripcion.message}</p>
                  )}
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
                      {expenseCategories.map(category => (
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
                    placeholder="Notas adicionales sobre el gasto"
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
                      editingExpense ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del gasto */}
      {viewingExpense && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Detalles del Gasto</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <p className="text-gray-900">{viewingExpense.descripcion}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID</label>
                    <p className="text-gray-900">{viewingExpense.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <span className={`badge ${getCategoryColor(viewingExpense.categoria)}`}>
                      {getCategoryLabel(viewingExpense.categoria)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto</label>
                    <p className="text-xl font-bold text-danger-600">
                      ${viewingExpense.monto.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha</label>
                  <p className="text-gray-900">
                    {new Date(viewingExpense.fecha).toLocaleDateString()}
                  </p>
                </div>

                {viewingExpense.notas && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas</label>
                    <p className="text-gray-900">{viewingExpense.notas}</p>
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

export default Expenses; 