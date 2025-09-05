const express = require('express');
const { body, validationResult, query } = require('express-validator');
const moment = require('moment');
const prisma = require('../database/client');

const router = express.Router();

// Obtener todas las citas del usuario
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('estado').optional().isIn(['programada', 'confirmada', 'cancelada', 'completada']),
  query('fechaInicio').optional().isISO8601(),
  query('fechaFin').optional().isISO8601(),
  query('pacienteId').optional().notEmpty()
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      estado, 
      fechaInicio, 
      fechaFin, 
      pacienteId 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      usuarioId: req.user.id
    };

    if (estado) where.estado = estado;
    if (pacienteId) where.pacienteId = pacienteId;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { fecha: 'asc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              telefono: true,
              email: true
            }
          }
        }
      }),
      prisma.cita.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        citas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener citas para calendario
router.get('/calendario', [
  query('mes').optional().isInt({ min: 1, max: 12 }),
  query('ano').optional().isInt({ min: 2020, max: 2030 })
], async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const fechaActual = moment();
    const mesConsulta = mes ? parseInt(mes) : fechaActual.month() + 1;
    const anoConsulta = ano ? parseInt(ano) : fechaActual.year();

    const fechaInicio = moment([anoConsulta, mesConsulta - 1, 1]);
    const fechaFin = moment([anoConsulta, mesConsulta - 1, 1]).endOf('month');

    const citas = await prisma.cita.findMany({
      where: {
        usuarioId: req.user.id,
        fecha: {
          gte: fechaInicio.toDate(),
          lte: fechaFin.toDate()
        }
      },
      orderBy: { fecha: 'asc' },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true
          }
        }
      }
    });

    // Agrupar citas por día
    const citasPorDia = {};
    citas.forEach(cita => {
      const fecha = moment(cita.fecha).format('YYYY-MM-DD');
      if (!citasPorDia[fecha]) {
        citasPorDia[fecha] = [];
      }
      citasPorDia[fecha].push(cita);
    });

    res.json({
      success: true,
      data: {
        citasPorDia,
        mes: mesConsulta,
        ano: anoConsulta,
        totalCitas: citas.length
      }
    });

  } catch (error) {
    console.error('Error al obtener calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener próximas citas
router.get('/proximas', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const fechaActual = new Date();

    const proximasCitas = await prisma.cita.findMany({
      where: {
        usuarioId: req.user.id,
        fecha: {
          gte: fechaActual
        },
        estado: {
          in: ['programada', 'confirmada']
        }
      },
      take: parseInt(limit),
      orderBy: { fecha: 'asc' },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        proximasCitas,
        total: proximasCitas.length
      }
    });

  } catch (error) {
    console.error('Error al obtener próximas citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener una cita específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cita = await prisma.cita.findFirst({
      where: {
        id,
        usuarioId: req.user.id
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            fechaNacimiento: true,
            historialMedico: true,
            alergias: true
          }
        }
      }
    });

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      data: { cita }
    });

  } catch (error) {
    console.error('Error al obtener cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva cita
router.post('/', [
  body('fecha').isISO8601(),
  body('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('duracion').optional().isInt({ min: 15, max: 480 }),
  body('motivo').optional().trim(),
  body('estado').optional().isIn(['programada', 'confirmada', 'cancelada', 'completada']),
  body('notas').optional().trim(),
  body('pacienteId').notEmpty().withMessage('El ID del paciente es requerido')
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
      fecha,
      hora,
      duracion = 30,
      motivo,
      estado = 'programada',
      notas,
      pacienteId
    } = req.body;

    // Verificar que el paciente pertenece al usuario
    const paciente = await prisma.paciente.findFirst({
      where: {
        id: pacienteId,
        usuarioId: req.user.id
      }
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Combinar fecha y hora
    const fechaHora = moment(fecha).format('YYYY-MM-DD') + 'T' + hora;

    // Verificar disponibilidad (opcional - puedes implementar lógica más compleja)
    const citaExistente = await prisma.cita.findFirst({
      where: {
        usuarioId: req.user.id,
        fecha: new Date(fechaHora),
        estado: {
          in: ['programada', 'confirmada']
        }
      }
    });

    if (citaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cita programada para esta fecha y hora'
      });
    }

    const cita = await prisma.cita.create({
      data: {
        fecha: new Date(fechaHora),
        hora,
        duracion,
        motivo,
        estado,
        notas,
        usuarioId: req.user.id,
        pacienteId
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: { cita }
    });

  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar cita
router.put('/:id', [
  body('fecha').optional().isISO8601(),
  body('hora').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('duracion').optional().isInt({ min: 15, max: 480 }),
  body('motivo').optional().trim(),
  body('estado').optional().isIn(['programada', 'confirmada', 'cancelada', 'completada']),
  body('notas').optional().trim()
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

    const { id } = req.params;
    
    // Filtrar solo los campos que se pueden actualizar
    const camposActualizables = ['fecha', 'hora', 'duracion', 'motivo', 'estado', 'notas', 'pacienteId'];
    const updateData = {};
    
    for (const campo of camposActualizables) {
      if (req.body[campo] !== undefined) {
        updateData[campo] = req.body[campo];
      }
    }

    // Si se actualiza fecha y hora, combinarlas
    if (updateData.fecha && updateData.hora) {
      const fechaHora = moment(updateData.fecha).format('YYYY-MM-DD') + 'T' + updateData.hora;
      updateData.fecha = new Date(fechaHora);
      delete updateData.hora;
    }

    // Solo actualizar si hay datos válidos
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos válidos para actualizar'
      });
    }

    const cita = await prisma.cita.updateMany({
      where: {
        id,
        usuarioId: req.user.id
      },
      data: updateData
    });

    if (cita.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const citaActualizada = await prisma.cita.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      data: { cita: citaActualizada }
    });

  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar cita
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cita = await prisma.cita.deleteMany({
      where: {
        id,
        usuarioId: req.user.id
      }
    });

    if (cita.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Cita eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de citas
router.get('/estadisticas/resumen', [
  query('mes').optional().isInt({ min: 1, max: 12 }),
  query('ano').optional().isInt({ min: 2020, max: 2030 })
], async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const fechaActual = moment();
    const mesConsulta = mes ? parseInt(mes) : fechaActual.month() + 1;
    const anoConsulta = ano ? parseInt(ano) : fechaActual.year();

    const fechaInicio = moment([anoConsulta, mesConsulta - 1, 1]);
    const fechaFin = moment([anoConsulta, mesConsulta - 1, 1]).endOf('month');

    const [
      totalCitas,
      citasProgramadas,
      citasConfirmadas,
      citasCompletadas,
      citasCanceladas
    ] = await Promise.all([
      prisma.cita.count({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        }
      }),
      prisma.cita.count({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          },
          estado: 'programada'
        }
      }),
      prisma.cita.count({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          },
          estado: 'confirmada'
        }
      }),
      prisma.cita.count({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          },
          estado: 'completada'
        }
      }),
      prisma.cita.count({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          },
          estado: 'cancelada'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalCitas,
        citasProgramadas,
        citasConfirmadas,
        citasCompletadas,
        citasCanceladas,
        mes: mesConsulta,
        ano: anoConsulta
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