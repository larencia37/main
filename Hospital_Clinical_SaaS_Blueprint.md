# Hospital & Clinical Management SaaS Blueprint for Venezuela

## 1. Venezuelan Regulatory & Fiscal Matrix

### A. Digital Medical Records / Data Privacy

#### Legal Frameworks
- Constitución de la República Bolivariana de Venezuela
  - Artículo 28: derecho a la intimidad y protección de datos personales.
  - Artículo 60: derecho a la protección de datos personales.
- Ley de Protección de Datos Personales (LOPD) / Ley de Habeas Data.
- MPPS: Normas Técnicas de Historias Clínicas y Sistemas de Información en Salud.
- MPPS: Norma Técnica de Vigilancia Epidemiológica.
- Gacetas Oficiales y resoluciones ministeriales relacionadas con historia clínica electrónica.

#### Compliance Obligations
- Almacenamiento seguro de la historia clínica digital.
- Encriptación en tránsito y en reposo para datos sensibles.
- Control de acceso basado en roles (médico, enfermería, administrativo, auditor).
- Registro de auditoría de accesos y modificaciones.
- Conservación de historias clínicas según plazos sanitarios.
- Consentimiento informado para recolección y tratamiento de datos.
- Política de privacidad clara y visible para pacientes.

#### Recomendaciones prácticas
- Define una `Política de Privacidad` y un `Aviso de Confidencialidad` para pacientes.
- Implementa trazabilidad de cada consulta, cada vista de documento y cada descarga.
- Protege datos personales con tablas separadas y cifrado de campos críticos.
- Soporta el bloqueo del acceso tras múltiples intentos fallidos y registro de sesiones.

### B. SENIAT Fiscal Compliance

#### Marco legal clave
- Providencia SENIAT 0071: normativa de comprobantes fiscales y máquinas fiscales.
- Resoluciones de facturación electrónica y códigos de control.
- Normas de registro de operaciones en bolívares y divisas.
- Normas de IGTF y uso de moneda extranjera.

#### Requisitos concretos
- Emisión de facturas y documentos en formato autorizado.
- Soporte de timbrado, numeración autorizada y códigos de control.
- Integración con impresoras fiscales / controladoras fiscales homologadas.
- Registro de movimientos fiscales para auditoría interna.
- Cálculo de IGTF sobre pagos en moneda extranjera.
- Registro de tipo de cambio BCV para operaciones en bolívares vinculadas a divisas.

#### Facturación dual-currency
- Factura principal en bolívares (VED) usando la tasa BCV vigente.
- Registro paralelo de cobros en USD cuando se aceptan divisas en efectivo o transferencia.
- Cálculo del IGTF entre 3% y 10% según el tipo de transacción.
- Mantén una base de datos de tipos de cambio y la fecha/hora aplicada.
- Guarda el desglose por moneda dentro de cada comprobante.

#### Documentación que debes revisar
- Gacetas Oficiales relacionadas con SENIAT y facturación.
- Providencias y resoluciones recientes de IGTF.
- Guías de homologación de máquinas fiscales y controladoras.
- Normas de facturación electrónica y requisitos de comprobantes.

### C. MPPS Epidemiological Reporting

#### Formatos y reportes
- EPI-10: reporte de eventos de vigilancia epidemiológica.
- EPI-12: reporte de enfermedades respiratorias y emergencias sanitarias.

#### Aplicabilidad para privados
- Clínicas privadas deben notificar casos de enfermedades de notificación obligatoria.
- El MPPS exige reportes a la red de vigilancia epidemiológica nacional.
- Debe existir traza de notificaciones internas y comunicaciones a autoridades.
- Manten registros de casos sospechosos, confirmados, fallecimientos y brotes.

#### Requisitos de implementación
- Registro estructurado de diagnósticos y eventos relevantes para vigilancia.
- Mapeo de enfermedades y códigos para facilitar los formularios EPI.
- Generación de reportes periódicos y exportables.
- Preparación para conexión con sistemas nacionales de vigilancia epidemiológica.

