import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Award,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Camera
} from 'lucide-react';
import { userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();

  // Obtener perfil del usuario
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userService.getProfile
  });

  // Obtener estadísticas del usuario
  const { data: statistics } = useQuery({
    queryKey: ['userStatistics'],
    queryFn: userService.getStatistics
  });

  // Actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (data) => {
      updateUser(data);
      queryClient.invalidateQueries(['userProfile']);
      toast.success('Perfil actualizado exitosamente');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar perfil');
    }
  });

  // Cambiar contraseña
  const changePasswordMutation = useMutation({
    mutationFn: userService.changePassword,
    onSuccess: () => {
      toast.success('Contraseña cambiada exitosamente');
      setShowPasswordModal(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    }
  });

  // Manejar envío del formulario de perfil
  const onSubmitProfile = (data) => {
    updateProfileMutation.mutate(data);
  };

  // Manejar envío del formulario de contraseña
  const onSubmitPassword = (data) => {
    if (data.nuevaPassword !== data.confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    changePasswordMutation.mutate({
      passwordActual: data.passwordActual,
      nuevaPassword: data.nuevaPassword
    });
  };

  // Iniciar edición
  const handleEdit = () => {
    reset(profile);
    setIsEditing(true);
  };

  // Cancelar edición
  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  // Abrir modal de contraseña
  const handleChangePassword = () => {
    setShowPasswordModal(true);
    reset();
  };

  // Cerrar modal de contraseña
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    reset();
  };

  if (isLoading) return <LoadingSpinner size="xl" />;
  if (error) return <div className="text-red-600">Error al cargar perfil: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal y configuración</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleChangePassword}
            className="btn-secondary flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Cambiar Contraseña
          </button>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="btn-primary flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar Perfil
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={handleSubmit(onSubmitProfile)}
                className="btn-primary flex items-center gap-2"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del perfil */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información personal */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Información Personal</h3>
            </div>
            <div className="card-content">
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      {...register('nombre', { required: 'El nombre es requerido' })}
                      className="input"
                      disabled={!isEditing}
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
                      disabled={!isEditing}
                    />
                    {errors.apellido && (
                      <p className="text-red-600 text-sm mt-1">{errors.apellido.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    className="input"
                    disabled={!isEditing}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      {...register('telefono')}
                      className="input"
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      {...register('fechaNacimiento')}
                      className="input"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    {...register('especialidad')}
                    className="input"
                    disabled={!isEditing}
                    placeholder="Especialidad médica"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    {...register('direccion')}
                    rows="3"
                    className="input"
                    disabled={!isEditing}
                    placeholder="Dirección completa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biografía
                  </label>
                  <textarea
                    {...register('biografia')}
                    rows="4"
                    className="input"
                    disabled={!isEditing}
                    placeholder="Breve descripción sobre ti y tu experiencia"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Información profesional */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Información Profesional</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Licencia
                  </label>
                  <input
                    type="text"
                    {...register('numeroLicencia')}
                    className="input"
                    disabled={!isEditing}
                    placeholder="Número de licencia médica"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Años de Experiencia
                  </label>
                  <input
                    type="number"
                    {...register('aniosExperiencia')}
                    className="input"
                    disabled={!isEditing}
                    placeholder="Años de experiencia"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificaciones
                </label>
                <textarea
                  {...register('certificaciones')}
                  rows="3"
                  className="input"
                  disabled={!isEditing}
                  placeholder="Certificaciones y títulos adicionales"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar con estadísticas y información */}
        <div className="space-y-6">
          {/* Avatar y información básica */}
          <div className="card">
            <div className="card-content text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-12 w-12 text-primary-600" />
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {profile?.nombre} {profile?.apellido}
              </h3>
              <p className="text-gray-600 mb-2">{profile?.especialidad || 'Médico'}</p>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile?.email}
                </div>
                {profile?.telefono && (
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" />
                    {profile.telefono}
                  </div>
                )}
                {profile?.direccion && (
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{profile.direccion}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          {statistics && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Mis Estadísticas</h3>
              </div>
              <div className="card-content space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pacientes Atendidos</p>
                    <p className="text-lg font-bold text-gray-900">
                      {statistics.pacientesAtendidos || 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Citas Realizadas</p>
                    <p className="text-lg font-bold text-gray-900">
                      {statistics.citasRealizadas || 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Generados</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${statistics.ingresosGenerados?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Horas Trabajadas</p>
                    <p className="text-lg font-bold text-gray-900">
                      {statistics.horasTrabajadas || 0}h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información de la cuenta */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Información de la Cuenta</h3>
            </div>
            <div className="card-content space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Shield className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado de la cuenta</p>
                  <p className="text-sm font-medium text-success-600">Activa</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Miembro desde</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Award className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rol</p>
                  <p className="text-sm font-medium text-gray-900">Médico</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para cambiar contraseña */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Cambiar Contraseña</h2>
              
              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Actual *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('passwordActual', { required: 'La contraseña actual es requerida' })}
                      className="input pr-10"
                      placeholder="Contraseña actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.passwordActual && (
                    <p className="text-red-600 text-sm mt-1">{errors.passwordActual.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      {...register('nuevaPassword', { 
                        required: 'La nueva contraseña es requerida',
                        minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                      })}
                      className="input pr-10"
                      placeholder="Nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.nuevaPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.nuevaPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmarPassword', { 
                        required: 'Debe confirmar la nueva contraseña',
                        validate: value => value === watch('nuevaPassword') || 'Las contraseñas no coinciden'
                      })}
                      className="input pr-10"
                      placeholder="Confirmar nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmarPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmarPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClosePasswordModal}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 