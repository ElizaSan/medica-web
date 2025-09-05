import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, User, Lock, Mail, Phone, MapPin, Calendar, Stethoscope } from 'lucide-react';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error en registro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Registro de Médico
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Crea tu cuenta para acceder al sistema
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nombre"
                    type="text"
                    className={`input pl-10 ${
                      errors.nombre ? 'border-danger-500' : 'border-gray-300'
                    }`}
                    placeholder="Carlos"
                    {...register('nombre', {
                      required: 'El nombre es requerido',
                      minLength: {
                        value: 2,
                        message: 'El nombre debe tener al menos 2 caracteres',
                      },
                    })}
                  />
                </div>
                {errors.nombre && (
                  <p className="mt-1 text-sm text-danger-600">{errors.nombre.message}</p>
                )}
              </div>

              {/* Apellido */}
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
                  Apellido
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="apellido"
                    type="text"
                    className={`input pl-10 ${
                      errors.apellido ? 'border-danger-500' : 'border-gray-300'
                    }`}
                    placeholder="García"
                    {...register('apellido', {
                      required: 'El apellido es requerido',
                      minLength: {
                        value: 2,
                        message: 'El apellido debe tener al menos 2 caracteres',
                      },
                    })}
                  />
                </div>
                {errors.apellido && (
                  <p className="mt-1 text-sm text-danger-600">{errors.apellido.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className={`input pl-10 ${
                      errors.email ? 'border-danger-500' : 'border-gray-300'
                    }`}
                    placeholder="dr.garcia@ejemplo.com"
                    {...register('email', {
                      required: 'El correo electrónico es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Correo electrónico inválido',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="telefono"
                    type="tel"
                    className={`input pl-10 ${
                      errors.telefono ? 'border-danger-500' : 'border-gray-300'
                    }`}
                    placeholder="+52 55 1234 5678"
                    {...register('telefono', {
                      required: 'El teléfono es requerido',
                    })}
                  />
                </div>
                {errors.telefono && (
                  <p className="mt-1 text-sm text-danger-600">{errors.telefono.message}</p>
                )}
              </div>

              {/* Especialidad */}
              <div>
                <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700">
                  Especialidad
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Stethoscope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="especialidad"
                    type="text"
                    className={`input pl-10 ${
                      errors.especialidad ? 'border-danger-500' : 'border-gray-300'
                    }`}
                    placeholder="Medicina General"
                    {...register('especialidad', {
                      required: 'La especialidad es requerida',
                    })}
                  />
                </div>
                {errors.especialidad && (
                  <p className="mt-1 text-sm text-danger-600">{errors.especialidad.message}</p>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div>
                <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700">
                  Fecha de nacimiento
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fechaNacimiento"
                    type="date"
                    className={`input pl-10 ${
                      errors.fechaNacimiento ? 'border-danger-500' : 'border-gray-300'
                    }`}
                    {...register('fechaNacimiento', {
                      required: 'La fecha de nacimiento es requerida',
                    })}
                  />
                </div>
                {errors.fechaNacimiento && (
                  <p className="mt-1 text-sm text-danger-600">{errors.fechaNacimiento.message}</p>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="direccion"
                  type="text"
                  className={`input pl-10 ${
                    errors.direccion ? 'border-danger-500' : 'border-gray-300'
                  }`}
                  placeholder="Av. Reforma 123, Ciudad de México"
                  {...register('direccion', {
                    required: 'La dirección es requerida',
                  })}
                />
              </div>
              {errors.direccion && (
                <p className="mt-1 text-sm text-danger-600">{errors.direccion.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-10 pr-10 ${
                    errors.password ? 'border-danger-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full btn-lg"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </div>
                ) : (
                  'Registrarse'
                )}
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 