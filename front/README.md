# 🏥 Frontend - Sistema de Gestión de Médicos

Frontend moderno y responsivo para el sistema de gestión médica, construido con React, Vite y Tailwind CSS.

## 🚀 Características

### ✨ **Interfaz Moderna**
- Diseño responsivo y adaptativo
- Componentes reutilizables
- Animaciones suaves y transiciones
- Iconografía consistente con Lucide React

### 🔐 **Autenticación Completa**
- Login y registro de médicos
- Gestión de tokens JWT
- Rutas protegidas
- Persistencia de sesión

### 📊 **Dashboard Interactivo**
- Métricas en tiempo real
- Gráficos y estadísticas
- Alertas y notificaciones
- Acciones rápidas

### 🎯 **Módulos Principales**
- **Pacientes**: Gestión completa de historiales médicos
- **Citas**: Programación y calendario
- **Gastos**: Control financiero
- **Ingresos**: Registro de cobros
- **Recetas**: Generación de PDFs
- **Reportes**: Exportación a Excel

## 🛠️ Tecnologías

### **Core**
- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Build tool y dev server
- **React Router DOM** - Navegación
- **React Query** - Gestión de estado del servidor

### **UI/UX**
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Iconos
- **React Hook Form** - Formularios
- **React Hot Toast** - Notificaciones

### **Funcionalidades**
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos
- **React PDF** - Visualización de PDFs
- **File Saver** - Descarga de archivos
- **Moment.js** - Manejo de fechas

## 📦 Instalación

### Prerrequisitos
- Node.js 16+ 
- npm o yarn
- Backend corriendo en `http://localhost:3000`

### Pasos de instalación

1. **Clonar el repositorio**
```bash
cd front
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# El proxy está configurado en vite.config.js
# No se necesitan variables adicionales
```

4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:5173
```

## 🏗️ Estructura del Proyecto

```
front/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── layout/        # Layout principal
│   │   └── ui/            # Componentes de UI
│   ├── contexts/          # Contextos de React
│   ├── pages/             # Páginas de la aplicación
│   │   ├── auth/          # Páginas de autenticación
│   │   └── ...            # Otras páginas
│   ├── services/          # Servicios de API
│   ├── App.jsx            # Componente principal
│   ├── main.jsx           # Punto de entrada
│   └── index.css          # Estilos globales
├── package.json
├── vite.config.js         # Configuración de Vite
├── tailwind.config.js     # Configuración de Tailwind
└── README.md
```

## 🎨 Componentes Principales

### **Layout**
- `Layout.jsx` - Estructura principal
- `Sidebar.jsx` - Navegación lateral
- `Header.jsx` - Barra superior

### **Autenticación**
- `Login.jsx` - Página de inicio de sesión
- `Register.jsx` - Página de registro
- `AuthContext.jsx` - Contexto de autenticación

### **Páginas**
- `Dashboard.jsx` - Vista principal
- `Patients.jsx` - Gestión de pacientes
- `Appointments.jsx` - Gestión de citas
- `Expenses.jsx` - Control de gastos
- `Income.jsx` - Registro de ingresos
- `Prescriptions.jsx` - Gestión de recetas
- `Reports.jsx` - Generación de reportes
- `Profile.jsx` - Perfil del usuario

## 🔧 Configuración

### **Vite Config**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

### **Tailwind Config**
```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { /* ... */ },
        secondary: { /* ... */ },
        success: { /* ... */ },
        warning: { /* ... */ },
        danger: { /* ... */ }
      }
    }
  }
}
```

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Características**
- Sidebar colapsable en móviles
- Tablas responsivas
- Formularios adaptativos
- Navegación optimizada para touch

## 🔐 Autenticación

### **Flujo de Autenticación**
1. Usuario ingresa credenciales
2. Backend valida y retorna JWT
3. Token se almacena en localStorage
4. Contexto actualiza estado global
5. Rutas protegidas verifican autenticación

### **Protección de Rutas**
```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};
```

## 📊 Gestión de Estado

### **React Query**
- Caché automático de datos
- Refetch automático
- Optimistic updates
- Error handling

### **Context API**
- Estado de autenticación
- Datos del usuario
- Configuraciones globales

## 🎯 Funcionalidades por Módulo

### **Dashboard**
- ✅ Métricas en tiempo real
- ✅ Gráficos interactivos
- ✅ Próximas citas
- ✅ Alertas del sistema
- ✅ Acciones rápidas

### **Pacientes**
- ✅ Lista con paginación
- ✅ Búsqueda y filtros
- ✅ Crear/editar/eliminar
- ✅ Historial médico
- ✅ Estadísticas

### **Citas**
- ✅ Calendario interactivo
- ✅ Programación de citas
- ✅ Estados (programada, confirmada, completada)
- ✅ Recordatorios
- ✅ Estadísticas

### **Finanzas**
- ✅ Control de gastos
- ✅ Registro de ingresos
- ✅ Categorización
- ✅ Reportes financieros
- ✅ Gráficos de tendencias

### **Recetas**
- ✅ Creación de recetas
- ✅ Descarga en PDF
- ✅ Historial de recetas
- ✅ Plantillas personalizables

### **Reportes**
- ✅ Reportes financieros
- ✅ Reportes de citas
- ✅ Reportes de pacientes
- ✅ Exportación a Excel
- ✅ Filtros por fecha

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye para producción
npm run preview      # Previsualiza build de producción

# Linting
npm run lint         # Ejecuta ESLint
```

