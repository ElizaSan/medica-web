const express = require('express');
const { query } = require('express-validator');
const ExcelJS = require('exceljs');
const moment = require('moment');
const prisma = require('../database/client');

const router = express.Router();

// Generar reporte financiero en Excel
router.get('/financiero/excel', [
  query('mes').optional().isInt({ min: 1, max: 12 }),
  query('ano').optional().isInt({ min: 2020, max: 2030 }),
  query('tipo').optional().isIn(['ingresos', 'gastos', 'ambos'])
], async (req, res) => {
  try {
    const { mes, ano, tipo = 'ambos' } = req.query;
    const fechaActual = moment();
    const mesConsulta = mes ? parseInt(mes) : fechaActual.month() + 1;
    const anoConsulta = ano ? parseInt(ano) : fechaActual.year();

    const fechaInicio = moment([anoConsulta, mesConsulta - 1, 1]);
    const fechaFin = moment([anoConsulta, mesConsulta - 1, 1]).endOf('month');

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Médicos';
    workbook.lastModifiedBy = req.user.nombre;
    workbook.created = new Date();
    workbook.modified = new Date();

    // Hoja de resumen
    const resumenSheet = workbook.addWorksheet('Resumen Financiero');
    
    // Estilos
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } },
      alignment: { horizontal: 'center' }
    };

    const titleStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center' }
    };

    // Título
    resumenSheet.mergeCells('A1:D1');
    resumenSheet.getCell('A1').value = `Reporte Financiero - ${fechaInicio.format('MMMM YYYY')}`;
    resumenSheet.getCell('A1').style = titleStyle;

    // Obtener datos
    const [
      totalIngresos,
      totalGastos,
      ingresosPorCategoria,
      gastosPorCategoria,
      ingresosPorDia,
      gastosPorDia
    ] = await Promise.all([
      prisma.ingreso.aggregate({
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
      prisma.gasto.aggregate({
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
        _sum: { monto: true }
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
        _sum: { monto: true }
      })
    ]);

    const ingresosTotal = totalIngresos._sum.monto || 0;
    const gastosTotal = totalGastos._sum.monto || 0;
    const utilidad = ingresosTotal - gastosTotal;

    // Resumen general
    resumenSheet.getCell('A3').value = 'RESUMEN GENERAL';
    resumenSheet.getCell('A3').style = headerStyle;
    resumenSheet.mergeCells('A3:D3');

    resumenSheet.getCell('A4').value = 'Concepto';
    resumenSheet.getCell('B4').value = 'Cantidad';
    resumenSheet.getCell('C4').value = 'Total';
    resumenSheet.getCell('D4').value = 'Promedio';
    [resumenSheet.getCell('A4'), resumenSheet.getCell('B4'), resumenSheet.getCell('C4'), resumenSheet.getCell('D4')].forEach(cell => {
      cell.style = headerStyle;
    });

    resumenSheet.getCell('A5').value = 'Ingresos';
    resumenSheet.getCell('B5').value = totalIngresos._count;
    resumenSheet.getCell('C5').value = ingresosTotal;
    resumenSheet.getCell('D5').value = totalIngresos._count > 0 ? ingresosTotal / totalIngresos._count : 0;

    resumenSheet.getCell('A6').value = 'Gastos';
    resumenSheet.getCell('B6').value = totalGastos._count;
    resumenSheet.getCell('C6').value = gastosTotal;
    resumenSheet.getCell('D6').value = totalGastos._count > 0 ? gastosTotal / totalGastos._count : 0;

    resumenSheet.getCell('A7').value = 'Utilidad';
    resumenSheet.getCell('B7').value = '';
    resumenSheet.getCell('C7').value = utilidad;
    resumenSheet.getCell('D7').value = '';

    // Formatear números
    resumenSheet.getCell('C5').numFmt = '"$"#,##0.00';
    resumenSheet.getCell('D5').numFmt = '"$"#,##0.00';
    resumenSheet.getCell('C6').numFmt = '"$"#,##0.00';
    resumenSheet.getCell('D6').numFmt = '"$"#,##0.00';
    resumenSheet.getCell('C7').numFmt = '"$"#,##0.00';

    // Ingresos por categoría
    if (tipo === 'ingresos' || tipo === 'ambos') {
      resumenSheet.getCell('A9').value = 'INGRESOS POR CATEGORÍA';
      resumenSheet.getCell('A9').style = headerStyle;
      resumenSheet.mergeCells('A9:D9');

      resumenSheet.getCell('A10').value = 'Categoría';
      resumenSheet.getCell('B10').value = 'Cantidad';
      resumenSheet.getCell('C10').value = 'Total';
      resumenSheet.getCell('D10').value = 'Porcentaje';
      [resumenSheet.getCell('A10'), resumenSheet.getCell('B10'), resumenSheet.getCell('C10'), resumenSheet.getCell('D10')].forEach(cell => {
        cell.style = headerStyle;
      });

      ingresosPorCategoria.forEach((item, index) => {
        const row = 11 + index;
        resumenSheet.getCell(`A${row}`).value = item.categoria;
        resumenSheet.getCell(`B${row}`).value = item._count;
        resumenSheet.getCell(`C${row}`).value = item._sum.monto;
        resumenSheet.getCell(`D${row}`).value = ingresosTotal > 0 ? (item._sum.monto / ingresosTotal) * 100 : 0;
        resumenSheet.getCell(`C${row}`).numFmt = '"$"#,##0.00';
        resumenSheet.getCell(`D${row}`).numFmt = '0.00"%"';
      });
    }

    // Gastos por categoría
    if (tipo === 'gastos' || tipo === 'ambos') {
      const startRow = tipo === 'ambos' ? 9 + ingresosPorCategoria.length + 3 : 9;
      resumenSheet.getCell(`A${startRow}`).value = 'GASTOS POR CATEGORÍA';
      resumenSheet.getCell(`A${startRow}`).style = headerStyle;
      resumenSheet.mergeCells(`A${startRow}:D${startRow}`);

      resumenSheet.getCell(`A${startRow + 1}`).value = 'Categoría';
      resumenSheet.getCell(`B${startRow + 1}`).value = 'Cantidad';
      resumenSheet.getCell(`C${startRow + 1}`).value = 'Total';
      resumenSheet.getCell(`D${startRow + 1}`).value = 'Porcentaje';
      [resumenSheet.getCell(`A${startRow + 1}`), resumenSheet.getCell(`B${startRow + 1}`), resumenSheet.getCell(`C${startRow + 1}`), resumenSheet.getCell(`D${startRow + 1}`)].forEach(cell => {
        cell.style = headerStyle;
      });

      gastosPorCategoria.forEach((item, index) => {
        const row = startRow + 2 + index;
        resumenSheet.getCell(`A${row}`).value = item.categoria;
        resumenSheet.getCell(`B${row}`).value = item._count;
        resumenSheet.getCell(`C${row}`).value = item._sum.monto;
        resumenSheet.getCell(`D${row}`).value = gastosTotal > 0 ? (item._sum.monto / gastosTotal) * 100 : 0;
        resumenSheet.getCell(`C${row}`).numFmt = '"$"#,##0.00';
        resumenSheet.getCell(`D${row}`).numFmt = '0.00"%"';
      });
    }

    // Ajustar columnas
    resumenSheet.columns.forEach(column => {
      column.width = 15;
    });

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_financiero_${fechaInicio.format('YYYY-MM')}.xlsx"`);

    // Escribir archivo
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error al generar reporte Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte'
    });
  }
});

