const express = require('express');
const { body, validationResult, query } = require('express-validator');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const prisma = require('../database/client');

const router = express.Router();

// Obtener todas las recetas del usuario
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('pacienteId').optional().notEmpty(),
  query('fechaInicio').optional().isISO8601(),
  query('fechaFin').optional().isISO8601()
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      pacienteId, 
      fechaInicio, 
      fechaFin 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      usuarioId: req.user.id
    };

    if (pacienteId) where.pacienteId = pacienteId;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const [recetas, total] = await Promise.all([
      prisma.receta.findMany({
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
              telefono: true,
              email: true,
              fechaNacimiento: true
            }
          }
        }
      }),
      prisma.receta.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        recetas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener recetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener una receta específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const receta = await prisma.receta.findFirst({
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
            direccion: true,
            alergias: true
          }
        }
      }
    });

    if (!receta) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    res.json({
      success: true,
      data: { receta }
    });

  } catch (error) {
    console.error('Error al obtener receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva receta
router.post('/', [
  body('diagnostico').notEmpty().trim(),
  body('medicamentos').notEmpty().trim(),
  body('indicaciones').notEmpty().trim(),
  body('observaciones').optional().trim(),
  body('proximaCita').optional().isISO8601(),
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
      diagnostico,
      medicamentos,
      indicaciones,
      observaciones,
      proximaCita,
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

    const receta = await prisma.receta.create({
      data: {
        diagnostico,
        medicamentos,
        indicaciones,
        observaciones,
        proximaCita: proximaCita ? new Date(proximaCita) : null,
        usuarioId: req.user.id,
        pacienteId
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
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Receta creada exitosamente',
      data: { receta }
    });

  } catch (error) {
    console.error('Error al crear receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar receta
router.put('/:id', [
  body('diagnostico').optional().notEmpty().trim(),
  body('medicamentos').optional().notEmpty().trim(),
  body('indicaciones').optional().notEmpty().trim(),
  body('observaciones').optional().trim(),
  body('proximaCita').optional().isISO8601()
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
    
    if (updateData.proximaCita) {
      updateData.proximaCita = new Date(updateData.proximaCita);
    }

    const receta = await prisma.receta.updateMany({
      where: {
        id,
        usuarioId: req.user.id
      },
      data: updateData
    });

    if (receta.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    const recetaActualizada = await prisma.receta.findUnique({
      where: { id },
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
      message: 'Receta actualizada exitosamente',
      data: { receta: recetaActualizada }
    });

  } catch (error) {
    console.error('Error al actualizar receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar receta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const receta = await prisma.receta.deleteMany({
      where: {
        id,
        usuarioId: req.user.id
      }
    });

    if (receta.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Receta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar PDF de receta
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    const receta = await prisma.receta.findFirst({
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
            direccion: true,
            alergias: true
          }
        },
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            especialidad: true,
            telefono: true,
            direccion: true
          }
        }
      }
    });

    if (!receta) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    // Crear documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receta_${receta.paciente.apellido}_${moment(receta.fecha).format('YYYY-MM-DD')}.pdf"`);

    // Pipe el PDF a la respuesta
    doc.pipe(res);

    // Contenido del PDF
    const fecha = moment(receta.fecha).format('DD/MM/YYYY');
    const edad = receta.paciente.fechaNacimiento 
      ? moment().diff(moment(receta.paciente.fechaNacimiento), 'years') 
      : 'N/A';

    // Encabezado
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('RECETA MÉDICA', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Fecha: ${fecha}`, { align: 'right' })
       .moveDown(1);

    // Información del médico
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('MÉDICO TRATANTE:')
       .moveDown(0.3);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Dr. ${receta.usuario.nombre} ${receta.usuario.apellido}`)
       .text(`Especialidad: ${receta.usuario.especialidad || 'No especificada'}`)
       .text(`Teléfono: ${receta.usuario.telefono || 'No especificado'}`)
       .text(`Dirección: ${receta.usuario.direccion || 'No especificada'}`)
       .moveDown(1);

    // Información del paciente
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('DATOS DEL PACIENTE:')
       .moveDown(0.3);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Nombre: ${receta.paciente.nombre} ${receta.paciente.apellido}`)
       .text(`Edad: ${edad} años`)
       .text(`Teléfono: ${receta.paciente.telefono || 'No especificado'}`)
       .text(`Dirección: ${receta.paciente.direccion || 'No especificada'}`);

    if (receta.paciente.alergias) {
      doc.text(`Alergias: ${receta.paciente.alergias}`);
    }
    doc.moveDown(1);

    // Diagnóstico
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('DIAGNÓSTICO:')
       .moveDown(0.3);

    doc.fontSize(12)
       .font('Helvetica')
       .text(receta.diagnostico)
       .moveDown(1);

    // Medicamentos
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('MEDICAMENTOS:')
       .moveDown(0.3);

    doc.fontSize(12)
       .font('Helvetica')
       .text(receta.medicamentos)
       .moveDown(1);

    // Indicaciones
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INDICACIONES:')
       .moveDown(0.3);

    doc.fontSize(12)
       .font('Helvetica')
       .text(receta.indicaciones)
       .moveDown(1);

    // Observaciones
    if (receta.observaciones) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('OBSERVACIONES:')
         .moveDown(0.3);

      doc.fontSize(12)
         .font('Helvetica')
         .text(receta.observaciones)
         .moveDown(1);
    }

    // Próxima cita
    if (receta.proximaCita) {
      const proximaCita = moment(receta.proximaCita).format('DD/MM/YYYY');
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('PRÓXIMA CITA:')
         .moveDown(0.3);

      doc.fontSize(12)
         .font('Helvetica')
         .text(proximaCita)
         .moveDown(1);
    }

    // Pie de página
    doc.moveDown(2);
    doc.fontSize(10)
       .font('Helvetica')
       .text('Este documento es confidencial y está destinado únicamente al paciente.', { align: 'center' })
       .moveDown(0.5);
    doc.text('Firma del médico: ___________________________', { align: 'center' });

    // Finalizar el documento
    doc.end();

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar PDF'
    });
  }
});

// Obtener estadísticas de recetas
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
      totalRecetas,
      recetasEsteMes,
      pacientesConRecetas
    ] = await Promise.all([
      prisma.receta.count({
        where: { usuarioId: req.user.id }
      }),
      prisma.receta.count({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        }
      }),
      prisma.receta.groupBy({
        by: ['pacienteId'],
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        totalRecetas,
        recetasEsteMes,
        pacientesConRecetas: pacientesConRecetas.length,
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