> Nota: las normas venezolanas cambian con frecuencia. Valida cada lanzamiento con un asesor legal sanitario y fiscal local.

---

## 2. "Zero-Dollar" Scalable Architecture

### Principios generales
- Monolito modular con separaciones claras de dominio y adaptadores.
- Business logic independiente de infraestructura.
- Docker Compose para Year 1, con adaptadores que puedan pasar a Kubernetes/AWS sin reescritura de la lógica.
- Evita microservicios prematuros y dependencias propietarias.

### Stack recomendado
- Backend
  - `FastAPI` (Python) o `NestJS` (Node.js)
  - Razón: rápido desarrollo, buena documentación, tipado fuerte y amplio ecosistema.
- Base de datos
  - `PostgreSQL`
  - Razón: ACID, JSONB, transacciones, índices avanzados y migraciones maduras.
- Caché / locking
  - `Redis`
  - Razón: caching, locks distribuidos, sesiones temporales y pub/sub para eventos ligeros.
- Auth / IAM
  - Año 1: implementación propia con JWT + RBAC + bcrypt/argon2.
  - Año 2: migración posible a `Ory Kratos` o `Keycloak` como adaptador.
- File/Object Storage
  - `MinIO`
  - Razón: compatible con S3, excelente para expedientes, imágenes y DICOM en el futuro.
- Proxy / Ingress
  - `Traefik` o `Nginx`
  - Razón: funcionan bien en Docker Compose y Kubernetes.
- Observabilidad (opcional inicial)
  - `Prometheus` + `Grafana`
  - Razón: métricas OSS, monitoreo portable.
- Backups
  - `pg_dump`, `pgbackrest` o scripts de backup simples.
  - Razón: sin costo adicional y fundamentales para recuperación.

### Por qué cada herramienta
- `PostgreSQL`: compatible con multi-tenancy, buen manejo de datos clínicos, permite SQL seguro y migraciones.
- `FastAPI` / `NestJS`: permite un dominio bien separado, código determinista y APIs REST/GraphQL limpias.
- `Redis`: agrega rendimiento sin obligar a un sistema complejo.
- `MinIO`: te permite usar S3 en el futuro con mínima reconfiguración.
- `Traefik`: facilita certificados TLS y rutas dinámicas, y es nativo en Docker/K8s.

### Arquitectura opcional de carpeta
- `src/domain/`
- `src/use_cases/`
- `src/adapters/db/`
- `src/adapters/storage/`
- `src/adapters/auth/`
- `src/interfaces/http/`
- `src/config/`

### Cómo garantizar cero reescritura de business logic
- Definir interfaces/puertos para repositorios y servicios externos.
- Programar contra interfaces, no contra implementaciones.
- Mantener el core libre de detalles específicos de Docker, AWS, SQL.
- Configurar `env` para cambiar data source, storage y auth provider.

---

## 3. Solo-Developer Phased Roadmap

### Phase 0: Foundation
#### Objetivo
Crear la base técnica y estructural, sin intentar cubrir toda la clínica.

#### Entregables de Phase 0
- Repositorio con estructura modular y documentación inicial.
- Docker Compose corriendo con PostgreSQL, Redis, MinIO y backend local.
- Esquema compartido multi-tenant con `tenant_id` y middleware de seguridad.
- Registro de clínicas, sucursales, médicos y roles.
- Login básico con JWT y RBAC.
- Paciente maestro con ficha personal básica.
- Agenda de consultas simple.
- Seed de datos iniciales y scripts de migración.

#### Tareas clave
1. Diseñar esquema de base de datos multi-tenant.
2. Implementar módulo de configuración de tenant y factory de datos.
3. Desarrollar autenticación y autorización.
4. Crear API para registro de clínica y administración de roles.
5. Construir APIs de paciente y agenda.
6. Montar entorno Docker Compose y documentación `README`.

