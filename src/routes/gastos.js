const express = require('express');
const { body, validationResult, query } = require('express-validator');
const moment = require('moment');
const prisma = require('../database/client');

const router = express.Router();

// Categorías de gastos predefinidas
const CATEGORIAS_GASTOS = [
  'consultorio',
  'equipos',
  'suministros',
  'marketing',
  'personal',
  'servicios',
  'seguros',
  'otros'
];

// Obtener todas las categorías de gastos
router.get('/categorias', (req, res) => {
  res.json({
    success: true,
    data: { categorias: CATEGORIAS_GASTOS }
  });
});

// Obtener todos los gastos del usuario
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('categoria').optional().isIn(CATEGORIAS_GASTOS),
  query('fechaInicio').optional().isISO8601(),
  query('fechaFin').optional().isISO8601(),
  query('montoMin').optional().isFloat({ min: 0 }),
  query('montoMax').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoria, 
      fechaInicio, 
      fechaFin, 
      montoMin, 
      montoMax 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      usuarioId: req.user.id
    };

    if (categoria) where.categoria = categoria;
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

    const [gastos, total] = await Promise.all([
      prisma.gasto.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { fecha: 'desc' }
      }),
      prisma.gasto.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        gastos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener un gasto específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const gasto = await prisma.gasto.findFirst({
      where: {
        id,
        usuarioId: req.user.id
      }
    });

    if (!gasto) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    res.json({
      success: true,
      data: { gasto }
    });

  } catch (error) {
    console.error('Error al obtener gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo gasto
router.post('/', [
  body('descripcion').notEmpty().trim(),
  body('monto').isFloat({ min: 0.01 }),
  body('categoria').isIn(CATEGORIAS_GASTOS),
  body('fecha').isISO8601(),
  body('comprobante').optional().trim(),
  body('notas').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Errores de validación en gastos POST:', errors.array());
      console.log('Datos recibidos en gastos POST:', req.body);
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
      comprobante,
      notas
    } = req.body;

    const gasto = await prisma.gasto.create({
      data: {
        descripcion,
        monto: parseFloat(monto),
        categoria,
        fecha: new Date(fecha),
        comprobante,
        notas,
        usuarioId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Gasto registrado exitosamente',
      data: { gasto }
    });

  } catch (error) {
    console.error('Error al crear gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar gasto
router.put('/:id', [
  body('descripcion').optional().notEmpty().trim(),
  body('monto').optional().isFloat({ min: 0.01 }),
  body('categoria').optional().isIn(CATEGORIAS_GASTOS),
  body('fecha').optional().isISO8601(),
  body('comprobante').optional().trim(),
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
    const camposActualizables = ['descripcion', 'monto', 'categoria', 'fecha', 'comprobante', 'notas'];
    const updateData = {};
    
    for (const campo of camposActualizables) {
      if (req.body[campo] !== undefined) {
        updateData[campo] = req.body[campo];
      }
    }
    
    if (updateData.monto) {
      updateData.monto = parseFloat(updateData.monto);
    }
    if (updateData.fecha) {
      updateData.fecha = new Date(updateData.fecha);
    }

    // Solo actualizar si hay datos válidos
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos válidos para actualizar'
      });
    }

    const gasto = await prisma.gasto.updateMany({
      where: {
        id,
        usuarioId: req.user.id
      },
      data: updateData
    });

    if (gasto.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    const gastoActualizado = await prisma.gasto.findUnique({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Gasto actualizado exitosamente',
      data: { gasto: gastoActualizado }
    });

  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar gasto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const gasto = await prisma.gasto.deleteMany({
      where: {
        id,
        usuarioId: req.user.id
      }
    });

    if (gasto.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Gasto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de gastos
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
      totalGastos,
      gastosPorCategoria,
      gastosMensuales,
      promedioGastos
    ] = await Promise.all([
      prisma.gasto.aggregate({
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
      prisma.gasto.groupBy({
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
      prisma.gasto.groupBy({
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
      prisma.gasto.aggregate({
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
        totalGastos: totalGastos._sum.monto || 0,
        cantidadGastos: totalGastos._count,
        promedioGastos: promedioGastos._avg.monto || 0,
        gastosPorCategoria: gastosPorCategoria.map(item => ({
          categoria: item.categoria,
          total: item._sum.monto,
          cantidad: item._count
        })),
        gastosMensuales: gastosMensuales.map(item => ({
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

// Obtener gastos por categoría
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

    const gastosPorCategoria = await prisma.gasto.groupBy({
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

    const totalGastos = gastosPorCategoria.reduce((sum, item) => sum + item._sum.monto, 0);

    const resultado = gastosPorCategoria.map(item => ({
      categoria: item.categoria,
      total: item._sum.monto,
      cantidad: item._count,
      porcentaje: totalGastos > 0 ? ((item._sum.monto / totalGastos) * 100).toFixed(2) : 0
    }));

    res.json({
      success: true,
      data: {
        gastosPorCategoria: resultado,
        totalGastos,
        mes: mesConsulta,
        ano: anoConsulta
      }
    });

  } catch (error) {
    console.error('Error al obtener gastos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 