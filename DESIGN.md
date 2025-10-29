# DESIGN.md - Sistema de Monitoreo IoT para Flotas Vehiculares

## Resumen Ejecutivo

Sistema full-stack de monitoreo en tiempo real para flotas vehiculares que procesa datos de sensores IoT, calcula alertas predictivas de combustible, temperatura,  y proporciona visualización interactiva con autenticación basada en roles.

## Stack Tecnológico

### Backend
- **Node.js + Express**: Runtime y framework web elegidos por su ecosistema maduro, rendimiento asíncrono nativo y amplia comunidad
- **TypeScript**: Tipado estático para mejorar la mantenibilidad, detectar errores en tiempo de compilación y facilitar refactorización
- **PostgreSQL**: Base de datos relacional robusta que garantiza consistencia ACID, soporta consultas complejas y escala verticalmente
- **Socket.IO**: Biblioteca WebSocket para comunicación bidireccional en tiempo real entre servidor y clientes
- **JWT (JSON Web Tokens)**: Autenticación stateless implementada manualmente para cumplir requisitos de validación sin librerías externas

### Frontend
- **React**: Biblioteca declarativa para UI con componente reutilizable y ecosistema extenso
- **TypeScript**: Consistencia de tipos entre frontend y backend, reduciendo errores de integración
- **Axios**: Cliente HTTP con interceptores para manejo centralizado de autenticación y errores
- **Leaflet/React-Leaflet**: Mapas interactivos open-source para visualización geoespacial de vehículos
- **Recharts**: Librería de gráficos declarativa para visualización de datos históricos

### Capas de Backend

#### 1. Capa de Presentación (Routes)
- **Responsabilidad**: Definir endpoints REST y validar request/response
- **Trade-off**: Express Router proporciona simplicidad sobre frameworks más complejos como NestJS, priorizando rapidez de desarrollo

#### 2. Capa de Lógica de Negocio (Services)
- **Responsabilidad**: Implementar reglas de negocio, cálculos predictivos y transformaciones
- **Ejemplo**: Cálculo de autonomía de combustible basado en consumo histórico

#### 3. Capa de Acceso a Datos (Repositories)
- **Responsabilidad**: Interactuar con PostgreSQL mediante consultas SQL
- **Trade-off**: SQL directo sobre ORMs (Sequelize/TypeORM) ofrece control fino y rendimiento superior.

#### 4. Capa de Comunicación en Tiempo Real (WebSocket)
- **Responsabilidad**: Emitir eventos de cambios en sensores y alertas
- **Patrón**: Pub/Sub para broadcast de actualizaciones a clientes conectados

### Autenticación y Autorización

#### Implementación JWT Manual

Login → Hash bcrypt de contraseña

Generación de token con firma manual

Middleware de validación que decodifica y verifica firma sin librerías

Control de acceso basado en roles (admin/normal user)

**Trade-offs**:
- ✅ **Ventaja**: Cumple requisito de implementación manual, demuestra comprensión profunda del estándar
- ❌ **Desventaja**: Mayor superficie de ataque por errores de implementación vs librerías probadas en batalla
- ⚖️ **Decisión**: Implementación educativa justificada por contexto de prueba técnica

### Sistema de Roles

| Rol         | Permisos                                                    |
|-------------|-------------------------------------------------------------|
| **Admin**   | CRUD completo de dispositivos, ver Device IDs, todas alertas|
| **User**    | Solo lectura, Device IDs ocultos, alertas propias          |

## Decisiones Técnicas Clave

### 1. PostgreSQL vs MongoDB
**Decisión**: PostgreSQL

**Razones**:
- Relaciones estructuradas entre usuarios, dispositivos y lecturas de sensores
- Queries analíticas complejas para cálculos predictivos (agregaciones, JOINs)
- Integridad referencial crítica para consistencia de datos
- Transacciones ACID necesarias para operaciones de ingesta concurrentes

### 2. Socket.IO vs WebSockets Nativos
**Decisión**: Socket.IO

**Razones**:
- Rooms para segregar streams por usuario/rol
- Reconexión automática y heartbeat incluidos
- Compatibilidad cross-browser simplificada

### 3. Validación JWT Manual vs Librerías
**Decisión**: Implementación manual

**Razones**:
- Requisito explícito de la prueba técnica
- Demuestra comprensión de criptografía.
- Control total sobre lógica de validación

### 4. React vs Next.js SSR
**Decisión**: React

**Razones**:
- Dashboard requiere interacción en tiempo real (WebSockets)
- No hay necesidades SEO críticas
- Despliegue simplificado (archivos estáticos)
- Menor complejidad de infraestructura

### 5. SQL vs ORM
**Decisión**: SQL 

**Razones**:
- Control preciso sobre queries de rendimiento crítico
- Sin overhead de abstracción en tiempo de ejecución
- Mayor transparencia para debugging
- Consultas optimizadas manualmente para cálculos predictivos

## Cálculo Predictivo de Combustible

### Parámetros
- `fuelLevel`: Nivel actual en litros (del sensor)
- `averageFuelConsumptionRate`: Promedio móvil de últimas 10 lecturas (L/h)

### Trade-offs
- ✅ **Simple**: Implementación rápida y comprensible
- ❌ **Limitado**: No considera factores externos (tráfico, terreno, estilo de conducción)
- 🔄 **Mejora futura**: Machine learning con datos históricos enriquecidos

## Seguridad

### Medidas Implementadas
1. **Passwords**: Hash bcrypt con salt automático (cost factor 10)
2. **JWT**: Firma con secreto en variable de entorno
3. **SQL Injection**: Consultas parametrizadas en todas las queries
4. **CORS**: Configurado para permitir solo orígenes específicos
5. **Rate Limiting**: Middleware para prevenir abuse de API

### Pendientes para Producción
- HTTPS obligatorio con certificados TLS
- Refresh tokens para renovación sin re-login
- Logging de auditoría de accesos
- Encriptación de datos sensibles en base de datos

## Escalabilidad

### Capacidad Actual
- **Concurrencia**: ~1000 conexiones WebSocket simultáneas (límite Node.js single-thread)
- **Throughput**: ~500 requests/segundo en endpoints REST
- **Datos**: Millones de registros (limitado por hardware PostgreSQL)

### Estrategias de Escalado
1. **Horizontal**: Load balancer + múltiples instancias Node.js + Redis para sesiones WebSocket
2. **Vertical**: Aumentar recursos de servidor PostgreSQL
3. **Caché**: Redis para queries frecuentes de dashboard
4. **Particionamiento**: Tabla de lecturas particionada por timestamp

## Deuda Técnica Conocida

1. **Migraciones DB**: Schema manual requiere versionado explícito
2. **Validación JWT**: Implementación casera necesita auditoría de seguridad
3. **Error Handling**: No hay estrategia centralizada de recuperación de errores
4. **Tests**: Cobertura actual <30%, requiere inversión

## Conclusión

El stack elegido prioriza **rapidez de desarrollo** y **cumplimiento de requisitos** técnicos específicos (JWT manual, WebSockets, PostgreSQL) sobre abstracciones enterprise. La arquitectura en capas facilita mantenibilidad, mientras que las decisiones de trade-off equilibran complejidad vs tiempo de entrega en contexto de prueba técnica de 72 horas.
