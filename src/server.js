const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const pacienteRoutes = require('./routes/pacientes');
const citaRoutes = require('./routes/citas');
const gastoRoutes = require('./routes/gastos');
const ingresoRoutes = require('./routes/ingresos');
const recetaRoutes = require('./routes/recetas');
const reporteRoutes = require('./routes/reportes');
const dashboardRoutes = require('./routes/dashboard');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas
app.use('/api/usuarios', authenticateToken, usuarioRoutes);
app.use('/api/pacientes', authenticateToken, pacienteRoutes);
app.use('/api/citas', authenticateToken, citaRoutes);
app.use('/api/gastos', authenticateToken, gastoRoutes);
app.use('/api/ingresos', authenticateToken, ingresoRoutes);
app.use('/api/recetas', authenticateToken, recetaRoutes);
app.use('/api/reportes', authenticateToken, reporteRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Gestión de Médicos API',
    version: '1.0.0',
    status: 'Activo'
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Dashboard disponible en: http://localhost:${PORT}/api/dashboard`);
  console.log(`📚 Documentación API: http://localhost:${PORT}/api/docs`);
});

module.exports = app; 