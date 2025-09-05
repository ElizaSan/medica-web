const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const prisma = require('../database/client');

const router = express.Router();

// Obtener perfil del usuario actual
router.get('/perfil', async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        especialidad: true,
        telefono: true,
        direccion: true,
        fechaNacimiento: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: { usuario }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar perfil del usuario
router.put('/perfil', [
  body('nombre').optional().notEmpty().trim(),
  body('apellido').optional().notEmpty().trim(),
  body('especialidad').optional().trim(),
  body('telefono').optional().trim(),
  body('direccion').optional().trim(),
  body('fechaNacimiento').optional().isISO8601()
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

    const updateData = { ...req.body };
    
    if (updateData.fechaNacimiento) {
      updateData.fechaNacimiento = new Date(updateData.fechaNacimiento);
    }

    const usuario = await prisma.usuario.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        especialidad: true,
        telefono: true,
        direccion: true,
        fechaNacimiento: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { usuario }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Cambiar contraseña
router.put('/cambiar-password', [
  body('passwordActual').notEmpty(),
  body('passwordNuevo').isLength({ min: 6 })
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

    const { passwordActual, passwordNuevo } = req.body;

    // Obtener usuario con contraseña
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValido) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(passwordNuevo, saltRounds);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas del usuario
router.get('/estadisticas', async (req, res) => {
  try {
    const [
      totalPacientes,
      totalCitas,
      totalIngresos,
      totalGastos,
      totalRecetas,
      citasEsteMes,
      ingresosEsteMes,
      gastosEsteMes
    ] = await Promise.all([
      prisma.paciente.count({
        where: { usuarioId: req.user.id }
      }),
      prisma.cita.count({
        where: { usuarioId: req.user.id }
      }),
      prisma.ingreso.aggregate({
        where: { usuarioId: req.user.id },
        _sum: { monto: true }
      }),
      prisma.gasto.aggregate({
        where: { usuarioId: req.user.id },
        _sum: { monto: true }
      }),
      prisma.receta.count({
        where: { usuarioId: req.user.id }
      }),
      prisma.cita.count({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.ingreso.aggregate({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { monto: true }
      }),
      prisma.gasto.aggregate({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { monto: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalPacientes,
        totalCitas,
        totalIngresos: totalIngresos._sum.monto || 0,
        totalGastos: totalGastos._sum.monto || 0,
        totalRecetas,
        citasEsteMes,
        ingresosEsteMes: ingresosEsteMes._sum.monto || 0,
        gastosEsteMes: gastosEsteMes._sum.monto || 0,
        utilidadTotal: (totalIngresos._sum.monto || 0) - (totalGastos._sum.monto || 0),
        utilidadEsteMes: (ingresosEsteMes._sum.monto || 0) - (gastosEsteMes._sum.monto || 0)
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