# Sistema de Gestión de Médicos

Un sistema completo de gestión para médicos que incluye agenda de citas, gestión de pacientes, control financiero, recetas médicas y reportes detallados.

## 🚀 Características Principales

### 👥 Gestión de Usuarios
- **Registro y autenticación** de médicos con JWT
- **Perfiles personalizados** para cada médico
- **Gestión de contraseñas** segura con bcrypt

### 📅 Agenda y Citas
- **Registro de citas** con fecha, hora y duración
- **Calendario visual** para mejor organización
- **Estados de citas**: programada, confirmada, cancelada, completada
- **Lista de próximas citas** ordenadas por fecha
- **Verificación de disponibilidad** para evitar conflictos

### 👨‍⚕️ Gestión de Pacientes
- **Registro completo** de pacientes con historial médico
- **Búsqueda y filtros** avanzados
- **Historial de citas** y recetas por paciente
- **Información médica** (alergias, historial, etc.)

### 💰 Control Financiero
- **Registro de ingresos** por categorías (consulta, procedimiento, etc.)
- **Registro de gastos** organizados por tipo (consultorio, equipos, etc.)
- **Métodos de pago** diversos (efectivo, tarjeta, transferencia)
- **Reportes financieros** detallados con gráficos

### 📋 Recetas Médicas
- **Generación de recetas** completas con diagnóstico
- **Exportación a PDF** descargable
- **Historial de recetas** por paciente
- **Próximas citas** integradas en recetas

### 📊 Dashboard y Reportes
- **Dashboard principal** con métricas clave
- **Gráficos interactivos** de ingresos, gastos y citas
- **Reportes en Excel** completos y detallados
- **Comparación de períodos** para análisis
- **Alertas y notificaciones** automáticas

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js con Express
- **Base de Datos**: SQLite con Prisma ORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Express-validator
- **Reportes**: ExcelJS para Excel, PDFKit para PDF
- **Fechas**: Moment.js
- **Seguridad**: bcryptjs, helmet, cors

## 📦 Instalación

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd sistema-gestion-medicos
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp env.example .env
```
Editar el archivo `.env` con tus configuraciones:
```env
DATABASE_URL="sqlite:./dev.db"
JWT_SECRET="tu_jwt_secret_super_seguro_aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

4. **Configurar la base de datos**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Ejecutar el servidor**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/registro` - Registro de médico
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/verificar` - Verificar token

### Usuarios
- `GET /api/usuarios/perfil` - Obtener perfil
- `PUT /api/usuarios/perfil` - Actualizar perfil
- `PUT /api/usuarios/cambiar-password` - Cambiar contraseña
- `GET /api/usuarios/estadisticas` - Estadísticas del usuario

### Pacientes
- `GET /api/pacientes` - Listar pacientes
- `POST /api/pacientes` - Crear paciente
- `GET /api/pacientes/:id` - Obtener paciente
- `PUT /api/pacientes/:id` - Actualizar paciente
- `DELETE /api/pacientes/:id` - Eliminar paciente
- `GET /api/pacientes/estadisticas/resumen` - Estadísticas de pacientes

### Citas
- `GET /api/citas` - Listar citas
- `POST /api/citas` - Crear cita
- `GET /api/citas/:id` - Obtener cita
- `PUT /api/citas/:id` - Actualizar cita
- `DELETE /api/citas/:id` - Eliminar cita
- `GET /api/citas/calendario` - Obtener citas para calendario
- `GET /api/citas/proximas` - Próximas citas
- `GET /api/citas/estadisticas/resumen` - Estadísticas de citas

### Gastos
- `GET /api/gastos` - Listar gastos
- `POST /api/gastos` - Crear gasto
- `GET /api/gastos/:id` - Obtener gasto
- `PUT /api/gastos/:id` - Actualizar gasto
- `DELETE /api/gastos/:id` - Eliminar gasto
- `GET /api/gastos/categorias` - Obtener categorías
- `GET /api/gastos/estadisticas/resumen` - Estadísticas de gastos
- `GET /api/gastos/estadisticas/por-categoria` - Gastos por categoría

