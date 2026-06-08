-- database/schema.sql
-- Sistema de Administración Hospitalaria Venezolano
-- Cumple normativas MPPS, SENIAT, Ley de Protección de Datos

-- ============================================
-- 1. TABLAS MAESTRAS Y CONFIGURACIÓN
-- ============================================

CREATE TABLE instituciones (
    id SERIAL PRIMARY KEY,
    rif VARCHAR(15) NOT NULL UNIQUE, -- J-12345678-9
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50), -- Hospital, Clínica, Ambulatorio
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    responsable_nombre VARCHAR(100),
    responsable_cedula VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE, -- V-12345678
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    rol VARCHAR(50) NOT NULL, -- admin, medico, enfermera, farmaceutico, recepcion
    especialidad VARCHAR(100), -- Solo para médicos
    registro_medico VARCHAR(50), -- Número de colegiado
    activo BOOLEAN DEFAULT true,
    reset_token VARCHAR(100),
    reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- 2. PACIENTES (Ley de Protección de Datos)
-- ============================================

CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(20) NOT NULL UNIQUE, -- V-12345678, E-12345678, P-12345678
    tipo_cedula CHAR(1) CHECK (tipo_cedula IN ('V', 'E', 'P')),
    carnet_patria VARCHAR(50), -- Opcional
    expediente VARCHAR(50) UNIQUE NOT NULL, -- Número de historia único
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F', 'O')), -- Masculino, Femenino, Otro
    estado_civil VARCHAR(20),
    telefono VARCHAR(20),
    telefono_emergencia VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    parroquia VARCHAR(100),
    municipio VARCHAR(100),
    estado VARCHAR(50),
    pais VARCHAR(50) DEFAULT 'Venezuela',
    ocupacion VARCHAR(100),
    tipo_sangre VARCHAR(5),
    alergias TEXT,
    contacto_nombre VARCHAR(100),
    contacto_parentesco VARCHAR(50),
    contacto_telefono VARCHAR(20),
    aseguradora VARCHAR(100), -- IVSS, IPASME, Seguro privado
    numero_asegurado VARCHAR(50),
    consentimiento_datos BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. HISTORIA CLÍNICA ELECTRÓNICA (Norma MPPS)
-- ============================================

