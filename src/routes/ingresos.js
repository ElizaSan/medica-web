const express = require('express');
const { body, validationResult, query } = require('express-validator');
const moment = require('moment');
const prisma = require('../database/client');

const router = express.Router();

// Categorías de ingresos predefinidas
const CATEGORIAS_INGRESOS = [
  'consulta',
  'procedimiento',
  'medicamento',
  'laboratorio',
  'radiografia',
  'terapia',
  'otros'
];

// Métodos de pago predefinidos
const METODOS_PAGO = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'cheque',
  'otros'
];

// Obtener todas las categorías de ingresos
router.get('/categorias', (req, res) => {
  res.json({
    success: true,
    data: { 
      categorias: CATEGORIAS_INGRESOS,
      metodosPago: METODOS_PAGO
    }
  });
});

// Obtener todos los ingresos del usuario
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('categoria').optional().isIn(CATEGORIAS_INGRESOS),
  query('metodoPago').optional().isIn(METODOS_PAGO),
  query('fechaInicio').optional().isISO8601(),
  query('fechaFin').optional().isISO8601(),
  query('montoMin').optional().isFloat({ min: 0 }),
  query('montoMax').optional().isFloat({ min: 0 }),
  query('pacienteId').optional().notEmpty()
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoria, 
      metodoPago,
      fechaInicio, 
      fechaFin, 
      montoMin, 
      montoMax,
      pacienteId
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      usuarioId: req.user.id
    };

    if (categoria) where.categoria = categoria;
    if (metodoPago) where.metodoPago = metodoPago;
    if (pacienteId) where.pacienteId = pacienteId;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }
    if (montoMin || montoMax) {
      where.monto = {};
      if (montoMin) where.monto.gte = parseFloat(montoMin);
      if (montoMax) where.monto.lte = parseFloat(montoMax);
    }

    const [ingresos, total] = await Promise.all([
      prisma.ingreso.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { fecha: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              telefono: true
            }
          },
          cita: {
            select: {
              id: true,
              fecha: true,
              hora: true,
              motivo: true
            }
          }
        }
      }),
      prisma.ingreso.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        ingresos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener un ingreso específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ingreso = await prisma.ingreso.findFirst({
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
            email: true
          }
        },
        cita: {
          select: {
            id: true,
            fecha: true,
            hora: true,
            motivo: true,
            estado: true
          }
        }
      }
    });

    if (!ingreso) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }

    res.json({
      success: true,
      data: { ingreso }
    });

  } catch (error) {
    console.error('Error al obtener ingreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo ingreso
router.post('/', [
  body('descripcion').notEmpty().trim(),
  body('monto').isFloat({ min: 0.01 }),
  body('categoria').isIn(CATEGORIAS_INGRESOS),
  body('fecha').isISO8601(),
  body('metodoPago').optional().isIn(METODOS_PAGO),
  body('pacienteId').optional().notEmpty(),
  body('citaId').optional().notEmpty()
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
      descripcion,
      monto,
      categoria,
      fecha,
      metodoPago = 'efectivo',
      pacienteId,
      citaId
    } = req.body;

    // Verificar que el paciente pertenece al usuario si se proporciona
    if (pacienteId) {
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
    }

    // Verificar que la cita pertenece al usuario si se proporciona
    if (citaId) {
      const cita = await prisma.cita.findFirst({
        where: {
          id: citaId,
          usuarioId: req.user.id
        }
      });

      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }
    }

    const ingreso = await prisma.ingreso.create({
      data: {
        descripcion,
        monto: parseFloat(monto),
        categoria,
        fecha: new Date(fecha),
        metodoPago,
        pacienteId,
        citaId,
        usuarioId: req.user.id
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true
          }
        },
        cita: {
          select: {
            id: true,
            fecha: true,
            hora: true,
            motivo: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Ingreso registrado exitosamente',
      data: { ingreso }
    });

  } catch (error) {
    console.error('Error al crear ingreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar ingreso
router.put('/:id', [
  body('descripcion').optional().notEmpty().trim(),
  body('monto').optional().isFloat({ min: 0.01 }),
  body('categoria').optional().isIn(CATEGORIAS_INGRESOS),
  body('fecha').optional().isISO8601(),
  body('metodoPago').optional().isIn(METODOS_PAGO),
  body('pacienteId').optional().notEmpty(),
  body('citaId').optional().notEmpty()
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
    const updateData = { ...req.body };
    
    if (updateData.monto) {
      updateData.monto = parseFloat(updateData.monto);
    }
    if (updateData.fecha) {
      updateData.fecha = new Date(updateData.fecha);
    }

    // Verificar que el paciente pertenece al usuario si se actualiza
    if (updateData.pacienteId) {
      const paciente = await prisma.paciente.findFirst({
        where: {
          id: updateData.pacienteId,
          usuarioId: req.user.id
        }
      });

      if (!paciente) {
        return res.status(404).json({
          success: false,
          message: 'Paciente no encontrado'
        });
      }
    }

    // Verificar que la cita pertenece al usuario si se actualiza
    if (updateData.citaId) {
      const cita = await prisma.cita.findFirst({
        where: {
          id: updateData.citaId,
          usuarioId: req.user.id
        }
      });

      if (!cita) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }
    }

    const ingreso = await prisma.ingreso.updateMany({
      where: {
        id,
        usuarioId: req.user.id
      },
      data: updateData
    });

    if (ingreso.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }

    const ingresoActualizado = await prisma.ingreso.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true
          }
        },
        cita: {
          select: {
            id: true,
            fecha: true,
            hora: true,
            motivo: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Ingreso actualizado exitosamente',
      data: { ingreso: ingresoActualizado }
    });

  } catch (error) {
    console.error('Error al actualizar ingreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar ingreso
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ingreso = await prisma.ingreso.deleteMany({
      where: {
        id,
        usuarioId: req.user.id
      }
    });

    if (ingreso.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Ingreso eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar ingreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de ingresos
router.get('/estadisticas/resumen', [
  query('mes').optional().isInt({ min: 1, max: 12 }),
  query('ano').optional().isInt({ min: 2020, max: 2030 }),
  query('periodo').optional().isIn(['mes', 'trimestre', 'semestre', 'ano'])
], async (req, res) => {
  try {
    const { mes, ano, periodo = 'mes' } = req.query;
    const fechaActual = moment();
    const mesConsulta = mes ? parseInt(mes) : fechaActual.month() + 1;
    const anoConsulta = ano ? parseInt(ano) : fechaActual.year();

    let fechaInicio, fechaFin;

    switch (periodo) {
      case 'mes':
        fechaInicio = moment([anoConsulta, mesConsulta - 1, 1]);
        fechaFin = moment([anoConsulta, mesConsulta - 1, 1]).endOf('month');
        break;
      case 'trimestre':
        const trimestre = Math.ceil(mesConsulta / 3);
        fechaInicio = moment([anoConsulta, (trimestre - 1) * 3, 1]);
        fechaFin = moment([anoConsulta, (trimestre - 1) * 3 + 2, 1]).endOf('month');
        break;
      case 'semestre':
        const semestre = Math.ceil(mesConsulta / 6);
        fechaInicio = moment([anoConsulta, (semestre - 1) * 6, 1]);
        fechaFin = moment([anoConsulta, (semestre - 1) * 6 + 5, 1]).endOf('month');
        break;
      case 'ano':
        fechaInicio = moment([anoConsulta, 0, 1]);
        fechaFin = moment([anoConsulta, 11, 31]);
        break;
    }

    const [
      totalIngresos,
      ingresosPorCategoria,
      ingresosPorMetodoPago,
      ingresosMensuales,
      promedioIngresos
    ] = await Promise.all([
      prisma.ingreso.aggregate({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _sum: {
          monto: true
        },
        _count: true
      }),
      prisma.ingreso.groupBy({
        by: ['categoria'],
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _sum: {
          monto: true
        },
        _count: true
      }),
      prisma.ingreso.groupBy({
        by: ['metodoPago'],
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _sum: {
          monto: true
        },
        _count: true
      }),
      prisma.ingreso.groupBy({
        by: ['fecha'],
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _sum: {
          monto: true
        }
      }),
      prisma.ingreso.aggregate({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _avg: {
          monto: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalIngresos: totalIngresos._sum.monto || 0,
        cantidadIngresos: totalIngresos._count,
        promedioIngresos: promedioIngresos._avg.monto || 0,
        ingresosPorCategoria: ingresosPorCategoria.map(item => ({
          categoria: item.categoria,
          total: item._sum.monto,
          cantidad: item._count
        })),
        ingresosPorMetodoPago: ingresosPorMetodoPago.map(item => ({
          metodoPago: item.metodoPago,
          total: item._sum.monto,
          cantidad: item._count
        })),
        ingresosMensuales: ingresosMensuales.map(item => ({
          fecha: item.fecha,
          total: item._sum.monto
        })),
        periodo: {
          inicio: fechaInicio.format('YYYY-MM-DD'),
          fin: fechaFin.format('YYYY-MM-DD'),
          tipo: periodo
        }
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

// Obtener ingresos por categoría
router.get('/estadisticas/por-categoria', [
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

    const ingresosPorCategoria = await prisma.ingreso.groupBy({
      by: ['categoria'],
      where: {
        usuarioId: req.user.id,
        fecha: {
          gte: fechaInicio.toDate(),
          lte: fechaFin.toDate()
        }
      },
      _sum: {
        monto: true
      },
      _count: true,
      orderBy: {
        _sum: {
          monto: 'desc'
        }
      }
    });

    const totalIngresos = ingresosPorCategoria.reduce((sum, item) => sum + item._sum.monto, 0);

    const resultado = ingresosPorCategoria.map(item => ({
      categoria: item.categoria,
      total: item._sum.monto,
      cantidad: item._count,
      porcentaje: totalIngresos > 0 ? ((item._sum.monto / totalIngresos) * 100).toFixed(2) : 0
    }));

    res.json({
      success: true,
      data: {
        ingresosPorCategoria: resultado,
        totalIngresos,
        mes: mesConsulta,
        ano: anoConsulta
      }
    });

  } catch (error) {
    console.error('Error al obtener ingresos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 