### Ingresos
- `GET /api/ingresos` - Listar ingresos
- `POST /api/ingresos` - Crear ingreso
- `GET /api/ingresos/:id` - Obtener ingreso
- `PUT /api/ingresos/:id` - Actualizar ingreso
- `DELETE /api/ingresos/:id` - Eliminar ingreso
- `GET /api/ingresos/categorias` - Obtener categorías
- `GET /api/ingresos/estadisticas/resumen` - Estadísticas de ingresos
- `GET /api/ingresos/estadisticas/por-categoria` - Ingresos por categoría

### Recetas
- `GET /api/recetas` - Listar recetas
- `POST /api/recetas` - Crear receta
- `GET /api/recetas/:id` - Obtener receta
- `PUT /api/recetas/:id` - Actualizar receta
- `DELETE /api/recetas/:id` - Eliminar receta
- `GET /api/recetas/:id/pdf` - Descargar receta en PDF
- `GET /api/recetas/estadisticas/resumen` - Estadísticas de recetas

### Dashboard
- `GET /api/dashboard` - Dashboard principal
- `GET /api/dashboard/graficos` - Datos para gráficos
- `GET /api/dashboard/alertas` - Alertas y notificaciones

### Reportes
- `GET /api/reportes/financiero/excel` - Reporte financiero en Excel
- `GET /api/reportes/citas/excel` - Reporte de citas en Excel
- `GET /api/reportes/pacientes/excel` - Reporte de pacientes en Excel
- `GET /api/reportes/completo/excel` - Reporte completo en Excel

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor en producción
npm run dev        # Iniciar servidor en desarrollo con nodemon
npm run db:generate # Generar cliente de Prisma
npm run db:migrate  # Ejecutar migraciones de base de datos
npm run db:studio   # Abrir Prisma Studio
npm run db:seed     # Poblar base de datos con datos de ejemplo
```

## 📊 Estructura de la Base de Datos

### Modelos principales:

- **Usuario**: Información del médico
- **Paciente**: Datos de los pacientes
- **Cita**: Agenda y citas médicas
- **Gasto**: Control de gastos del consultorio
- **Ingreso**: Registro de ingresos
- **Receta**: Recetas médicas

### Relaciones:
- Un médico puede tener múltiples pacientes
- Un paciente puede tener múltiples citas y recetas
- Las citas pueden estar asociadas a ingresos
- Todos los registros están vinculados al médico

## 🔒 Seguridad

- **Autenticación JWT** con tokens seguros
- **Encriptación de contraseñas** con bcrypt
- **Validación de datos** en todos los endpoints
- **Rate limiting** para prevenir abuso
- **Headers de seguridad** con helmet
- **CORS** configurado para APIs

## 📈 Características Avanzadas

### Dashboard Inteligente
- Métricas en tiempo real
- Comparación de períodos
- Gráficos interactivos
- Alertas automáticas

### Gestión Financiera
- Categorización automática
- Análisis de tendencias
- Reportes detallados
- Control de flujo de caja

### Agenda Inteligente
- Verificación de conflictos
- Recordatorios automáticos
- Estados de citas
- Calendario visual

### Reportes Profesionales
- Exportación a Excel
- Recetas en PDF
- Gráficos estadísticos
- Análisis comparativos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes alguna pregunta o necesitas ayuda:

1. Revisa la documentación de la API
2. Verifica los logs del servidor
3. Asegúrate de que todas las dependencias estén instaladas
4. Confirma que la base de datos esté configurada correctamente

## 🚀 Próximas Características

- [ ] Notificaciones por email
- [ ] App móvil
- [ ] Integración con sistemas de pago
- [ ] Backup automático
- [ ] Múltiples especialidades
- [ ] Sistema de recordatorios SMS
- [ ] Integración con laboratorios
- [ ] Historial médico digital

---

**Desarrollado con ❤️ para mejorar la gestión médica** 