// Generar reporte de citas en Excel
router.get('/citas/excel', [
  query('mes').optional().isInt({ min: 1, max: 12 }),
  query('ano').optional().isInt({ min: 2020, max: 2030 }),
  query('estado').optional().isIn(['programada', 'confirmada', 'cancelada', 'completada'])
], async (req, res) => {
  try {
    const { mes, ano, estado } = req.query;
    const fechaActual = moment();
    const mesConsulta = mes ? parseInt(mes) : fechaActual.month() + 1;
    const anoConsulta = ano ? parseInt(ano) : fechaActual.year();

    const fechaInicio = moment([anoConsulta, mesConsulta - 1, 1]);
    const fechaFin = moment([anoConsulta, mesConsulta - 1, 1]).endOf('month');

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Médicos';
    workbook.lastModifiedBy = req.user.nombre;
    workbook.created = new Date();
    workbook.modified = new Date();

    // Hoja de citas
    const citasSheet = workbook.addWorksheet('Reporte de Citas');

    // Estilos
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } },
      alignment: { horizontal: 'center' }
    };

    const titleStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center' }
    };

    // Título
    citasSheet.mergeCells('A1:G1');
    citasSheet.getCell('A1').value = `Reporte de Citas - ${fechaInicio.format('MMMM YYYY')}`;
    citasSheet.getCell('A1').style = titleStyle;

    // Headers
    const headers = ['Fecha', 'Hora', 'Paciente', 'Teléfono', 'Motivo', 'Estado', 'Duración (min)'];
    headers.forEach((header, index) => {
      const cell = citasSheet.getCell(2, index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    // Obtener citas
    const where = {
      usuarioId: req.user.id,
      fecha: {
        gte: fechaInicio.toDate(),
        lte: fechaFin.toDate()
      }
    };

    if (estado) where.estado = estado;

    const citas = await prisma.cita.findMany({
      where,
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
    });

    // Llenar datos
    citas.forEach((cita, index) => {
      const row = index + 3;
      citasSheet.getCell(row, 1).value = moment(cita.fecha).format('DD/MM/YYYY');
      citasSheet.getCell(row, 2).value = cita.hora;
      citasSheet.getCell(row, 3).value = `${cita.paciente.nombre} ${cita.paciente.apellido}`;
      citasSheet.getCell(row, 4).value = cita.paciente.telefono || '';
      citasSheet.getCell(row, 5).value = cita.motivo || '';
      citasSheet.getCell(row, 6).value = cita.estado;
      citasSheet.getCell(row, 7).value = cita.duracion;
    });

    // Estadísticas
    const totalCitas = citas.length;
    const citasCompletadas = citas.filter(c => c.estado === 'completada').length;
    const citasCanceladas = citas.filter(c => c.estado === 'cancelada').length;
    const tasaCompletacion = totalCitas > 0 ? (citasCompletadas / totalCitas) * 100 : 0;

    const statsRow = citas.length + 4;
    citasSheet.getCell(statsRow, 1).value = 'ESTADÍSTICAS';
    citasSheet.getCell(statsRow, 1).style = headerStyle;
    citasSheet.mergeCells(statsRow, 1, statsRow, 7);

    citasSheet.getCell(statsRow + 1, 1).value = 'Total de citas:';
    citasSheet.getCell(statsRow + 1, 2).value = totalCitas;
    citasSheet.getCell(statsRow + 2, 1).value = 'Citas completadas:';
    citasSheet.getCell(statsRow + 2, 2).value = citasCompletadas;
    citasSheet.getCell(statsRow + 3, 1).value = 'Citas canceladas:';
    citasSheet.getCell(statsRow + 3, 2).value = citasCanceladas;
    citasSheet.getCell(statsRow + 4, 1).value = 'Tasa de completación:';
    citasSheet.getCell(statsRow + 4, 2).value = tasaCompletacion;
    citasSheet.getCell(statsRow + 4, 2).numFmt = '0.00"%"';

    // Ajustar columnas
    citasSheet.columns.forEach(column => {
      column.width = 15;
    });

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_citas_${fechaInicio.format('YYYY-MM')}.xlsx"`);

    // Escribir archivo
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error al generar reporte de citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte'
    });
  }
});

