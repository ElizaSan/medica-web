const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../database/client');

const router = express.Router();

// Obtener todos los pacientes del usuario
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      usuarioId: req.user.id
    };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              citas: true,
              recetas: true
            }
          }
        }
      }),
      prisma.paciente.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        pacientes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener un paciente específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await prisma.paciente.findFirst({
      where: {
        id,
        usuarioId: req.user.id
      },
      include: {
        citas: {
          orderBy: { fecha: 'desc' },
          take: 5
        },
        recetas: {
          orderBy: { fecha: 'desc' },
          take: 5
        }
      }
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      data: { paciente }
    });

  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo paciente
router.post('/', [
  body('nombre').notEmpty().trim(),
  body('apellido').notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().trim(),
  body('fechaNacimiento').optional().isISO8601(),
  body('genero').optional().isIn(['masculino', 'femenino', 'otro']),
  body('direccion').optional().trim(),
  body('historialMedico').optional().trim(),
  body('alergias').optional().trim(),
  body('estado').optional().isIn(['activo', 'inactivo'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const {
      nombre,
      apellido,
      email,
      telefono,
      fechaNacimiento,
      genero,
      direccion,
      historialMedico,
      alergias,
      estado
    } = req.body;

    const paciente = await prisma.paciente.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        genero,
        direccion,
        historialMedico,
        alergias,
        estado: estado || 'activo',
        usuarioId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Paciente creado exitosamente',
      data: { paciente }
    });

  } catch (error) {
    console.error('Error al crear paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar paciente
router.put('/:id', [
  body('nombre').optional().notEmpty().trim(),
  body('apellido').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().trim(),
  body('fechaNacimiento').optional().isISO8601(),
  body('genero').optional().isIn(['masculino', 'femenino', 'otro']).withMessage('El género debe ser masculino, femenino u otro'),
  body('direccion').optional().trim(),
  body('historialMedico').optional().trim(),
  body('alergias').optional().trim(),
  body('estado').optional().isIn(['activo', 'inactivo'])
], async (req, res) => {
  try {
    // Debug: Log de los datos recibidos
    console.log('Datos recibidos para actualizar paciente:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Errores de validación:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    
    // Limpiar los datos para solo incluir campos válidos
    const allowedFields = ['nombre', 'apellido', 'email', 'telefono', 'fechaNacimiento', 'genero', 'direccion', 'historialMedico', 'alergias', 'estado'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
        updateData[field] = req.body[field];
      }
    });
    
    if (updateData.fechaNacimiento) {
      updateData.fechaNacimiento = new Date(updateData.fechaNacimiento);
    }
    
    console.log('Datos limpios para actualizar:', updateData);

    const paciente = await prisma.paciente.updateMany({
      where: {
        id,
        usuarioId: req.user.id
      },
      data: updateData
    });

    if (paciente.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const pacienteActualizado = await prisma.paciente.findUnique({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Paciente actualizado exitosamente',
      data: { paciente: pacienteActualizado }
    });

  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar paciente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await prisma.paciente.deleteMany({
      where: {
        id,
        usuarioId: req.user.id
      }
    });

    if (paciente.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Paciente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de pacientes
router.get('/estadisticas/resumen', async (req, res) => {
  try {
    const [
      totalPacientes,
      pacientesNuevosEsteMes,
      pacientesConCitas,
      pacientesSinCitas
    ] = await Promise.all([
      prisma.paciente.count({
        where: { usuarioId: req.user.id }
      }),
      prisma.paciente.count({
        where: {
          usuarioId: req.user.id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.paciente.count({
        where: {
          usuarioId: req.user.id,
          citas: { some: {} }
        }
      }),
      prisma.paciente.count({
        where: {
          usuarioId: req.user.id,
          citas: { none: {} }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalPacientes,
        pacientesNuevosEsteMes,
        pacientesConCitas,
        pacientesSinCitas
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 