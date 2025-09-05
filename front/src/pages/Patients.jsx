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
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Users
} from 'lucide-react';
import { patientService } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewingPatient, setViewingPatient] = useState(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Obtener pacientes
  const { data: patientsResponse, isLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn: patientService.getAll
  });

  // Debug: Log de la respuesta
  console.log('patientsResponse:', patientsResponse);

  // Asegurar que patients sea siempre un array
  const patients = patientsResponse?.data?.pacientes || 
                   patientsResponse?.pacientes || 
                   (Array.isArray(patientsResponse) ? patientsResponse : []);

  // Debug: Log del array de pacientes
  console.log('patients array:', patients);

  // Crear paciente
  const createMutation = useMutation({
    mutationFn: patientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['patients']);
      toast.success('Paciente creado exitosamente');
      setShowModal(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear paciente');
    }
  });

  // Actualizar paciente
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => patientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['patients']);
      toast.success('Paciente actualizado exitosamente');
      setShowModal(false);
      setEditingPatient(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar paciente');
    }
  });

  // Eliminar paciente
  const deleteMutation = useMutation({
    mutationFn: patientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['patients']);
      toast.success('Paciente eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar paciente');
    }
  });

  // Filtrar pacientes
  const filteredPatients = (Array.isArray(patients) ? patients : []).filter(patient => {
    const matchesSearch = patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || patient.estado === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Manejar envío del formulario
  const onSubmit = (data) => {
    // Limpiar los datos para solo incluir campos válidos
    const allowedFields = ['nombre', 'apellido', 'email', 'telefono', 'fechaNacimiento', 'genero', 'direccion', 'historialMedico', 'alergias', 'estado'];
    const cleanData = {};
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        cleanData[field] = data[field];
      }
    });
    
    console.log('Datos limpios a enviar:', cleanData);
    
    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  // Abrir modal para editar
  const handleEdit = (patient) => {
    setEditingPatient(patient);
    
    // Solo cargar los campos que están en el formulario
    const formFields = {
      nombre: patient.nombre,
      apellido: patient.apellido,
      email: patient.email,
      telefono: patient.telefono,
      fechaNacimiento: patient.fechaNacimiento,
      genero: patient.genero,
      direccion: patient.direccion,
      historialMedico: patient.historialMedico,
      alergias: patient.alergias,
      estado: patient.estado
    };
    
    reset(formFields);
    setShowModal(true);
  };

  // Abrir modal para ver detalles
  const handleView = (patient) => {
    setViewingPatient(patient);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setViewingPatient(null);
    reset();
  };

  // Confirmar eliminación
  const handleDelete = (patientId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este paciente?')) {
      deleteMutation.mutate(patientId);
    }
  };

  if (isLoading) return <LoadingSpinner size="xl" />;
  if (error) return <div className="text-red-600">Error al cargar pacientes: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pacientes</h1>
          <p className="text-gray-600">Administra la información de tus pacientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Paciente
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
                  placeholder="Buscar pacientes..."
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
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{(Array.isArray(patients) ? patients : []).length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <User className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pacientes Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(Array.isArray(patients) ? patients : []).filter(p => p.estado === 'activo').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Calendar className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Con Citas Próximas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(Array.isArray(patients) ? patients : []).filter(p => p.citas?.some(c => new Date(c.fecha) > new Date())).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de pacientes */}
      <div className="card">
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Paciente</th>
                  <th className="table-header-cell">Contacto</th>
                  <th className="table-header-cell">Fecha Nacimiento</th>
                  <th className="table-header-cell">Estado</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient.nombre} {patient.apellido}
                        </p>
                        <p className="text-sm text-gray-600">ID: {patient.id}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {patient.telefono}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {patient.email}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <p className="text-sm text-gray-900">
                        {new Date(patient.fechaNacimiento).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {Math.floor((new Date() - new Date(patient.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 365.25))} años
                      </p>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${patient.estado === 'activo' ? 'badge-success' : 'badge-secondary'}`}>
                        {patient.estado}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(patient)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(patient)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
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
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron pacientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar paciente */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      {...register('nombre', { required: 'El nombre es requerido' })}
                      className="input"
                    />
                    {errors.nombre && (
                      <p className="text-red-600 text-sm mt-1">{errors.nombre.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      {...register('apellido', { required: 'El apellido es requerido' })}
                      className="input"
                    />
                    {errors.apellido && (
                      <p className="text-red-600 text-sm mt-1">{errors.apellido.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('email', { 
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido'
                        }
                      })}
                      className="input"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      {...register('telefono')}
                      className="input"
                    />
                    {errors.telefono && (
                      <p className="text-red-600 text-sm mt-1">{errors.telefono.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    {...register('fechaNacimiento')}
                    className="input"
                  />
                  {errors.fechaNacimiento && (
                    <p className="text-red-600 text-sm mt-1">{errors.fechaNacimiento.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Género
                  </label>
                  <select {...register('genero')} className="input">
                    <option value="">Seleccionar género</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                  {errors.genero && (
                    <p className="text-red-600 text-sm mt-1">{errors.genero.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    {...register('direccion')}
                    rows="3"
                    className="input"
                    placeholder="Dirección completa del paciente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Historial Médico
                  </label>
                  <textarea
                    {...register('historialMedico')}
                    rows="3"
                    className="input"
                    placeholder="Información médica relevante del paciente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alergias
                  </label>
                  <textarea
                    {...register('alergias')}
                    rows="2"
                    className="input"
                    placeholder="Alergias conocidas del paciente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select {...register('estado')} className="input">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
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
                      editingPatient ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del paciente */}
      {viewingPatient && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Detalles del Paciente</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <p className="text-gray-900">{viewingPatient.nombre} {viewingPatient.apellido}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID</label>
                    <p className="text-gray-900">{viewingPatient.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{viewingPatient.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="text-gray-900">{viewingPatient.telefono}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                  <p className="text-gray-900">
                    {new Date(viewingPatient.fechaNacimiento).toLocaleDateString()}
                  </p>
                </div>

                {viewingPatient.direccion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección</label>
                    <p className="text-gray-900">{viewingPatient.direccion}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`badge ${viewingPatient.estado === 'activo' ? 'badge-success' : 'badge-secondary'}`}>
                    {viewingPatient.estado}
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

export default Patients; 