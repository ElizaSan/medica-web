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
  FileText,
  Download,
  Printer,
  Calendar,
  User,
  Pill,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { prescriptionService, patientService, appointmentService } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Prescriptions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();

  // Obtener recetas
  const { data: prescriptionsResponse, isLoading, error } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: prescriptionService.getAll
  });

  // Debug: Log de la respuesta
  console.log('prescriptionsResponse:', prescriptionsResponse);

  // Asegurar que prescriptions sea siempre un array
  const prescriptions = prescriptionsResponse?.data?.recetas || 
                        prescriptionsResponse?.recetas || 
                        (Array.isArray(prescriptionsResponse) ? prescriptionsResponse : []);

  // Debug: Log del array de recetas
  console.log('prescriptions array:', prescriptions);

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

  // Crear receta
  const createMutation = useMutation({
    mutationFn: prescriptionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['prescriptions']);
      toast.success('Receta creada exitosamente');
      setShowModal(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear receta');
    }
  });

  // Actualizar receta
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => prescriptionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prescriptions']);
      toast.success('Receta actualizada exitosamente');
      setShowModal(false);
      setEditingPrescription(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar receta');
    }
  });

  // Eliminar receta
  const deleteMutation = useMutation({
    mutationFn: prescriptionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['prescriptions']);
      toast.success('Receta eliminada exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar receta');
    }
  });

  // Descargar PDF
  const downloadPDFMutation = useMutation({
    mutationFn: prescriptionService.downloadPDF,
    onSuccess: (blob, prescriptionId) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receta-${prescriptionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al descargar el PDF');
    }
  });

  // Filtrar recetas
  const filteredPrescriptions = (Array.isArray(prescriptions) ? prescriptions : []).filter(prescription => {
    const patient = patients.find(p => p.id === prescription.pacienteId);
    const matchesSearch = patient && (
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnostico.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = filterStatus === 'all' || prescription.estado === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calcular estadísticas
  const totalPrescriptions = filteredPrescriptions.length;
  const activePrescriptions = filteredPrescriptions.filter(p => p.estado === 'activa').length;
  const expiredPrescriptions = filteredPrescriptions.filter(p => {
    const expirationDate = new Date(p.fechaVencimiento);
    return expirationDate < new Date();
  }).length;

  // Manejar envío del formulario
  const onSubmit = (data) => {
    if (editingPrescription) {
      updateMutation.mutate({ id: editingPrescription.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Abrir modal para editar
  const handleEdit = (prescription) => {
    setEditingPrescription(prescription);
    reset(prescription);
    setShowModal(true);
  };

  // Abrir modal para ver detalles
  const handleView = (prescription) => {
    setViewingPrescription(prescription);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPrescription(null);
    setViewingPrescription(null);
    reset();
  };

  // Confirmar eliminación
  const handleDelete = (prescriptionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
      deleteMutation.mutate(prescriptionId);
    }
  };

  // Descargar PDF
  const handleDownloadPDF = (prescriptionId) => {
    downloadPDFMutation.mutate(prescriptionId);
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

  // Verificar si la receta está vencida
  const isExpired = (fechaVencimiento) => {
    return new Date(fechaVencimiento) < new Date();
  };

  // Obtener estado de la receta
  const getPrescriptionStatus = (prescription) => {
    if (prescription.estado === 'cancelada') return 'cancelada';
    if (isExpired(prescription.fechaVencimiento)) return 'vencida';
    if (prescription.estado === 'activa') return 'activa';
    return 'inactiva';
  };

  // Obtener icono de estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'activa':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'vencida':
        return <AlertCircle className="h-4 w-4 text-warning-600" />;
      case 'cancelada':
        return <AlertCircle className="h-4 w-4 text-danger-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) return <LoadingSpinner size="xl" />;
  if (error) return <div className="text-red-600">Error al cargar recetas: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Recetas</h1>
          <p className="text-gray-600">Crea y administra recetas médicas con generación de PDF</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Receta
        </button>
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
                  placeholder="Buscar recetas por paciente o diagnóstico..."
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
                <option value="activa">Activa</option>
                <option value="vencida">Vencida</option>
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
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Recetas</p>
                <p className="text-2xl font-bold text-gray-900">{totalPrescriptions}</p>
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
                <p className="text-sm text-gray-600">Recetas Activas</p>
                <p className="text-2xl font-bold text-gray-900">{activePrescriptions}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recetas Vencidas</p>
                <p className="text-2xl font-bold text-gray-900">{expiredPrescriptions}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Pill className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Medicamentos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredPrescriptions.reduce((sum, p) => sum + (p.medicamentos?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de recetas */}
      <div className="card">
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Paciente</th>
                  <th className="table-header-cell">Diagnóstico</th>
                  <th className="table-header-cell">Fecha</th>
                  <th className="table-header-cell">Vencimiento</th>
                  <th className="table-header-cell">Estado</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map((prescription) => {
                  const status = getPrescriptionStatus(prescription);
                  
                  return (
                    <tr key={prescription.id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">
                            {getPatientName(prescription.pacienteId)}
                          </p>
                          {prescription.citaId && (
                            <p className="text-sm text-gray-600">
                              {getAppointmentInfo(prescription.citaId)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">{prescription.diagnostico}</p>
                          {prescription.medicamentos && (
                            <p className="text-sm text-gray-600">
                              {prescription.medicamentos.length} medicamento(s)
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm text-gray-900">
                          {new Date(prescription.fecha).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="table-cell">
                        <p className={`text-sm ${isExpired(prescription.fechaVencimiento) ? 'text-red-600' : 'text-gray-900'}`}>
                          {new Date(prescription.fechaVencimiento).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className={`badge ${
                            status === 'activa' ? 'badge-success' :
                            status === 'vencida' ? 'badge-warning' :
                            status === 'cancelada' ? 'badge-danger' :
                            'badge-secondary'
                          }`}>
                            {status}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(prescription)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(prescription.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Descargar PDF"
                            disabled={downloadPDFMutation.isPending}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(prescription)}
                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prescription.id)}
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
          
          {filteredPrescriptions.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron recetas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar receta */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingPrescription ? 'Editar Receta' : 'Nueva Receta'}
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico *
                  </label>
                  <textarea
                    {...register('diagnostico', { required: 'El diagnóstico es requerido' })}
                    rows="3"
                    className="input"
                    placeholder="Diagnóstico del paciente"
                  />
                  {errors.diagnostico && (
                    <p className="text-red-600 text-sm mt-1">{errors.diagnostico.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicamentos *
                  </label>
                  <textarea
                    {...register('medicamentos', { required: 'Los medicamentos son requeridos' })}
                    rows="5"
                    className="input"
                    placeholder="Lista de medicamentos con dosis y frecuencia"
                  />
                  {errors.medicamentos && (
                    <p className="text-red-600 text-sm mt-1">{errors.medicamentos.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Emisión *
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
                      Fecha de Vencimiento *
                    </label>
                    <input
                      type="date"
                      {...register('fechaVencimiento', { required: 'La fecha de vencimiento es requerida' })}
                      className="input"
                    />
                    {errors.fechaVencimiento && (
                      <p className="text-red-600 text-sm mt-1">{errors.fechaVencimiento.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrucciones Adicionales
                  </label>
                  <textarea
                    {...register('instrucciones')}
                    rows="3"
                    className="input"
                    placeholder="Instrucciones adicionales para el paciente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select {...register('estado')} className="input">
                    <option value="activa">Activa</option>
                    <option value="cancelada">Cancelada</option>
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
                      editingPrescription ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de la receta */}
      {viewingPrescription && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Detalles de la Receta</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadPDF(viewingPrescription.id)}
                    className="btn-primary btn-sm flex items-center gap-2"
                    disabled={downloadPDFMutation.isPending}
                  >
                    <Download className="h-4 w-4" />
                    Descargar PDF
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="btn-secondary btn-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Información del paciente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paciente</label>
                    <p className="text-gray-900">{getPatientName(viewingPrescription.pacienteId)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Receta</label>
                    <p className="text-gray-900">{viewingPrescription.id}</p>
                  </div>
                </div>

                {viewingPrescription.citaId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cita Asociada</label>
                    <p className="text-gray-900">{getAppointmentInfo(viewingPrescription.citaId)}</p>
                  </div>
                )}

                {/* Diagnóstico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
                  <p className="text-gray-900">{viewingPrescription.diagnostico}</p>
                </div>

                {/* Medicamentos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medicamentos</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-gray-900 font-sans">
                      {viewingPrescription.medicamentos}
                    </pre>
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Emisión</label>
                    <p className="text-gray-900">
                      {new Date(viewingPrescription.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                    <p className={`${isExpired(viewingPrescription.fechaVencimiento) ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(viewingPrescription.fechaVencimiento).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Instrucciones */}
                {viewingPrescription.instrucciones && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Instrucciones Adicionales</label>
                    <p className="text-gray-900">{viewingPrescription.instrucciones}</p>
                  </div>
                )}

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(getPrescriptionStatus(viewingPrescription))}
                    <span className={`badge ${
                      getPrescriptionStatus(viewingPrescription) === 'activa' ? 'badge-success' :
                      getPrescriptionStatus(viewingPrescription) === 'vencida' ? 'badge-warning' :
                      getPrescriptionStatus(viewingPrescription) === 'cancelada' ? 'badge-danger' :
                      'badge-secondary'
                    }`}>
                      {getPrescriptionStatus(viewingPrescription)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions; 