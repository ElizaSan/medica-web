const express = require('express');
const { query } = require('express-validator');
const moment = require('moment');
const prisma = require('../database/client');

const router = express.Router();

// Dashboard principal
router.get('/', [
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
    const fechaInicioAnterior = moment([anoConsulta, mesConsulta - 1, 1]).subtract(1, 'month');
    const fechaFinAnterior = moment([anoConsulta, mesConsulta - 1, 1]).subtract(1, 'month').endOf('month');

    // Obtener todas las estadísticas en paralelo
    const [
      // Estadísticas de pacientes
      totalPacientes,
      pacientesNuevosEsteMes,
      pacientesNuevosMesAnterior,
      
      // Estadísticas de citas
      totalCitasEsteMes,
      citasCompletadasEsteMes,
      citasCanceladasEsteMes,
      proximasCitas,
      
      // Estadísticas financieras
      totalIngresosEsteMes,
      totalGastosEsteMes,
      ingresosMesAnterior,
      gastosMesAnterior,
      
      // Estadísticas de recetas
      totalRecetasEsteMes,
      
      // Top pacientes
      topPacientes,
      
      // Ingresos por categoría
      ingresosPorCategoria,
      
      // Gastos por categoría
      gastosPorCategoria
    ] = await Promise.all([
      // Pacientes
      prisma.paciente.count({
        where: { usuarioId: req.user.id }
      }),
      prisma.paciente.count({
        where: {
          usuarioId: req.user.id,
          createdAt: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        }
      }),
      prisma.paciente.count({
        where: {
          usuarioId: req.user.id,
          createdAt: {
            gte: fechaInicioAnterior.toDate(),
            lte: fechaFinAnterior.toDate()
          }
        }
      }),

      // Citas
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
      }),
      prisma.cita.count({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: new Date()
          },
          estado: {
            in: ['programada', 'confirmada']
          }
        }
      }),

      // Finanzas
      prisma.ingreso.aggregate({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _sum: { monto: true }
      }),
      prisma.gasto.aggregate({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _sum: { monto: true }
      }),
      prisma.ingreso.aggregate({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicioAnterior.toDate(),
            lte: fechaFinAnterior.toDate()
          }
        },
        _sum: { monto: true }
      }),
      prisma.gasto.aggregate({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicioAnterior.toDate(),
            lte: fechaFinAnterior.toDate()
          }
        },
        _sum: { monto: true }
      }),

      // Recetas
      prisma.receta.count({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        }
      }),

      // Top pacientes (por número de citas)
      prisma.paciente.findMany({
        where: { usuarioId: req.user.id },
        include: {
          _count: {
            select: { citas: true }
          }
        },
        orderBy: {
          citas: {
            _count: 'desc'
          }
        },
        take: 5
      }),

      // Ingresos por categoría
      prisma.ingreso.groupBy({
        by: ['categoria'],
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _sum: { monto: true },
        _count: true
      }),

      // Gastos por categoría
      prisma.gasto.groupBy({
        by: ['categoria'],
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _sum: { monto: true },
        _count: true
      })
    ]);

    // Calcular métricas adicionales
    const ingresosActuales = totalIngresosEsteMes._sum.monto || 0;
    const gastosActuales = totalGastosEsteMes._sum.monto || 0;
    const ingresosAnteriores = ingresosMesAnterior._sum.monto || 0;
    const gastosAnteriores = gastosMesAnterior._sum.monto || 0;

    const utilidadActual = ingresosActuales - gastosActuales;
    const utilidadAnterior = ingresosAnteriores - gastosAnteriores;
    const variacionUtilidad = ingresosAnteriores > 0 ? ((utilidadActual - utilidadAnterior) / ingresosAnteriores) * 100 : 0;

    const variacionIngresos = ingresosAnteriores > 0 ? ((ingresosActuales - ingresosAnteriores) / ingresosAnteriores) * 100 : 0;
    const variacionGastos = gastosAnteriores > 0 ? ((gastosActuales - gastosAnteriores) / gastosAnteriores) * 100 : 0;

    res.json({
      success: true,
      data: {
        // Información del período
        periodo: {
          mes: mesConsulta,
          ano: anoConsulta,
          nombre: fechaInicio.format('MMMM YYYY'),
          fechaInicio: fechaInicio.format('YYYY-MM-DD'),
          fechaFin: fechaFin.format('YYYY-MM-DD')
        },

        // Métricas principales
        metricas: {
          totalPacientes,
          pacientesNuevosEsteMes,
          variacionPacientes: pacientesNuevosMesAnterior > 0 
            ? ((pacientesNuevosEsteMes - pacientesNuevosMesAnterior) / pacientesNuevosMesAnterior) * 100 
            : 0,
          
          citasHoy: await prisma.cita.count({
            where:{
              usuarioId: req.user.id,
              fecha: {
                gte: moment().startOf('day').toDate(),
                lte: moment().endOf('day').toDate()
              },
              estado:{
                in:['programada']
              }
            }
          }),



          totalCitasEsteMes,
          citasCompletadasEsteMes,
          citasCanceladasEsteMes,
          proximasCitas,
          tasaCompletacion: totalCitasEsteMes > 0 
            ? (citasCompletadasEsteMes / totalCitasEsteMes) * 100 
            : 0,
          
          totalIngresos: ingresosActuales,
          totalGastos: gastosActuales,
          utilidad: utilidadActual,
          variacionIngresos,
          variacionGastos,
          variacionUtilidad,
          
          totalRecetasEsteMes
        },

        // Top pacientes
        topPacientes: topPacientes.map(paciente => ({
          id: paciente.id,
          nombre: `${paciente.nombre} ${paciente.apellido}`,
          totalCitas: paciente._count.citas
        })),

        // Distribución de ingresos
        ingresosPorCategoria: ingresosPorCategoria.map(item => ({
          categoria: item.categoria,
          total: item._sum.monto,
          cantidad: item._count,
          porcentaje: ingresosActuales > 0 ? ((item._sum.monto / ingresosActuales) * 100).toFixed(2) : 0
        })),

        // Distribución de gastos
        gastosPorCategoria: gastosPorCategoria.map(item => ({
          categoria: item.categoria,
          total: item._sum.monto,
          cantidad: item._count,
          porcentaje: gastosActuales > 0 ? ((item._sum.monto / gastosActuales) * 100).toFixed(2) : 0
        }))
      }
    });

  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener datos para gráficos