## 🔧 Desarrollo

### **Agregar una nueva página**
1. Crear componente en `src/pages/`
2. Agregar ruta en `App.jsx`
3. Agregar navegación en `Sidebar.jsx`
4. Crear servicios en `src/services/api.js`

### **Agregar un nuevo componente**
1. Crear en `src/components/`
2. Usar Tailwind CSS para estilos
3. Seguir convenciones de naming
4. Agregar PropTypes si es necesario

### **Agregar un nuevo servicio**
1. Crear función en `src/services/api.js`
2. Usar axios para requests
3. Manejar errores apropiadamente
4. Documentar parámetros y respuestas

## 🐛 Solución de Problemas

### **Error de conexión al backend**
- Verificar que el backend esté corriendo en puerto 3000
- Revisar configuración del proxy en `vite.config.js`
- Verificar logs del navegador

### **Error de autenticación**
- Verificar que el token esté en localStorage
- Revisar expiración del token
- Verificar headers de Authorization

### **Error de build**
- Limpiar cache: `npm run build --force`
- Verificar dependencias: `npm install`
- Revisar errores de ESLint

## 📈 Optimizaciones

### **Performance**
- Lazy loading de componentes
- Memoización con React.memo
- Optimización de imágenes
- Code splitting automático

### **SEO**
- Meta tags dinámicos
- Títulos de página
- Descripciones
- Open Graph tags

### **Accesibilidad**
- ARIA labels
- Navegación por teclado
- Contraste de colores
- Screen reader support

## 🔄 Integración con Backend

### **Endpoints Consumidos**
- `/api/auth/*` - Autenticación
- `/api/usuarios/*` - Gestión de usuarios
- `/api/pacientes/*` - Gestión de pacientes
- `/api/citas/*` - Gestión de citas
- `/api/gastos/*` - Control de gastos
- `/api/ingresos/*` - Registro de ingresos
- `/api/recetas/*` - Gestión de recetas
- `/api/dashboard/*` - Dashboard
- `/api/reportes/*` - Reportes

### **Formato de Respuestas**
```javascript
{
  success: true,
  message: "Operación exitosa",
  data: { /* datos */ }
}
```

## 🎨 Personalización

### **Temas de Colores**
Modificar `tailwind.config.js`:
```javascript
colors: {
  primary: {
    50: '#eff6ff',
    // ... más tonos
  }
}
```

### **Componentes**
Los componentes usan clases de Tailwind que se pueden personalizar fácilmente.

## 📞 Soporte

Para soporte técnico:
1. Revisar la documentación del backend
2. Verificar logs del navegador
3. Comprobar conectividad con el backend
4. Revisar configuración de CORS

---

**¡El frontend está listo para conectar con tu backend de gestión médica!** 🏥✨ 