CREATE TABLE antecedentes (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id),
    tipo VARCHAR(50), -- personales, familiares
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE episodios (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id),
    tipo VARCHAR(50) NOT NULL, -- Consulta, Emergencia, Hospitalización
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_egreso TIMESTAMP,
    motivo_consulta TEXT,
    sintomatologia TEXT,
    examenes_fisicos JSONB, -- {TA: "120/80", FC: "80", ...}
    diagnosticos TEXT, -- CIE-10
    tratamiento TEXT,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'activo',
    medico_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evoluciones (
    id SERIAL PRIMARY KEY,
    episodio_id INTEGER REFERENCES episodios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subjetivo TEXT, -- Que refiere el paciente
    objetivo TEXT, -- Hallazgos del examen
    analisis TEXT, -- Interpretación
    plan TEXT, -- Plan de acción
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CITAS Y AGENDA
-- ============================================

CREATE TABLE consultorios (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE agenda (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    paciente_id INTEGER REFERENCES pacientes(id),
    medico_id INTEGER REFERENCES usuarios(id),
    consultorio_id INTEGER REFERENCES consultorios(id),
    motivo TEXT,
    estado VARCHAR(20) DEFAULT 'programada', -- programada, confirmada, atendida, cancelada, ausente
    tipo_cita VARCHAR(50), -- Primera vez, Control, Emergencia
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. FARMACIA E INVENTARIO (Farmapatria integrable)
-- ============================================

CREATE TABLE categorias_medicamentos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE medicamentos (
    id SERIAL PRIMARY KEY,
    codigo_venezolano VARCHAR(50) UNIQUE NOT NULL, -- Código Farmapatria/MPPS
    nombre_comercial VARCHAR(200) NOT NULL,
    principio_activo VARCHAR(200),
    presentacion VARCHAR(100),
    concentracion VARCHAR(50),
    via_administracion VARCHAR(50),
    categoria_id INTEGER REFERENCES categorias_medicamentos(id),
    stock_minimo INTEGER DEFAULT 10,
    stock_maximo INTEGER DEFAULT 100,
    proveedor_principal VARCHAR(100),
    registro_sanitario VARCHAR(100),
    temperatura_conservacion VARCHAR(50),
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2),
    gravamen_iva BOOLEAN DEFAULT false, -- Salud usualmente exenta
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lotes_medicamentos (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER REFERENCES medicamentos(id),
    lote VARCHAR(50) NOT NULL,
    fecha_fabricacion DATE,
    fecha_vencimiento DATE NOT NULL,
    cantidad_inicial INTEGER NOT NULL,
    cantidad_actual INTEGER NOT NULL,
    proveedor VARCHAR(100),
    numero_factura VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recetas (
    id SERIAL PRIMARY KEY,
    episodio_id INTEGER REFERENCES episodios(id),
    paciente_id INTEGER REFERENCES pacientes(id),
    medico_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    indicaciones_generales TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, dispensada, cancelada
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recetas_detalle (
    id SERIAL PRIMARY KEY,
    receta_id INTEGER REFERENCES recetas(id),
    medicamento_id INTEGER REFERENCES medicamentos(id),
    cantidad INTEGER NOT NULL,
    dosis TEXT, -- "1 tableta cada 8 horas"
    duracion TEXT, -- "7 días"
    via_administracion VARCHAR(50),
    indicaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movimientos_inventario (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL, -- entrada, salida, ajuste
    medicamento_id INTEGER REFERENCES medicamentos(id),
    lote_id INTEGER REFERENCES lotes_medicamentos(id),
    cantidad INTEGER NOT NULL,
    motivo VARCHAR(100), -- compra, venta, consumo interno, ajuste
    documento_referencia VARCHAR(100), -- factura, receta número
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. LABORATORIO E IMÁGENES
-- ============================================

CREATE TABLE examenes_laboratorio (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100), -- Hematología, Bioquímica, etc.
    unidad_medida VARCHAR(50),
    valores_referencia TEXT,
    precio DECIMAL(10,2),
    activo BOOLEAN DEFAULT true
);

CREATE TABLE ordenes_laboratorio (
    id SERIAL PRIMARY KEY,
    episodio_id INTEGER REFERENCES episodios(id),
    paciente_id INTEGER REFERENCES pacientes(id),
    medico_id INTEGER REFERENCES usuarios(id),
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_muestra TIMESTAMP,
    fecha_resultado TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, tomada, procesando, completada
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE resultados_laboratorio (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER REFERENCES ordenes_laboratorio(id),
    examen_id INTEGER REFERENCES examenes_laboratorio(id),
    resultado VARCHAR(200),
    valor_referencia TEXT,
    observaciones TEXT,
    tecnico_id INTEGER REFERENCES usuarios(id),
    fecha_procesamiento TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. FACTURACIÓN Y CONTABILIDAD (SENIAT)
-- ============================================

CREATE TABLE servicios (
    id SERIAL PRIMARY KEY,
    codigo_mpps VARCHAR(50), -- Código MPPS si aplica
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 0, -- Salud usualmente 0%
    activo BOOLEAN DEFAULT true
);

CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,
    numero_control VARCHAR(50) UNIQUE NOT NULL, -- Generado según SENIAT
    paciente_id INTEGER REFERENCES pacientes(id),
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE,
    subtotal DECIMAL(10,2) DEFAULT 0,
    iva DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagada, anulada
    forma_pago VARCHAR(50), -- efectivo, transferencia, tarjeta
    referencia_pago VARCHAR(100),
    usuario_id INTEGER REFERENCES usuarios(id),
    xml_seniat TEXT, -- Factura electrónica XML
    codigo_control_seniat VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facturas_detalle (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER REFERENCES facturas(id),
    servicio_id INTEGER REFERENCES servicios(id),
    cantidad INTEGER DEFAULT 1,
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    iva DECIMAL(10,2),
    total DECIMAL(10,2),
    descripcion TEXT
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER REFERENCES facturas(id),
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    forma_pago VARCHAR(50) NOT NULL,
    referencia VARCHAR(100),
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. REPORTES MPPS Y EPIDEMIOLÓGICOS
-- ============================================

CREATE TABLE reportes_mpps (
    id SERIAL PRIMARY KEY,
    tipo_reporte VARCHAR(50), -- diario, semanal, mensual, epidemiológico
    periodo DATE NOT NULL, -- Fecha de reporte
    datos JSONB NOT NULL, -- Datos en formato MPPS
    enviado BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP,
    respuesta_mpps TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enfermedades_notificables (
    id SERIAL PRIMARY KEY,
    codigo_cie10 VARCHAR(20) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    notificacion_obligatoria BOOLEAN DEFAULT true,
    plazo_notificacion_horas INTEGER,
    activo BOOLEAN DEFAULT true
);

-- ============================================
-- 9. AUDITORÍA Y SEGURIDAD
-- ============================================

CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INTEGER,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesiones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX idx_pacientes_cedula ON pacientes(cedula);
CREATE INDEX idx_pacientes_expediente ON pacientes(expediente);
CREATE INDEX idx_episodios_paciente ON episodios(paciente_id);
CREATE INDEX idx_episodios_medico ON episodios(medico_id);
CREATE INDEX idx_episodios_fecha ON episodios(fecha_ingreso);
CREATE INDEX idx_agenda_fecha ON agenda(fecha);
CREATE INDEX idx_agenda_medico ON agenda(medico_id);
CREATE INDEX idx_agenda_paciente ON agenda(paciente_id);
CREATE INDEX idx_facturas_numero ON facturas(numero_control);
CREATE INDEX idx_facturas_paciente ON facturas(paciente_id);
CREATE INDEX idx_facturas_fecha ON facturas(fecha_emision);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_hora);

-- ============================================
-- 11. VISTAS ÚTILES
-- ============================================

CREATE VIEW vista_pacientes_activos AS
SELECT p.*, COUNT(e.id) as total_episodios,
       MAX(e.fecha_ingreso) as ultima_atencion
FROM pacientes p
LEFT JOIN episodios e ON p.id = e.paciente_id
WHERE p.activo = true
GROUP BY p.id;

CREATE VIEW vista_inventario_critico AS
SELECT m.*, COALESCE(SUM(lm.cantidad_actual), 0) as stock_actual
FROM medicamentos m
LEFT JOIN lotes_medicamentos lm ON m.id = lm.medicamento_id AND lm.activo = true
GROUP BY m.id
HAVING COALESCE(SUM(lm.cantidad_actual), 0) <= m.stock_minimo;

CREATE VIEW vista_facturacion_mensual AS
SELECT 
    DATE_TRUNC('month', fecha_emision) as mes,
    COUNT(*) as total_facturas,
    SUM(total) as total_facturado,
    SUM(CASE WHEN estado = 'pagada' THEN total ELSE 0 END) as total_pagado
FROM facturas
GROUP BY DATE_TRUNC('month', fecha_emision);

-- ============================================
-- 12. DATOS INICIALES (Seed)
-- ============================================

INSERT INTO instituciones (rif, nombre, tipo, direccion, telefono) VALUES
('J-12345678-9', 'Clínica Especializada Venezuela', 'Clínica', 'Caracas, Venezuela', '0212-555-1234');

INSERT INTO usuarios (username, password_hash, cedula, nombres, apellidos, email, rol, especialidad) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeL7qtb8P3pXj6V7rPc6Yl5Jz6T9Kv1W2', 'V-12345678', 'Administrador', 'Del Sistema', 'admin@clinica.com', 'admin', NULL),
('medico1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeL7qtb8P3pXj6V7rPc6Yl5Jz6T9Kv1W2', 'V-87654321', 'Carlos', 'González', 'dr.gonzalez@clinica.com', 'medico', 'Medicina General'),
('recepcion', '$2a$10$N9qo8uLOickgx2ZMRZoMyeL7qtb8P3pXj6V7rPc6Yl5Jz6T9Kv1W2', 'V-11223344', 'María', 'Pérez', 'recepcion@clinica.com', 'recepcion', NULL);