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
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { appointmentService, patientService } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();

  // Obtener citas
  const { data: appointmentsResponse, isLoading, error } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentService.getAll
  });

  // Debug: Log de la respuesta
  console.log('appointmentsResponse:', appointmentsResponse);

  // Asegurar que appointments sea siempre un array
  const appointments = appointmentsResponse?.data?.citas || 
                      appointmentsResponse?.citas || 
                      (Array.isArray(appointmentsResponse) ? appointmentsResponse : []);

  // Debug: Log del array de citas
  console.log('appointments array:', appointments);

  // Obtener pacientes para el formulario
  const { data: patientsResponse } = useQuery({
    queryKey: ['patients'],
    queryFn: patientService.getAll
  });

  // Asegurar que patients sea siempre un array
  const patients = patientsResponse?.data?.pacientes || 
                   patientsResponse?.pacientes || 
                   (Array.isArray(patientsResponse) ? patientsResponse : []);

  // Crear cita
  const createMutation = useMutation({
    mutationFn: appointmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Cita creada exitosamente');
      setShowModal(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear cita');
    }
  });

  // Actualizar cita
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Cita actualizada exitosamente');
      setShowModal(false);
      setEditingAppointment(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar cita');
    }
  });

  // Eliminar cita
  const deleteMutation = useMutation({
    mutationFn: appointmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Cita eliminada exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar cita');
    }
  });

  // Filtrar citas
  const filteredAppointments = (Array.isArray(appointments) ? appointments : []).filter(appointment => {
    const patient = patients.find(p => p.id === appointment.pacienteId);
    const matchesSearch = patient && (
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.motivo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = filterStatus === 'all' || appointment.estado === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Obtener citas del día seleccionado
  const appointmentsForSelectedDate = filteredAppointments.filter(appointment => {
    const appointmentDate = new Date(appointment.fecha);
    return appointmentDate.toDateString() === selectedDate.toDateString();
  });

  // Manejar envío del formulario
  const onSubmit = (data) => {
    const appointmentData = {
      ...data,
      fecha: `${data.fecha}T${data.hora}:00.000Z`
    };
    
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data: appointmentData });
    } else {
      createMutation.mutate(appointmentData);
    }
  };

  // Abrir modal para editar
  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    const [date, time] = appointment.fecha.split('T');
    reset({
      ...appointment,
      fecha: date,
      hora: time.substring(0, 5)
    });
    setShowModal(true);
  };

  // Abrir modal para ver detalles
  const handleView = (appointment) => {
    setViewingAppointment(appointment);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
    setViewingAppointment(null);
    reset();
  };

  // Confirmar eliminación
  const handleDelete = (appointmentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      deleteMutation.mutate(appointmentId);
    }
  };

  // Navegar fechas
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Obtener estado de la cita
  const getAppointmentStatus = (appointment) => {
    const now = new Date();
    const appointmentDate = new Date(appointment.fecha);
    
    if (appointment.estado === 'cancelada') return 'cancelada';
    if (appointment.estado === 'completada') return 'completada';
    if (appointmentDate < now) return 'vencida';
    if (appointmentDate.toDateString() === now.toDateString()) return 'hoy';
    return 'programada';
  };

  // Obtener icono de estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completada':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'cancelada':
        return <XCircle className="h-4 w-4 text-danger-600" />;
      case 'vencida':
        return <AlertCircle className="h-4 w-4 text-warning-600" />;
      case 'hoy':
        return <Clock className="h-4 w-4 text-primary-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) return <LoadingSpinner size="xl" />;
  if (error) return <div className="text-red-600">Error al cargar citas: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Citas</h1>
          <p className="text-gray-600">Administra tu agenda y programación de citas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="btn-secondary"
          >
            {viewMode === 'list' ? 'Vista Calendario' : 'Vista Lista'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Cita
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
                  placeholder="Buscar citas por paciente o motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="all">Todos los estados</option>
                <option value="programada">Programada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
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
              <div className="p-2 bg-primary-100 rounded-lg">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Citas</p>
                <p className="text-2xl font-bold text-gray-900">{(Array.isArray(appointments) ? appointments : []).length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(Array.isArray(appointments) ? appointments : []).filter(a => a.estado === 'completada').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(Array.isArray(appointments) ? appointments : []).filter(a => {
                    const appointmentDate = new Date(a.fecha);
                    return appointmentDate.toDateString() === new Date().toDateString();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger-100 rounded-lg">
                <XCircle className="h-6 w-6 text-danger-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Canceladas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(Array.isArray(appointments) ? appointments : []).filter(a => a.estado === 'cancelada').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vista de calendario diario */}
      {viewMode === 'calendar' && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Agenda del Día</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-lg font-medium">
                  {selectedDate.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                <button
                  onClick={goToNextDay}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {appointmentsForSelectedDate.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay citas programadas para este día</p>
                </div>
              ) : (
                appointmentsForSelectedDate
                  .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                  .map((appointment) => {
                    const patient = patients?.find(p => p.id === appointment.pacienteId);
                    const status = getAppointmentStatus(appointment);
                    
                    return (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(status)}
                            <div>
                              <p className="font-medium text-gray-900">
                                {patient ? `${patient.nombre} ${patient.apellido}` : 'Paciente no encontrado'}
                              </p>
                              <p className="text-sm text-gray-600">{appointment.motivo}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {new Date(appointment.fecha).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            <span className={`badge ${
                              status === 'completada' ? 'badge-success' :
                              status === 'cancelada' ? 'badge-danger' :
                              status === 'vencida' ? 'badge-warning' :
                              'badge-primary'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={() => handleView(appointment)}
                            className="btn-sm btn-outline"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="btn-sm btn-primary"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
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
                    <th className="table-header-cell">Paciente</th>
                    <th className="table-header-cell">Fecha y Hora</th>
                    <th className="table-header-cell">Motivo</th>
                    <th className="table-header-cell">Estado</th>
                    <th className="table-header-cell">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.pacienteId);
                    const status = getAppointmentStatus(appointment);
                    
                    return (
                      <tr key={appointment.id} className="table-row">
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient ? `${patient.nombre} ${patient.apellido}` : 'Paciente no encontrado'}
                            </p>
                            <p className="text-sm text-gray-600">{patient?.email}</p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(appointment.fecha).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.fecha).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <p className="text-gray-900">{appointment.motivo}</p>
                          {appointment.notas && (
                            <p className="text-sm text-gray-600">{appointment.notas}</p>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <span className={`badge ${
                              status === 'completada' ? 'badge-success' :
                              status === 'cancelada' ? 'badge-danger' :
                              status === 'vencida' ? 'badge-warning' :
                              'badge-primary'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(appointment)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(appointment)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(appointment.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredAppointments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron citas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear/editar cita */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Hora *
                    </label>
                    <input
                      type="time"
                      {...register('hora', { required: 'La hora es requerida' })}
                      className="input"
                    />
                    {errors.hora && (
                      <p className="text-red-600 text-sm mt-1">{errors.hora.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo *
                  </label>
                  <input
                    type="text"
                    {...register('motivo', { required: 'El motivo es requerido' })}
                    className="input"
                    placeholder="Motivo de la consulta"
                  />
                  {errors.motivo && (
                    <p className="text-red-600 text-sm mt-1">{errors.motivo.message}</p>
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
                    placeholder="Notas adicionales sobre la cita"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select {...register('estado')} className="input">
                    <option value="programada">Programada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cita Asociada
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
                      editingAppointment ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de la cita */}
      {viewingAppointment && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Detalles de la Cita</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paciente</label>
                    <p className="text-gray-900">
                      {(() => {
                        const patient = patients?.find(p => p.id === viewingAppointment.pacienteId);
                        return patient ? `${patient.nombre} ${patient.apellido}` : 'Paciente no encontrado';
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Cita</label>
                    <p className="text-gray-900">{viewingAppointment.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <p className="text-gray-900">
                      {new Date(viewingAppointment.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hora</label>
                    <p className="text-gray-900">
                      {new Date(viewingAppointment.fecha).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Motivo</label>
                  <p className="text-gray-900">{viewingAppointment.motivo}</p>
                </div>

                {viewingAppointment.notas && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas</label>
                    <p className="text-gray-900">{viewingAppointment.notas}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`badge ${
                    viewingAppointment.estado === 'completada' ? 'badge-success' :
                    viewingAppointment.estado === 'cancelada' ? 'badge-danger' :
                    'badge-primary'
                  }`}>
                    {viewingAppointment.estado}
                  </span>
                </div>

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

export default Appointments; 