#### Criterios de aceptación
- Un usuario administrador puede crear un tenant y registrar un consultorio.
- Un médico puede iniciar sesión y crear un paciente.
- Se puede programar una cita y consultarla por tenant.
- El entorno es reproducible localmente con un solo comando.

### Phase 1: Minimum Viable Clinic / MVP
#### Objetivo
Entregar un producto viable que un consultorio pueda pagar.

#### Entregables de Phase 1
- Módulo de historia clínica resumida.
- Módulo de consulta médica con notas clínicas.
- Receta digital PDF exportable.
- Facturación básica en bolívares con campos fiscales primarios.
- Agenda robusta por médico y por consultorio.
- Reportes ejecutivos muy simples.
- Política de privacidad mínima y registro de consentimiento.

#### Funciones específicas
- Paciente: alergias, antecedentes, diagnósticos, medicamentos.
- Consulta: motivo, examen físico, diagnóstico, plan y observaciones.
- Receta: medicación, dosis, instrucciones y PDF descargable.
- Facturación: productos/servicios, subtotal, IVA, tipo de cambio BCV.
- Agenda: horarios, duración de consulta, estado reservado/atendida.
- Reportes: pacientes activos, citas del mes, ingresos por periodo.

#### Tareas clave
1. Diseñar modelo de historia clínica y notas de consulta.
2. Implementar formularios de consulta y guardado seguro.
3. Crear motor de recetas e integración de generación de PDF.
4. Construir módulo de facturación con cálculos básicos.
5. Añadir reportes sencillos de negocio.
6. Validar roles y accesos para datos clínicos.

#### Criterios de aceptación
- Un médico puede crear y ver una nota de consulta de un paciente.
- Se puede generar una factura simple y descargarla como PDF.
- La clínica puede ver un reporte mensual de ingresos y citas.
- El sistema registra el tipo de cambio BCV usado por factura.

### Phase 2: Operational & Inventory
#### Objetivo
Cubrir la operación clínica y el control de stock.

#### Entregables de Phase 2
- Control de inventario farmacéutico con lotes y vencimientos.
- Órdenes de laboratorio y registro de resultados.
- Odontograma básico para clínicas dentales.
- Gestión de proveedores y compras.
- Alertas operativas de stock crítico y vencimiento.

#### Funciones específicas
- Inventario por lote y ubicación.
- Movimientos de stock (entrada, salida, devolución).
- Notificaciones de productos próximos a vencimiento.
- Órdenes de laboratorio enlazadas a pacientes y consultas.
- Registro de resultados e historial de tests.
- Odontograma de 32 piezas con estado y procedimientos.
- Pedidos de compra con recepción y actualización de inventario.

#### Tareas clave
1. diseñar modelo de inventario y stock por lote.
2. implementar workflows de entrada/salida de productos.
3. desarrollar módulo de órdenes de laboratorio.
4. añadir odontograma visual y esquema de procedimientos.
5. construir gestor de compras y proveedores.
6. crear reportes de stock y vencimientos.

#### Criterios de aceptación
- Se puede crear un producto farmacéutico y registrar su lote.
- El sistema alerta cuando una existencia está por debajo del mínimo.
- Se puede generar una orden de laboratorio y almacenar resultados.
- Un odontólogo puede registrar un procedimiento por diente.

### Phase 3: Fiscal & Insurance
#### Objetivo
Hacer el sistema legalmente operativo y comercialmente escalable.

#### Entregables de Phase 3
- Motor fiscal inicial compatible con SENIAT.
- Soporte de factura en bolívares con campo de tipo de cambio BCV.
- Registro de pagos en USD y cálculo de IGTF.
- Primer módulo de aseguradoras y baremos.
- Integración de pagos parciales y split payments.

#### Funciones específicas
- Comprobantes fiscales básicos con numeración y validación.
- Guardado de tasas de IGTF y tipos de cambio en cada comprobante.
- Captura de recibos en USD y reconciliación del ingreso.
- Catálogo básico de aseguradoras y convenios.
- Facturación por convenio y generación de remesas sencillas.
- Integración de gateway de pago local/simple.

