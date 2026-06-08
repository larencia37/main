-- database/seed_data.sql
-- Datos iniciales adicionales para Sistema Hospitalario Venezolano

-- ============================================
-- DATOS DE PRUEBA PARA DESARROLLO
-- ============================================

-- Más usuarios de prueba
INSERT INTO usuarios (username, password_hash, cedula, nombres, apellidos, email, rol, especialidad, registro_medico) VALUES
('enfermera1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeL7qtb8P3pXj6V7rPc6Yl5Jz6T9Kv1W2', 'V-11223344', 'María', 'González', 'enfermera@clinica.com', 'enfermera', NULL, NULL),
('farmaceutico1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeL7qtb8P3pXj6V7rPc6Yl5Jz6T9Kv1W2', 'V-22334455', 'Carlos', 'Rodríguez', 'farmacia@clinica.com', 'farmaceutico', NULL, NULL),
('recepcion2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeL7qtb8P3pXj6V7rPc6Yl5Jz6T9Kv1W2', 'V-33445566', 'Ana', 'Martínez', 'recepcion2@clinica.com', 'recepcion', NULL, NULL);

-- Más instituciones
INSERT INTO instituciones (rif, nombre, tipo, direccion, telefono, email) VALUES
('J-87654321-0', 'Centro Médico Caracas', 'Centro Médico', 'Centro de Caracas, Venezuela', '0212-456-7890', 'info@centromedico.com'),
('J-11223344-5', 'Hospital Universitario', 'Hospital', 'La Candelaria, Caracas', '0212-789-0123', 'hospital@universidad.edu.ve');

-- Consultorios adicionales
INSERT INTO consultorios (codigo, nombre, descripcion) VALUES
('CONS-001', 'Consultorio 1', 'Medicina General'),
('CONS-002', 'Consultorio 2', 'Pediatría'),
('CONS-003', 'Consultorio 3', 'Ginecología'),
('LAB-001', 'Laboratorio', 'Análisis Clínicos');

-- Categorías de medicamentos
INSERT INTO categorias_medicamentos (codigo, nombre, descripcion) VALUES
('ANALG', 'Analgésicos', 'Medicamentos para el dolor'),
('ANTIB', 'Antibióticos', 'Medicamentos antimicrobianos'),
('ANTIINFL', 'Antiinflamatorios', 'Medicamentos antiinflamatorios'),
('ANTIHIST', 'Antihistamínicos', 'Medicamentos para alergias'),
('CARDIO', 'Cardiovasculares', 'Medicamentos para el corazón');

-- Medicamentos de ejemplo
INSERT INTO medicamentos (codigo_venezolano, nombre_comercial, principio_activo, presentacion, concentracion, via_administracion, categoria_id, precio_compra, precio_venta) VALUES
('MED-001', 'Paracetamol 500mg', 'Paracetamol', 'Tabletas', '500mg', 'Oral', 1, 1.50, 2.00),
('MED-002', 'Amoxicilina 500mg', 'Amoxicilina', 'Cápsulas', '500mg', 'Oral', 2, 3.00, 4.50),
('MED-003', 'Ibuprofeno 400mg', 'Ibuprofeno', 'Tabletas', '400mg', 'Oral', 3, 2.00, 3.00),
('MED-004', 'Loratadina 10mg', 'Loratadina', 'Tabletas', '10mg', 'Oral', 4, 1.80, 2.50),
('MED-005', 'Enalapril 10mg', 'Enalapril', 'Tabletas', '10mg', 'Oral', 5, 2.50, 3.50);

-- Lotes de medicamentos
INSERT INTO lotes_medicamentos (medicamento_id, lote, fecha_vencimiento, cantidad_inicial, cantidad_actual, proveedor) VALUES
(1, 'LOTE-PAR-001', '2025-12-31', 100, 85, 'Proveedor ABC'),
(2, 'LOTE-AMO-001', '2025-10-15', 50, 45, 'Proveedor XYZ'),
(3, 'LOTE-IBU-001', '2025-08-20', 75, 70, 'Proveedor DEF'),
(4, 'LOTE-LOR-001', '2026-01-10', 60, 58, 'Proveedor GHI'),
(5, 'LOTE-ENA-001', '2025-11-30', 40, 38, 'Proveedor JKL');

-- Exámenes de laboratorio
INSERT INTO examenes_laboratorio (codigo, nombre, categoria, unidad_medida, valores_referencia, precio) VALUES
('HEM-001', 'Hemograma Completo', 'Hematología', 'células/μL', 'Ver tabla referencia', 25.00),
('BIO-001', 'Glucosa', 'Bioquímica', 'mg/dL', '70-100', 15.00),
('BIO-002', 'Colesterol Total', 'Bioquímica', 'mg/dL', '<200', 20.00),
('URI-001', 'Análisis de Orina', 'Urología', 'N/A', 'Ver tabla referencia', 18.00),
('MIC-001', 'Cultivo de Exudado', 'Microbiología', 'N/A', 'Negativo', 35.00);

-- Servicios médicos
INSERT INTO servicios (codigo_mpps, nombre, descripcion, precio) VALUES
('CONS-GEN', 'Consulta Medicina General', 'Consulta médica general', 50.00),
('CONS-PED', 'Consulta Pediatría', 'Consulta pediátrica', 60.00),
('CONS-GIN', 'Consulta Ginecología', 'Consulta ginecológica', 70.00),
('ECO-ABD', 'Ecografía Abdominal', 'Ecografía de abdomen', 150.00),
('RAD-TORAX', 'Radiografía de Tórax', 'Rx de tórax PA y Lateral', 80.00);

-- Pacientes de ejemplo
INSERT INTO pacientes (cedula, tipo_cedula, expediente, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion, tipo_sangre, ocupacion) VALUES
('V-11111111', 'V', 'EXP-2024-000001', 'Juan', 'Pérez', '1985-03-15', 'M', '0414-123-4567', 'Caracas, Venezuela', 'O+', 'Ingeniero'),
('V-22222222', 'V', 'EXP-2024-000002', 'María', 'López', '1990-07-22', 'F', '0424-987-6543', 'Valencia, Venezuela', 'A-', 'Profesora'),
('V-33333333', 'V', 'EXP-2024-000003', 'Pedro', 'García', '1978-11-08', 'M', '0416-555-1234', 'Maracaibo, Venezuela', 'B+', 'Comerciante'),
('V-44444444', 'V', 'EXP-2024-000004', 'Ana', 'Rodríguez', '1995-01-30', 'F', '0426-777-8888', 'Barquisimeto, Venezuela', 'AB+', 'Estudiante');

-- Enfermedades notificables
INSERT INTO enfermedades_notificables (codigo_cie10, nombre, notificacion_obligatoria, plazo_notificacion_horas) VALUES
('A01', 'Cólera', true, 24),
('A15-A19', 'Tuberculosis', true, 48),
('A90', 'Dengue', true, 24),
('B15-B19', 'Hepatitis vírica', true, 24),
('B20-B24', 'VIH/SIDA', true, 72),
('J00-J06', 'Infecciones respiratorias agudas', false, 168),
('Z20-Z29', 'Contacto y exposición a enfermedades transmisibles', true, 24);