router.get('/graficos', [
  query('tipo').isIn(['ingresos', 'gastos', 'citas', 'pacientes']),
  query('periodo').optional().isIn(['mes', 'trimestre', 'semestre', 'ano']),
  query('mes').optional().isInt({ min: 1, max: 12 }),
  query('ano').optional().isInt({ min: 2020, max: 2030 })
], async (req, res) => {
  try {
    const { tipo, periodo = 'mes', mes, ano } = req.query;
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

    let datos;

    switch (tipo) {
      case 'ingresos':
        datos = await prisma.ingreso.groupBy({
          by: ['fecha'],
          where: {
            usuarioId: req.user.id,
            fecha: {
              gte: fechaInicio.toDate(),
              lte: fechaFin.toDate()
            }
          },
          _sum: { monto: true },
          orderBy: { fecha: 'asc' }
        });
        break;

      case 'gastos':
        datos = await prisma.gasto.groupBy({
          by: ['fecha'],
          where: {
            usuarioId: req.user.id,
            fecha: {
              gte: fechaInicio.toDate(),
              lte: fechaFin.toDate()
            }
          },
          _sum: { monto: true },
          orderBy: { fecha: 'asc' }
        });
        break;

      case 'citas':
        datos = await prisma.cita.groupBy({
          by: ['fecha', 'estado'],
          where: {
            usuarioId: req.user.id,
            fecha: {
              gte: fechaInicio.toDate(),
              lte: fechaFin.toDate()
            }
          },
          _count: true,
          orderBy: { fecha: 'asc' }
        });
        break;

      case 'pacientes':
        datos = await prisma.paciente.groupBy({
          by: ['createdAt'],
          where: {
            usuarioId: req.user.id,
            createdAt: {
              gte: fechaInicio.toDate(),
              lte: fechaFin.toDate()
            }
          },
          _count: true,
          orderBy: { createdAt: 'asc' }
        });
        break;
    }

    res.json({
      success: true,
      data: {
        tipo,
        periodo,
        datos: datos.map(item => ({
          fecha: item.fecha || item.createdAt,
          valor: item._sum?.monto || item._count,
          estado: item.estado
        }))
      }
    });

  } catch (error) {
    console.error('Error al obtener datos de gráficos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener alertas y notificaciones
router.get('/alertas', async (req, res) => {
  try {
    const fechaActual = new Date();
    const fechaLimite = moment().add(7, 'days').toDate();

    const [
      citasProximas,
      pacientesSinCitas,
      gastosAltos,
      ingresosBajos
    ] = await Promise.all([
      // Citas próximas (próximos 7 días)
      prisma.cita.findMany({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaActual,
            lte: fechaLimite
          },
          estado: {
            in: ['programada', 'confirmada']
          }
        },
        include: {
          paciente: {
            select: {
              nombre: true,
              apellido: true,
              telefono: true
            }
          }
        },
        orderBy: { fecha: 'asc' }
      }),

      // Pacientes sin citas en los últimos 30 días
      prisma.paciente.findMany({
        where: {
          usuarioId: req.user.id,
          citas: {
            none: {
              fecha: {
                gte: moment().subtract(30, 'days').toDate()
              }
            }
          }
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          telefono: true,
          email: true
        },
        take: 10
      }),

      // Gastos altos este mes (más del promedio)
      prisma.gasto.findMany({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: moment().startOf('month').toDate(),
            lte: moment().endOf('month').toDate()
          }
        },
        orderBy: { monto: 'desc' },
        take: 5
      }),

      // Ingresos bajos este mes
      prisma.ingreso.findMany({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: moment().startOf('month').toDate(),
            lte: moment().endOf('month').toDate()
          }
        },
        orderBy: { monto: 'asc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        citasProximas: citasProximas.map(cita => ({
          id: cita.id,
          fecha: cita.fecha,
          hora: cita.hora,
          paciente: `${cita.paciente.nombre} ${cita.paciente.apellido}`,
          telefono: cita.paciente.telefono,
          motivo: cita.motivo
        })),
        pacientesSinCitas: pacientesSinCitas.map(paciente => ({
          id: paciente.id,
          nombre: `${paciente.nombre} ${paciente.apellido}`,
          telefono: paciente.telefono,
          email: paciente.email
        })),
        gastosAltos: gastosAltos.map(gasto => ({
          id: gasto.id,
          descripcion: gasto.descripcion,
          monto: gasto.monto,
          categoria: gasto.categoria,
          fecha: gasto.fecha
        })),
        ingresosBajos: ingresosBajos.map(ingreso => ({
          id: ingreso.id,
          descripcion: ingreso.descripcion,
          monto: ingreso.monto,
          categoria: ingreso.categoria,
          fecha: ingreso.fecha
        }))
      }
    });

  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 