const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const moment = require('moment');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear o actualizar usuario médico de ejemplo
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const medico = await prisma.usuario.upsert({
    where: { email: 'dr.garcia@ejemplo.com' },
    update: {},
    create: {
      email: 'dr.garcia@ejemplo.com',
      password: hashedPassword,
      nombre: 'Carlos',
      apellido: 'García',
      especialidad: 'Medicina General',
      telefono: '+52 55 1234 5678',
      direccion: 'Av. Reforma 123, Ciudad de México',
      fechaNacimiento: new Date('1985-03-15')
    }
  });

  console.log('✅ Médico creado/actualizado:', medico.email);

  // Crear pacientes de ejemplo
  const pacientesData = [
    {
      nombre: 'María',
      apellido: 'López',
      email: 'maria.lopez@email.com',
      telefono: '+52 55 9876 5432',
      fechaNacimiento: new Date('1990-07-22'),
      genero: 'femenino',
      direccion: 'Calle Juárez 456, CDMX',
      historialMedico: 'Hipertensión controlada, alergia a penicilina',
      alergias: 'Penicilina, polen',
      usuarioId: medico.id
    },
    {
      nombre: 'Juan',
      apellido: 'Martínez',
      email: 'juan.martinez@email.com',
      telefono: '+52 55 8765 4321',
      fechaNacimiento: new Date('1988-11-10'),
      genero: 'masculino',
      direccion: 'Av. Insurgentes 789, CDMX',
      historialMedico: 'Diabetes tipo 2, controlado con dieta y medicación',
      alergias: 'Ninguna conocida',
      usuarioId: medico.id
    },
    {
      nombre: 'Ana',
      apellido: 'Rodríguez',
      email: 'ana.rodriguez@email.com',
      telefono: '+52 55 7654 3210',
      fechaNacimiento: new Date('1995-04-18'),
      genero: 'femenino',
      direccion: 'Calle Roma 321, CDMX',
      historialMedico: 'Salud general buena, chequeo rutinario',
      alergias: 'Polvo doméstico',
      usuarioId: medico.id
    },
    {
      nombre: 'Roberto',
      apellido: 'Hernández',
      email: 'roberto.hernandez@email.com',
      telefono: '+52 55 6543 2109',
      fechaNacimiento: new Date('1982-09-05'),
      genero: 'masculino',
      direccion: 'Av. Chapultepec 654, CDMX',
      historialMedico: 'Problemas de columna, hernia discal',
      alergias: 'Ninguna conocida',
      usuarioId: medico.id
    },
    {
      nombre: 'Carmen',
      apellido: 'González',
      email: 'carmen.gonzalez@email.com',
      telefono: '+52 55 5432 1098',
      fechaNacimiento: new Date('1975-12-30'),
      genero: 'femenino',
      direccion: 'Calle Condesa 987, CDMX',
      historialMedico: 'Artritis reumatoide, osteoporosis',
      alergias: 'Sulfamidas',
      usuarioId: medico.id
    }
  ];

  // Crear pacientes usando createMany con skipDuplicates
  try {
    await prisma.paciente.createMany({
      data: pacientesData,
      skipDuplicates: true
    });
    console.log('✅ Pacientes creados/actualizados');
  } catch (error) {
    console.log('⚠️ Algunos pacientes ya existen, continuando...');
  }

  // Obtener los pacientes creados
  const pacientes = await prisma.paciente.findMany({
    where: { usuarioId: medico.id }
  });

  console.log('✅ Pacientes disponibles:', pacientes.length);

  // Crear citas de ejemplo
  const citasData = [
    {
      fecha: moment().add(1, 'day').toDate(),
      hora: '09:00',
      duracion: 30,
      motivo: 'Control de hipertensión',
      estado: 'confirmada',
      notas: 'Traer resultados de análisis de sangre',
      usuarioId: medico.id,
      pacienteId: pacientes[0]?.id
    },
    {
      fecha: moment().add(2, 'day').toDate(),
      hora: '10:30',
      duracion: 45,
      motivo: 'Control de diabetes',
      estado: 'programada',
      notas: 'Revisar niveles de glucosa',
      usuarioId: medico.id,
      pacienteId: pacientes[1]?.id
    },
    {
      fecha: moment().add(3, 'day').toDate(),
      hora: '14:00',
      duracion: 30,
      motivo: 'Chequeo rutinario',
      estado: 'programada',
      notas: 'Examen físico general',
      usuarioId: medico.id,
      pacienteId: pacientes[2]?.id
    },
    {
      fecha: moment().subtract(1, 'day').toDate(),
      hora: '11:00',
      duracion: 60,
      motivo: 'Dolor de espalda',
      estado: 'completada',
      notas: 'Paciente refiere dolor lumbar intenso',
      usuarioId: medico.id,
      pacienteId: pacientes[3]?.id
    },
    {
      fecha: moment().subtract(2, 'day').toDate(),
      hora: '16:00',
      duracion: 45,
      motivo: 'Control de artritis',
      estado: 'completada',
      notas: 'Mejora en movilidad articular',
      usuarioId: medico.id,
      pacienteId: pacientes[4]?.id
    }
  ].filter(cita => cita.pacienteId); // Solo citas con pacientes válidos

  try {
    await prisma.cita.createMany({
      data: citasData,
      skipDuplicates: true
    });
    console.log('✅ Citas creadas/actualizadas');
  } catch (error) {
    console.log('⚠️ Algunas citas ya existen, continuando...');
  }

  // Obtener las citas creadas
  const citas = await prisma.cita.findMany({
    where: { usuarioId: medico.id }
  });

  console.log('✅ Citas disponibles:', citas.length);

  // Crear gastos de ejemplo
  const gastosData = [
    {
      descripcion: 'Renta del consultorio',
      monto: 15000.00,
      categoria: 'consultorio',
      fecha: moment().startOf('month').toDate(),
      notas: 'Pago mensual de renta',
      usuarioId: medico.id
    },
    {
      descripcion: 'Compra de estetoscopio',
      monto: 2500.00,
      categoria: 'equipos',
      fecha: moment().subtract(5, 'days').toDate(),
      notas: 'Estetoscopio Littmann Classic III',
      usuarioId: medico.id
    },
    {
      descripcion: 'Suministros médicos',
      monto: 1200.00,
      categoria: 'suministros',
      fecha: moment().subtract(10, 'days').toDate(),
      notas: 'Guantes, jeringas, algodón',
      usuarioId: medico.id
    },
    {
      descripcion: 'Publicidad en redes sociales',
      monto: 3000.00,
      categoria: 'marketing',
      fecha: moment().subtract(15, 'days').toDate(),
      notas: 'Campaña de Facebook Ads',
      usuarioId: medico.id
    },
    {
      descripcion: 'Seguro de responsabilidad civil',
      monto: 8000.00,
      categoria: 'seguros',
      fecha: moment().subtract(20, 'days').toDate(),
      notas: 'Pago anual de seguro médico',
      usuarioId: medico.id
    }
  ];

  try {
    await prisma.gasto.createMany({
      data: gastosData,
      skipDuplicates: true
    });
    console.log('✅ Gastos creados/actualizados');
  } catch (error) {
    console.log('⚠️ Algunos gastos ya existen, continuando...');
  }

  // Crear ingresos de ejemplo
  const ingresosData = [
    {
      descripcion: 'Consulta médica - María López',
      monto: 800.00,
      categoria: 'consulta',
      fecha: moment().subtract(1, 'day').toDate(),
      metodoPago: 'efectivo',
      pacienteId: pacientes[0]?.id,
      citaId: citas[3]?.id,
      usuarioId: medico.id
    },
    {
      descripcion: 'Consulta médica - Roberto Hernández',
      monto: 1200.00,
      categoria: 'consulta',
      fecha: moment().subtract(1, 'day').toDate(),
      metodoPago: 'tarjeta',
      pacienteId: pacientes[3]?.id,
      citaId: citas[3]?.id,
      usuarioId: medico.id
    },
    {
      descripcion: 'Consulta médica - Carmen González',
      monto: 600.00,
      categoria: 'consulta',
      fecha: moment().subtract(2, 'day').toDate(),
      metodoPago: 'efectivo',
      pacienteId: pacientes[4]?.id,
      citaId: citas[4]?.id,
      usuarioId: medico.id
    },
    {
      descripcion: 'Procedimiento - Inyección',
      monto: 400.00,
      categoria: 'procedimiento',
      fecha: moment().subtract(3, 'day').toDate(),
      metodoPago: 'efectivo',
      pacienteId: pacientes[1]?.id,
      usuarioId: medico.id
    },
    {
      descripcion: 'Venta de medicamentos',
      monto: 350.00,
      categoria: 'medicamento',
      fecha: moment().subtract(4, 'day').toDate(),
      metodoPago: 'transferencia',
      pacienteId: pacientes[2]?.id,
      usuarioId: medico.id
    }
  ].filter(ingreso => ingreso.pacienteId); // Solo ingresos con pacientes válidos

  try {
    await prisma.ingreso.createMany({
      data: ingresosData,
      skipDuplicates: true
    });
    console.log('✅ Ingresos creados/actualizados');
  } catch (error) {
    console.log('⚠️ Algunos ingresos ya existen, continuando...');
  }

  // Crear recetas de ejemplo
  const recetasData = [
    {
      diagnostico: 'Hipertensión arterial controlada',
      medicamentos: 'Losartán 50mg - 1 tableta diaria\nAmlodipino 5mg - 1 tableta diaria',
      indicaciones: 'Tomar con el desayuno. Controlar presión arterial semanalmente.',
      observaciones: 'Mantener dieta baja en sodio y ejercicio regular',
      proximaCita: moment().add(1, 'month').toDate(),
      usuarioId: medico.id,
      pacienteId: pacientes[0]?.id
    },
    {
      diagnostico: 'Diabetes mellitus tipo 2',
      medicamentos: 'Metformina 500mg - 2 tabletas con cada comida\nGlimepirida 1mg - 1 tableta en la mañana',
      indicaciones: 'Tomar con las comidas. Monitorear glucosa en ayunas.',
      observaciones: 'Continuar con dieta y ejercicio. Evitar azúcares simples.',
      proximaCita: moment().add(2, 'weeks').toDate(),
      usuarioId: medico.id,
      pacienteId: pacientes[1]?.id
    },
    {
      diagnostico: 'Dolor lumbar agudo',
      medicamentos: 'Ibuprofeno 400mg - 1 tableta cada 8 horas\nParacetamol 500mg - 1 tableta cada 6 horas si persiste dolor',
      indicaciones: 'Tomar con alimentos. No exceder 6 tabletas de ibuprofeno por día.',
      observaciones: 'Reposo relativo. Aplicar calor local. Evitar levantar peso.',
      proximaCita: moment().add(1, 'week').toDate(),
      usuarioId: medico.id,
      pacienteId: pacientes[3]?.id
    },
    {
      diagnostico: 'Artritis reumatoide',
      medicamentos: 'Methotrexate 10mg - 1 tableta semanal\nÁcido fólico 5mg - 1 tableta diaria',
      indicaciones: 'Tomar methotrexate los domingos. Ácido fólico diariamente.',
      observaciones: 'Evitar alcohol. Realizar análisis de sangre mensual.',
      proximaCita: moment().add(1, 'month').toDate(),
      usuarioId: medico.id,
      pacienteId: pacientes[4]?.id
    }
  ].filter(receta => receta.pacienteId); // Solo recetas con pacientes válidos

  try {
    await prisma.receta.createMany({
      data: recetasData,
      skipDuplicates: true
    });
    console.log('✅ Recetas creadas/actualizadas');
  } catch (error) {
    console.log('⚠️ Algunas recetas ya existen, continuando...');
  }

  // Obtener estadísticas finales
  const estadisticas = await Promise.all([
    prisma.paciente.count({ where: { usuarioId: medico.id } }),
    prisma.cita.count({ where: { usuarioId: medico.id } }),
    prisma.gasto.count({ where: { usuarioId: medico.id } }),
    prisma.ingreso.count({ where: { usuarioId: medico.id } }),
    prisma.receta.count({ where: { usuarioId: medico.id } })
  ]);

  console.log('🎉 Seed completado exitosamente!');
  console.log('\n📋 Datos en la base de datos:');
  console.log(`- 1 médico`);
  console.log(`- ${estadisticas[0]} pacientes`);
  console.log(`- ${estadisticas[1]} citas`);
  console.log(`- ${estadisticas[2]} gastos`);
  console.log(`- ${estadisticas[3]} ingresos`);
  console.log(`- ${estadisticas[4]} recetas`);
  
  console.log('\n🔑 Credenciales de acceso:');
  console.log('Email: dr.garcia@ejemplo.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 