#### Tareas clave
1. investigar exactitud de requerimientos fiscales locales.
2. construir el modelo de facturación dual-currency.
3. crear adaptador de pagos USD / IGTF.
4. desarrollar módulo inicial de aseguradoras.
5. añadir conciliación de pagos y estados de cuenta.
6. validar facturas contra reglas fiscales básicas.

#### Criterios de aceptación
- Se puede emitir una factura en bolívares con tipo de cambio BCV adjunto.
- El sistema registra un pago en USD y calcula IGTF automáticamente.
- Una clínica puede crear un convenio de aseguradora y facturarlo.
- Las facturas fiscales contienen los campos obligatorios definibles.

### Phase 4: Scale
#### Objetivo
Agregar diferenciadores y escalar la plataforma.

#### Entregables de Phase 4
- Portal del paciente con acceso seguro.
- Visor básico DICOM/PACS integrado.
- Dashboards y métricas multi-tenant.
- APIs y documentación para terceros.
- Onboarding automatizado y monitoreo centralizado.

#### Funciones específicas
- Portal paciente: citas, resultados, facturas.
- Solicitud de cita desde paciente y notificaciones.
- Almacenamiento DICOM en MinIO y visor OHIF.
- Dashboards de KPIs clínicos y financieros.
- API REST/GraphQL pública con versión y documentación.
- Onboarding de nuevos tenants y métricas de uso.

#### Tareas clave
1. diseñar experiencia de portal paciente segura.
2. integrar OHIF Viewer con MinIO para DICOM.
3. crear dashboards operativos y de ingresos.
4. construir documentación de API y endpoints públicos.
5. automatizar onboarding y provisión de tenant.
6. añadir métricas multi-tenant y alertas básicas.

#### Criterios de aceptación
- Un paciente puede acceder a su historial, citas y facturas.
- La clínica puede cargar y visualizar imágenes DICOM básicas.
- Un dashboard muestra KPIs por tenant y por médico.
- Una nueva clínica puede registrarse y configurarse con mínima intervención.

---

## 4. Anti-Over-Engineering Guardrails

### Top 3 fatal traps
1. Construir infra compleja antes de validar el negocio.
   - No uses microservicios, Kubernetes o colas distribuidas antes de tener clientes.
   - Empieza con un monolito modular y una sola base de datos bien controlada.
2. Mezclar lógica de negocio con infraestructura.
   - No codifiques reglas fiscales o médicas en la UI o en scripts aislados.
   - Define un dominio robusto y adapta infra externa a él.
3. Intentar resolver toda la clínica de una vez.
   - No desarrolles todos los servicios hospitalarios desde el comienzo.
   - Prioriza consulta ambulatoria, ficha clínica y facturación básica.

### Qué debes rechazar en Phase 1
- PACS/DICOM completo o visor radiológico avanzado.
- Integración con máquinas fiscales homologadas.
- Motor de baremos de aseguradoras completo.
- Reclamos automáticos de seguros.
- Telemedicina con streaming de audio/video.
- Interoperabilidad HL7/FHIR profunda.
- IA diagnóstica o módulos clínicos avanzados.
- Call center o telefonía integrada.

---

## 5. Immediate Implementation Guidance

### Construye primero
1. Módulo de pacientes y agenda.
2. Historia clínica resumida y notas de consulta.
3. Facturación local en bolívares con registro de tipo de cambio.
4. Seguridad mínima de datos y entornos reproducibles.

### Mantén para después
- fiscalización completa con SENIAT,
- seguros/aseguradoras,
- PACS/DICOM,
- telemedicina y HL7.

### Estructura técnica recomendada
- Dominio separado: pacientes, citas, consultas, facturación.
- Adaptadores para infraestructura: DB, storage, email, fiscal.
- Docker Compose para desarrollo.
- Variables de entorno para separar local y futuro cloud.

> Esta hoja de ruta te da un MVP viable para cobrar a clínicas pequeñas mientras mantienes la arquitectura lista para escalar en Year 2.
