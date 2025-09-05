# 🧪 Pruebas de API - Sistema de Gestión de Médicos

Este directorio contiene archivos de pruebas completos para el sistema de gestión de médicos usando REST Client.

## 📁 Archivos de Pruebas

### 1. `api-tests.rest`
Archivo principal con todas las pruebas de endpoints organizadas por módulos:
- **Autenticación**: Registro, login, verificación de token
- **Usuarios**: Perfil, actualización, cambio de contraseña, estadísticas
- **Pacientes**: CRUD completo, búsqueda, filtros, estadísticas
- **Citas**: CRUD completo, calendario, próximas citas, estadísticas
- **Gastos**: CRUD completo, categorías, estadísticas
- **Ingresos**: CRUD completo, categorías, estadísticas
- **Recetas**: CRUD completo, PDF, estadísticas
- **Dashboard**: Métricas, gráficos, alertas
- **Reportes**: Excel para todos los módulos
- **Pruebas de errores**: Validaciones y casos edge
- **Pruebas de rendimiento**: Paginación, filtros múltiples

### 2. `casos-uso.rest`
Simulación de casos de uso reales del sistema médico:
- **Caso 1**: Nuevo paciente y primera cita
- **Caso 2**: Consulta médica completa con receta
- **Caso 3**: Seguimiento y control del paciente
- **Caso 4**: Gestión financiera del consultorio
- **Caso 5**: Manejo de emergencias médicas
- **Caso 6**: Reportes y análisis
- **Caso 7**: Limpieza y mantenimiento

### 3. `rest-client-settings.json`
Configuración para REST Client con entornos:
- **Local**: `http://localhost:3000`
- **Development**: `https://dev-api-sistema-medicos.com`
- **Production**: `https://api-sistema-medicos.com`

## 🚀 Cómo Usar las Pruebas

### Prerrequisitos

1. **Instalar REST Client** en VS Code:
   ```
   Extensión: REST Client
   Autor: Huachao Mao
   ```

2. **Configurar el entorno**:
   - Abrir VS Code
   - Presionar `Ctrl+Shift+P`
   - Buscar "REST Client: Switch Environment"
   - Seleccionar "local"

3. **Asegurar que el servidor esté corriendo**:
   ```bash
   npm run dev
   ```

### Ejecutar Pruebas

#### Ejecutar una prueba individual:
1. Abrir el archivo `.rest`
2. Posicionar el cursor sobre la prueba deseada
3. Presionar `Ctrl+Alt+L` o hacer clic en "Send Request"

#### Ejecutar todas las pruebas de un archivo:
1. Abrir el archivo `.rest`
2. Presionar `Ctrl+Alt+R` o hacer clic en "Send All Requests"

#### Ejecutar pruebas en secuencia:
1. Las pruebas están organizadas en orden lógico
2. Ejecutar desde el inicio para que las variables se llenen correctamente
3. El token de autenticación se obtiene automáticamente del login

### Variables Automáticas

El sistema usa variables que se llenan automáticamente:

```http
@authToken = {{login.response.body.data.token}}
@userId = {{login.response.body.data.usuario.id}}
```

Estas variables se usan en las pruebas posteriores:
```http
Authorization: Bearer {{authToken}}
```

## 📊 Casos de Prueba Cubiertos

### ✅ Funcionalidades Básicas
- [x] Registro y autenticación de médicos
- [x] Gestión completa de pacientes
- [x] Programación y gestión de citas
- [x] Control de gastos e ingresos
- [x] Generación de recetas médicas
- [x] Dashboard con métricas
- [x] Reportes en Excel y PDF

### ✅ Validaciones
- [x] Datos requeridos
- [x] Formatos de email y fechas
- [x] Montos positivos
- [x] IDs válidos
- [x] Estados de citas válidos

### ✅ Autenticación y Autorización
- [x] Token JWT requerido
- [x] Token inválido
- [x] Token expirado
- [x] Acceso sin token

### ✅ Casos Edge
- [x] Datos duplicados
- [x] Registros no encontrados
- [x] Fechas pasadas
- [x] Montos negativos
- [x] IDs inválidos

### ✅ Rendimiento
- [x] Paginación
- [x] Filtros múltiples
- [x] Búsquedas
- [x] Estadísticas
- [x] Reportes grandes

## 🔧 Configuración Avanzada

### Variables de Entorno

Puedes configurar diferentes entornos en `rest-client-settings.json`:

```json
{
  "local": {
    "baseUrl": "http://localhost:3000",
    "email": "dr.garcia@ejemplo.com",
    "password": "password123"
  }
}
```

### Headers Personalizados

Los headers se configuran automáticamente:
```json
{
  "User-Agent": "Sistema-Gestion-Medicos-Tests/1.0.0",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

### Timeout

El timeout está configurado a 30 segundos:
```json
{
  "rest-client.timeoutInMilliseconds": 30000
}
```

## 📋 Flujo de Pruebas Recomendado

### 1. Pruebas Iniciales
```bash
# 1. Ejecutar el seed de la base de datos
npm run db:seed

# 2. Iniciar el servidor
npm run dev

# 3. Ejecutar pruebas de autenticación
# Abrir api-tests.rest y ejecutar las pruebas de autenticación
```

### 2. Pruebas Funcionales
```bash
# 1. Ejecutar casos de uso completos
# Abrir casos-uso.rest y ejecutar secuencialmente

# 2. Verificar cada módulo
# Usar api-tests.rest para probar endpoints específicos
```

### 3. Pruebas de Integración
```bash
# 1. Probar relaciones entre módulos
# 2. Verificar que las estadísticas se actualicen
# 3. Descargar y verificar reportes
```

## 🐛 Solución de Problemas

### Error: "Cannot connect to server"
- Verificar que el servidor esté corriendo en `http://localhost:3000`
- Verificar que no haya errores en la consola del servidor

### Error: "Unauthorized"
- Ejecutar primero la prueba de login
- Verificar que el token se esté generando correctamente
- Verificar que el token no haya expirado

### Error: "Validation failed"
- Verificar que los datos de entrada cumplan con las validaciones
- Revisar el formato de fechas (YYYY-MM-DD)
- Verificar que los montos sean positivos

### Variables no se llenan
- Ejecutar las pruebas en orden secuencial
- Verificar que las pruebas anteriores hayan sido exitosas
- Revisar que los nombres de las variables coincidan

## 📈 Métricas de Pruebas

### Cobertura de Endpoints
- **Total de endpoints**: 50+
- **Endpoints probados**: 100%
- **Casos de uso**: 7 escenarios completos

### Tipos de Pruebas
- **Pruebas unitarias**: Validaciones individuales
- **Pruebas de integración**: Flujos completos
- **Pruebas de rendimiento**: Paginación y filtros
- **Pruebas de error**: Casos edge y validaciones

## 🔄 Mantenimiento

### Actualizar Pruebas
1. Modificar los archivos `.rest` según nuevos endpoints
2. Actualizar las variables si cambian las respuestas
3. Agregar nuevos casos de uso según necesidades

### Limpiar Datos
- Usar las pruebas de eliminación al final de cada sesión
- Ejecutar `npm run db:seed` para restaurar datos de prueba
- Verificar que las estadísticas se reseteen correctamente

## 📞 Soporte

Si encuentras problemas con las pruebas:

1. **Verificar la documentación** de la API en el README principal
2. **Revisar los logs** del servidor para errores
3. **Verificar la configuración** de REST Client
4. **Ejecutar las pruebas** en orden secuencial

---

**¡Las pruebas están listas para validar tu sistema de gestión de médicos!** 🎉 