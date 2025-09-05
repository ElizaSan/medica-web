import axios from 'axios';
import toast from 'react-hot-toast';

// Configuración base de axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } else if (response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción.');
    } else if (response?.status === 404) {
      toast.error('Recurso no encontrado.');
    } else if (response?.status === 422) {
      const errors = response.data.errors;
      if (errors && Array.isArray(errors)) {
        errors.forEach(error => {
          toast.error(error.msg || 'Error de validación');
        });
      } else {
        toast.error('Error de validación en los datos');
      }
    } else if (response?.status >= 500) {
      toast.error('Error interno del servidor. Inténtalo más tarde.');
    } else {
      toast.error(response?.data?.message || 'Error inesperado');
    }
    
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/registro', userData);
    return response.data;
  },
  
  verifyToken: async () => {
    const response = await api.get('/auth/verificar');
    return response.data;
  },
};

// Servicios de usuarios
export const userService = {
  getProfile: async () => {
    const response = await api.get('/usuarios/perfil');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/usuarios/perfil', profileData);
    return response.data;
  },
  
  changePassword: async (passwordData) => {
    const response = await api.put('/usuarios/cambiar-password', passwordData);
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await api.get('/usuarios/estadisticas');
    return response.data;
  },
};

// Servicios de pacientes
export const patientService = {
  getAll: async (params = {}) => {
    const response = await api.get('/pacientes', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/pacientes/${id}`);
    return response.data;
  },
  
  create: async (patientData) => {
    const response = await api.post('/pacientes', patientData);
    return response.data;
  },
  
  update: async (id, patientData) => {
    const response = await api.put(`/pacientes/${id}`, patientData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/pacientes/${id}`);
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await api.get('/pacientes/estadisticas/resumen');
    return response.data;
  },
};

// Servicios de citas
export const appointmentService = {
  getAll: async (params = {}) => {
    const response = await api.get('/citas', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/citas/${id}`);
    return response.data;
  },
  
  create: async (appointmentData) => {
    const response = await api.post('/citas', appointmentData);
    return response.data;
  },
  
  update: async (id, appointmentData) => {
    const response = await api.put(`/citas/${id}`, appointmentData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/citas/${id}`);
    return response.data;
  },
  
  getCalendar: async (params = {}) => {
    const response = await api.get('/citas/calendario', { params });
    return response.data;
  },
  
  getUpcoming: async () => {
    const response = await api.get('/citas/proximas');
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await api.get('/citas/estadisticas/resumen');
    return response.data;
  },
};

// Servicios de gastos
export const expenseService = {
  getAll: async (params = {}) => {
    const response = await api.get('/gastos', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/gastos/${id}`);
    return response.data;
  },
  
  create: async (expenseData) => {
    const response = await api.post('/gastos', expenseData);
    return response.data;
  },
  
  update: async (id, expenseData) => {
    const response = await api.put(`/gastos/${id}`, expenseData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/gastos/${id}`);
    return response.data;
  },
  
  getCategories: async () => {
    const response = await api.get('/gastos/categorias');
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await api.get('/gastos/estadisticas/resumen');
    return response.data;
  },
  
  getByCategory: async () => {
    const response = await api.get('/gastos/estadisticas/por-categoria');
    return response.data;
  },
};

// Servicios de ingresos
export const incomeService = {
  getAll: async (params = {}) => {
    const response = await api.get('/ingresos', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/ingresos/${id}`);
    return response.data;
  },
  
  create: async (incomeData) => {
    const response = await api.post('/ingresos', incomeData);
    return response.data;
  },
  
  update: async (id, incomeData) => {
    const response = await api.put(`/ingresos/${id}`, incomeData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/ingresos/${id}`);
    return response.data;
  },
  
  getCategories: async () => {
    const response = await api.get('/ingresos/categorias');
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await api.get('/ingresos/estadisticas/resumen');
    return response.data;
  },
  
  getByCategory: async () => {
    const response = await api.get('/ingresos/estadisticas/por-categoria');
    return response.data;
  },
};

// Servicios de recetas
export const prescriptionService = {
  getAll: async (params = {}) => {
    const response = await api.get('/recetas', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/recetas/${id}`);
    return response.data;
  },
  
  create: async (prescriptionData) => {
    const response = await api.post('/recetas', prescriptionData);
    return response.data;
  },
  
  update: async (id, prescriptionData) => {
    const response = await api.put(`/recetas/${id}`, prescriptionData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/recetas/${id}`);
    return response.data;
  },
  
  downloadPDF: async (id) => {
    const response = await api.get(`/recetas/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await api.get('/recetas/estadisticas/resumen');
    return response.data;
  },
};

// Servicios de dashboard
export const dashboardService = {
  getMain: async (params = {}) => {
    const response = await api.get('/dashboard', { params });
    return response.data;
  },
  
  getCharts: async (params = {}) => {
    const response = await api.get('/dashboard/graficos', { params });
    return response.data;
  },
  
  getAlerts: async () => {
    const response = await api.get('/dashboard/alertas');
    return response.data;
  },
};

// Servicios de reportes
export const reportService = {
  downloadFinancialReport: async (params = {}) => {
    const response = await api.get('/reportes/financiero/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
  
  downloadAppointmentsReport: async (params = {}) => {
    const response = await api.get('/reportes/citas/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
  
  downloadPatientsReport: async () => {
    const response = await api.get('/reportes/pacientes/excel', {
      responseType: 'blob',
    });
    return response.data;
  },
  
  downloadCompleteReport: async (params = {}) => {
    const response = await api.get('/reportes/completo/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api; 