// Generar reporte de pacientes en Excel
router.get('/pacientes/excel', async (req, res) => {
  try {
    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Médicos';
    workbook.lastModifiedBy = req.user.nombre;
    workbook.created = new Date();
    workbook.modified = new Date();

    // Hoja de pacientes
    const pacientesSheet = workbook.addWorksheet('Reporte de Pacientes');

    // Estilos
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } },
      alignment: { horizontal: 'center' }
    };

    const titleStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center' }
    };

    // Título
    pacientesSheet.mergeCells('A1:H1');
    pacientesSheet.getCell('A1').value = 'Reporte de Pacientes';
    pacientesSheet.getCell('A1').style = titleStyle;

    // Headers
    const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Fecha Nacimiento', 'Género', 'Dirección', 'Total Citas'];
    headers.forEach((header, index) => {
      const cell = pacientesSheet.getCell(2, index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    // Obtener pacientes con estadísticas
    const pacientes = await prisma.paciente.findMany({
      where: { usuarioId: req.user.id },
      include: {
        _count: {
          select: {
            citas: true,
            recetas: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Llenar datos
    pacientes.forEach((paciente, index) => {
      const row = index + 3;
      pacientesSheet.getCell(row, 1).value = paciente.nombre;
      pacientesSheet.getCell(row, 2).value = paciente.apellido;
      pacientesSheet.getCell(row, 3).value = paciente.email || '';
      pacientesSheet.getCell(row, 4).value = paciente.telefono || '';
      pacientesSheet.getCell(row, 5).value = paciente.fechaNacimiento ? moment(paciente.fechaNacimiento).format('DD/MM/YYYY') : '';
      pacientesSheet.getCell(row, 6).value = paciente.genero || '';
      pacientesSheet.getCell(row, 7).value = paciente.direccion || '';
      pacientesSheet.getCell(row, 8).value = paciente._count.citas;
    });

    // Estadísticas
    const totalPacientes = pacientes.length;
    const pacientesConCitas = pacientes.filter(p => p._count.citas > 0).length;
    const pacientesSinCitas = totalPacientes - pacientesConCitas;
    const promedioCitas = totalPacientes > 0 ? pacientes.reduce((sum, p) => sum + p._count.citas, 0) / totalPacientes : 0;

    const statsRow = pacientes.length + 4;
    pacientesSheet.getCell(statsRow, 1).value = 'ESTADÍSTICAS';
    pacientesSheet.getCell(statsRow, 1).style = headerStyle;
    pacientesSheet.mergeCells(statsRow, 1, statsRow, 8);

    pacientesSheet.getCell(statsRow + 1, 1).value = 'Total de pacientes:';
    pacientesSheet.getCell(statsRow + 1, 2).value = totalPacientes;
    pacientesSheet.getCell(statsRow + 2, 1).value = 'Pacientes con citas:';
    pacientesSheet.getCell(statsRow + 2, 2).value = pacientesConCitas;
    pacientesSheet.getCell(statsRow + 3, 1).value = 'Pacientes sin citas:';
    pacientesSheet.getCell(statsRow + 3, 2).value = pacientesSinCitas;
    pacientesSheet.getCell(statsRow + 4, 1).value = 'Promedio de citas por paciente:';
    pacientesSheet.getCell(statsRow + 4, 2).value = promedioCitas;
    pacientesSheet.getCell(statsRow + 4, 2).numFmt = '0.00';

    // Ajustar columnas
    pacientesSheet.columns.forEach(column => {
      column.width = 15;
    });

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_pacientes_${moment().format('YYYY-MM-DD')}.xlsx"`);

    // Escribir archivo
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error al generar reporte de pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte'
    });
  }
});

// Generar reporte completo en Excel
router.get('/completo/excel', [
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

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Médicos';
    workbook.lastModifiedBy = req.user.nombre;
    workbook.created = new Date();
    workbook.modified = new Date();

    // Obtener todos los datos
    const [
      ingresos,
      gastos,
      citas,
      pacientes,
      recetas
    ] = await Promise.all([
      prisma.ingreso.findMany({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        include: {
          paciente: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        },
        orderBy: { fecha: 'desc' }
      }),
      prisma.gasto.findMany({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        orderBy: { fecha: 'desc' }
      }),
      prisma.cita.findMany({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        include: {
          paciente: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        },
        orderBy: { fecha: 'desc' }
      }),
      prisma.paciente.findMany({
        where: { usuarioId: req.user.id },
        include: {
          _count: {
            select: {
              citas: true,
              recetas: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.receta.findMany({
        where: {
          usuarioId: req.user.id,
          fecha: {
            gte: fechaInicio.toDate(),
            lte: fechaFin.toDate()
          }
        },
        include: {
          paciente: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        },
        orderBy: { fecha: 'desc' }
      })
    ]);

    // Crear hojas
    const hojas = [
      { nombre: 'Resumen', datos: [] },
      { nombre: 'Ingresos', datos: ingresos },
      { nombre: 'Gastos', datos: gastos },
      { nombre: 'Citas', datos: citas },
      { nombre: 'Pacientes', datos: pacientes },
      { nombre: 'Recetas', datos: recetas }
    ];

    hojas.forEach(hoja => {
      const worksheet = workbook.addWorksheet(hoja.nombre);
      
      if (hoja.nombre === 'Resumen') {
        // Crear resumen ejecutivo
        const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
        const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
        const utilidad = totalIngresos - totalGastos;

        worksheet.getCell('A1').value = 'RESUMEN EJECUTIVO';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.mergeCells('A1:C1');

        worksheet.getCell('A3').value = 'Período:';
        worksheet.getCell('B3').value = fechaInicio.format('MMMM YYYY');
        worksheet.getCell('A4').value = 'Total Ingresos:';
        worksheet.getCell('B4').value = totalIngresos;
        worksheet.getCell('B4').numFmt = '"$"#,##0.00';
        worksheet.getCell('A5').value = 'Total Gastos:';
        worksheet.getCell('B5').value = totalGastos;
        worksheet.getCell('B5').numFmt = '"$"#,##0.00';
        worksheet.getCell('A6').value = 'Utilidad:';
        worksheet.getCell('B6').value = utilidad;
        worksheet.getCell('B6').numFmt = '"$"#,##0.00';
        worksheet.getCell('A7').value = 'Total Citas:';
        worksheet.getCell('B7').value = citas.length;
        worksheet.getCell('A8').value = 'Total Pacientes:';
        worksheet.getCell('B8').value = pacientes.length;
        worksheet.getCell('A9').value = 'Total Recetas:';
        worksheet.getCell('B9').value = recetas.length;
      } else {
        // Crear headers según el tipo de datos
        const headers = getHeadersForSheet(hoja.nombre);
        headers.forEach((header, index) => {
          const cell = worksheet.getCell(1, index + 1);
          cell.value = header;
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
          cell.font.color = { argb: 'FFFFFF' };
        });

        // Llenar datos
        hoja.datos.forEach((item, rowIndex) => {
          const row = rowIndex + 2;
          const values = getValuesForSheet(hoja.nombre, item);
          values.forEach((value, colIndex) => {
            const cell = worksheet.getCell(row, colIndex + 1);
            cell.value = value;
          });
        });
      }

      // Ajustar columnas
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
    });

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_completo_${fechaInicio.format('YYYY-MM')}.xlsx"`);

    // Escribir archivo
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error al generar reporte completo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte'
    });
  }
});

// Funciones auxiliares para generar reportes
function getHeadersForSheet(sheetName) {
  switch (sheetName) {
    case 'Ingresos':
      return ['Fecha', 'Descripción', 'Monto', 'Categoría', 'Método Pago', 'Paciente'];
    case 'Gastos':
      return ['Fecha', 'Descripción', 'Monto', 'Categoría', 'Notas'];
    case 'Citas':
      return ['Fecha', 'Hora', 'Paciente', 'Motivo', 'Estado', 'Duración'];
    case 'Pacientes':
      return ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Total Citas', 'Total Recetas'];
    case 'Recetas':
      return ['Fecha', 'Paciente', 'Diagnóstico', 'Medicamentos', 'Próxima Cita'];
    default:
      return [];
  }
}

function getValuesForSheet(sheetName, item) {
  switch (sheetName) {
    case 'Ingresos':
      return [
        moment(item.fecha).format('DD/MM/YYYY'),
        item.descripcion,
        item.monto,
        item.categoria,
        item.metodoPago,
        item.paciente ? `${item.paciente.nombre} ${item.paciente.apellido}` : ''
      ];
    case 'Gastos':
      return [
        moment(item.fecha).format('DD/MM/YYYY'),
        item.descripcion,
        item.monto,
        item.categoria,
        item.notas || ''
      ];
    case 'Citas':
      return [
        moment(item.fecha).format('DD/MM/YYYY'),
        item.hora,
        `${item.paciente.nombre} ${item.paciente.apellido}`,
        item.motivo || '',
        item.estado,
        item.duracion
      ];
    case 'Pacientes':
      return [
        item.nombre,
        item.apellido,
        item.email || '',
        item.telefono || '',
        item._count.citas,
        item._count.recetas
      ];
    case 'Recetas':
      return [
        moment(item.fecha).format('DD/MM/YYYY'),
        `${item.paciente.nombre} ${item.paciente.apellido}`,
        item.diagnostico,
        item.medicamentos,
        item.proximaCita ? moment(item.proximaCita).format('DD/MM/YYYY') : ''
      ];
    default:
      return [];
  }
}

module.exports = router; 