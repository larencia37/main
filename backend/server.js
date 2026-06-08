// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET no definido en producción');
    process.exit(1);
}

// Configuración de la aplicación
const app = express();
const port = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3001';

// Configuración de base de datos PostgreSQL (Venezuela)
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'clinica_venezuela',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Middleware de seguridad
app.use(helmet());
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite por IP
});
app.use('/api/', limiter);

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });
    
    jwt.verify(token, JWT_SECRET || 'clinica_venezuela_secret_2024', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// Middleware de validación de cédula venezolana
const validateCedula = (cedula) => {
    if (!cedula) return false;
    
    // Validar formato V/E/P-12345678
    const regex = /^[VEP]-\d{5,9}$/;
    if (!regex.test(cedula)) return false;
    
    // Algoritmo de validación de cédula venezolana
    const cedulaNum = cedula.substring(2);
    if (cedulaNum.length !== 8) return false;
    
    let suma = 0;
    for (let i = 0; i < cedulaNum.length; i++) {
        const digito = Number(cedulaNum[i]);
        if (Number.isNaN(digito)) return false;

        let valor = digito;
        if (i % 2 === 0) {
            valor *= 2;
            if (valor > 9) valor -= 9;
        }
        suma += valor;
    }
    
    return suma % 10 === 0;
};

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await pool.query(
            'SELECT id, username, password_hash, cedula, nombres, apellidos, rol, especialidad FROM usuarios WHERE username = $1 AND activo = true',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        // Actualizar último login
        await pool.query(
            'UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        // Generar token JWT
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                cedula: user.cedula,
                rol: user.rol,
                nombres: user.nombres,
                apellidos: user.apellidos
            },
            JWT_SECRET || 'clinica_venezuela_secret_2024',
            { expiresIn: '8h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                cedula: user.cedula,
                nombres: user.nombres,
                apellidos: user.apellidos,
                rol: user.rol,
                especialidad: user.especialidad
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================
// RUTAS DE PACIENTES
// ============================================

app.post('/api/pacientes', authenticateToken, async (req, res) => {
    try {
        const {
            cedula,
            nombres,
            apellidos,
            fecha_nacimiento,
            sexo,
            telefono,
            direccion,
            tipo_sangre,
            alergias
        } = req.body;

        const requiredFields = ['cedula', 'nombres', 'apellidos', 'fecha_nacimiento', 'sexo'];
        for (const field of requiredFields) {
            if (!req.body[field] || String(req.body[field]).trim() === '') {
                return res.status(400).json({ error: `Campo requerido: ${field}` });
            }
        }

        // Validar cédula venezolana
        if (!validateCedula(cedula)) {
            return res.status(400).json({ error: 'Cédula venezolana inválida' });
        }
        
        // Generar número de expediente único
        const year = new Date().getFullYear();
        const resultCount = await pool.query('SELECT COUNT(*) FROM pacientes WHERE EXTRACT(YEAR FROM created_at) = $1', [year]);
        const nextNumber = parseInt(resultCount.rows[0].count) + 1;
        const expediente = `EXP-${year}-${nextNumber.toString().padStart(6, '0')}`;
        
        const result = await pool.query(
            `INSERT INTO pacientes (
                cedula, tipo_cedula, expediente, nombres, apellidos, 
                fecha_nacimiento, sexo, telefono, direccion, 
                tipo_sangre, alergias, consentimiento_datos
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, expediente, cedula, nombres, apellidos`,
            [
                cedula,
                cedula.charAt(0),
                expediente,
                nombres,
                apellidos,
                fecha_nacimiento,
                sexo,
                telefono,
                direccion,
                tipo_sangre,
                alergias,
                true // Consentimiento implícito al registrarse
            ]
        );
        
        // Auditoría
        await pool.query(
            'INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CREAR_PACIENTE', 'pacientes', result.rows[0].id, JSON.stringify(req.body)]
        );
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        if (error.code === '23505') { // Violación de unicidad
            return res.status(400).json({ error: 'La cédula ya está registrada' });
        }
        console.error('Error al crear paciente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/pacientes', authenticateToken, async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM pacientes WHERE activo = true';
        let params = [];
        
        if (search) {
            query += ' AND (cedula ILIKE $1 OR nombres ILIKE $1 OR apellidos ILIKE $1 OR expediente ILIKE $1)';
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY apellidos, nombres LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        // Contar total para paginación
        let countQuery = 'SELECT COUNT(*) FROM pacientes WHERE activo = true';
        if (search) {
            countQuery += ' AND (cedula ILIKE $1 OR nombres ILIKE $1 OR apellidos ILIKE $1 OR expediente ILIKE $1)';
        }
        const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
        
        res.json({
            pacientes: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
        
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/pacientes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT p.*, 
                (SELECT COUNT(*) FROM episodios e WHERE e.paciente_id = p.id) as total_consultas,
                (SELECT MAX(fecha_ingreso) FROM episodios e WHERE e.paciente_id = p.id) as ultima_consulta
             FROM pacientes p 
             WHERE p.id = $1 AND p.activo = true`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Obtener antecedentes
        const antecedentes = await pool.query(
            'SELECT * FROM antecedentes WHERE paciente_id = $1 ORDER BY created_at DESC',
            [id]
        );
        
        // Obtener episodios recientes
        const episodios = await pool.query(
            `SELECT e.*, u.nombres || ' ' || u.apellidos as medico_nombre 
             FROM episodios e 
             LEFT JOIN usuarios u ON e.medico_id = u.id 
             WHERE e.paciente_id = $1 
             ORDER BY e.fecha_ingreso DESC 
             LIMIT 10`,
            [id]
        );
        
        res.json({
            paciente: result.rows[0],
            antecedentes: antecedentes.rows,
            episodios: episodios.rows
        });
        
    } catch (error) {
        console.error('Error al obtener paciente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================
// RUTAS DE EPISODIOS / HISTORIA CLÍNICA
// ============================================

app.post('/api/episodios', authenticateToken, async (req, res) => {
    try {
        const {
            paciente_id,
            tipo,
            motivo_consulta,
            sintomatologia,
            examenes_fisicos,
            diagnosticos,
            tratamiento
        } = req.body;
        
        // Verificar que el paciente existe y está activo
        const pacienteCheck = await pool.query(
            'SELECT id FROM pacientes WHERE id = $1 AND activo = true',
            [paciente_id]
        );
        
        if (pacienteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado o inactivo' });
        }
        
        const result = await pool.query(
            `INSERT INTO episodios (
                paciente_id, tipo, motivo_consulta, sintomatologia,
                examenes_fisicos, diagnosticos, tratamiento, medico_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                paciente_id,
                tipo,
                motivo_consulta,
                sintomatologia,
                examenes_fisicos ? JSON.stringify(examenes_fisicos) : null,
                diagnosticos,
                tratamiento,
                req.user.id
            ]
        );
        
        // Auditoría
        await pool.query(
            'INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos) VALUES ($1, $2, $3, $4, $5)',
            [req.user.id, 'CREAR_EPISODIO', 'episodios', result.rows[0].id, JSON.stringify(req.body)]
        );
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Error al crear episodio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/evoluciones', authenticateToken, async (req, res) => {
    try {
        const { episodio_id, subjetivo, objetivo, analisis, plan } = req.body;
        
        // Verificar que el episodio existe
        const episodioCheck = await pool.query(
            'SELECT id FROM episodios WHERE id = $1',
            [episodio_id]
        );
        
        if (episodioCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Episodio no encontrado' });
        }
        
        const result = await pool.query(
            `INSERT INTO evoluciones (
                episodio_id, subjetivo, objetivo, analisis, plan, usuario_id
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [episodio_id, subjetivo, objetivo, analisis, plan, req.user.id]
        );
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Error al crear evolución:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================
// RUTAS DE CITAS
// ============================================

app.post('/api/citas', authenticateToken, async (req, res) => {
    try {
        const { paciente_id, medico_id, consultorio_id, fecha, hora, motivo, tipo_cita } = req.body;
        
        // Validar que la fecha sea futura
        const fechaCita = new Date(`${fecha}T${hora}`);
        if (fechaCita <= new Date()) {
            return res.status(400).json({ error: 'La cita debe ser en fecha futura' });
        }
        
        // Verificar disponibilidad del médico
        const conflicto = await pool.query(
            `SELECT id FROM agenda 
             WHERE medico_id = $1 AND fecha = $2 AND hora = $3 
             AND estado NOT IN ('cancelada', 'ausente')`,
            [medico_id, fecha, hora]
        );
        
        if (conflicto.rows.length > 0) {
            return res.status(400).json({ error: 'El médico ya tiene cita programada en ese horario' });
        }
        
        const result = await pool.query(
            `INSERT INTO agenda (
                paciente_id, medico_id, consultorio_id, fecha, hora, 
                motivo, tipo_cita, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'programada')
            RETURNING *`,
            [paciente_id, medico_id, consultorio_id, fecha, hora, motivo, tipo_cita]
        );
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/citas/hoy', authenticateToken, async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        
        let query = `
            SELECT a.*, 
                   p.nombres as paciente_nombres, p.apellidos as paciente_apellidos, p.cedula as paciente_cedula,
                   u.nombres as medico_nombres, u.apellidos as medico_apellidos,
                   c.nombre as consultorio_nombre
            FROM agenda a
            LEFT JOIN pacientes p ON a.paciente_id = p.id
            LEFT JOIN usuarios u ON a.medico_id = u.id
            LEFT JOIN consultorios c ON a.consultorio_id = c.id
            WHERE a.fecha = $1
        `;
        
        let params = [hoy];
        
        // Si es médico, solo ver sus citas
        if (req.user.rol === 'medico') {
            query += ' AND a.medico_id = $2';
            params.push(req.user.id);
        }
        
        query += ' ORDER BY a.hora';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error al obtener citas de hoy:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================
// RUTAS DE FARMACIA
// ============================================

app.get('/api/farmacia/inventario', authenticateToken, async (req, res) => {
    try {
        const { categoria, stock_critico } = req.query;
        
        let query = `
            SELECT m.*, c.nombre as categoria_nombre,
                   COALESCE(SUM(lm.cantidad_actual), 0) as stock_actual,
                   COALESCE(SUM(lm.cantidad_actual), 0) <= m.stock_minimo as critico
            FROM medicamentos m
            LEFT JOIN categorias_medicamentos c ON m.categoria_id = c.id
            LEFT JOIN lotes_medicamentos lm ON m.id = lm.medicamento_id AND lm.activo = true
            WHERE m.activo = true
        `;
        
        let params = [];
        
        if (categoria) {
            query += ' AND c.nombre ILIKE $1';
            params.push(`%${categoria}%`);
        }
        
        if (stock_critico === 'true') {
            query += ' AND COALESCE(SUM(lm.cantidad_actual), 0) <= m.stock_minimo';
        }
        
        query += ' GROUP BY m.id, c.id ORDER BY m.nombre_comercial';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/farmacia/recetas', authenticateToken, async (req, res) => {
    try {
        const { episodio_id, paciente_id, indicaciones_generales, medicamentos } = req.body;
        
        // Verificar que el usuario es médico
        if (req.user.rol !== 'medico') {
            return res.status(403).json({ error: 'Solo médicos pueden crear recetas' });
        }
        
        const result = await pool.query(
            `INSERT INTO recetas (
                episodio_id, paciente_id, medico_id, indicaciones_generales
            ) VALUES ($1, $2, $3, $4)
            RETURNING id`,
            [episodio_id, paciente_id, req.user.id, indicaciones_generales]
        );
        
        const receta_id = result.rows[0].id;
        
        // Insertar detalle de medicamentos
        for (const medicamento of medicamentos) {
            await pool.query(
                `INSERT INTO recetas_detalle (
                    receta_id, medicamento_id, cantidad, dosis, duracion,
                    via_administracion, indicaciones
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    receta_id,
                    medicamento.id,
                    medicamento.cantidad,
                    medicamento.dosis,
                    medicamento.duracion,
                    medicamento.via,
                    medicamento.indicaciones
                ]
            );
        }
        
        res.status(201).json({ id: receta_id, message: 'Receta creada exitosamente' });
        
    } catch (error) {
        console.error('Error al crear receta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================
// RUTAS DE FACTURACIÓN (SENIAT)
// ============================================

app.post('/api/facturas', authenticateToken, async (req, res) => {
    try {
        const { paciente_id, servicios, forma_pago } = req.body;
        
        // Generar número de control SENIAT
        const year = new Date().getFullYear();
        const resultCount = await pool.query('SELECT COUNT(*) FROM facturas WHERE EXTRACT(YEAR FROM created_at) = $1', [year]);
        const nextNumber = parseInt(resultCount.rows[0].count) + 1;
        const numeroControl = `FAC-${year}-${nextNumber.toString().padStart(6, '0')}`;
        
        // Calcular totales
        let subtotal = 0;
        let iva = 0;
        
        for (const servicio of servicios) {
            const servicioInfo = await pool.query(
                'SELECT precio, iva_porcentaje FROM servicios WHERE id = $1',
                [servicio.id]
            );
            
            if (servicioInfo.rows.length === 0) {
                return res.status(400).json({ error: `Servicio ${servicio.id} no encontrado` });
            }
            
            const precioUnitario = servicioInfo.rows[0].precio;
            const ivaPorcentaje = servicioInfo.rows[0].iva_porcentaje;
            
            const itemSubtotal = precioUnitario * servicio.cantidad;
            const itemIva = itemSubtotal * (ivaPorcentaje / 100);
            
            subtotal += itemSubtotal;
            iva += itemIva;
        }
        
        const total = subtotal + iva;
        
        const result = await pool.query(
            `INSERT INTO facturas (
                numero_control, paciente_id, subtotal, iva, total,
                forma_pago, usuario_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, numero_control`,
            [numeroControl, paciente_id, subtotal, iva, total, forma_pago, req.user.id]
        );
        
        const factura_id = result.rows[0].id;
        
        // Insertar detalle de servicios
        for (const servicio of servicios) {
            const servicioInfo = await pool.query(
                'SELECT precio, iva_porcentaje, nombre FROM servicios WHERE id = $1',
                [servicio.id]
            );
            
            const precioUnitario = servicioInfo.rows[0].precio;
            const ivaPorcentaje = servicioInfo.rows[0].iva_porcentaje;
            const nombreServicio = servicioInfo.rows[0].nombre;
            
            const itemSubtotal = precioUnitario * servicio.cantidad;
            const itemIva = itemSubtotal * (ivaPorcentaje / 100);
            const itemTotal = itemSubtotal + itemIva;
            
            await pool.query(
                `INSERT INTO facturas_detalle (
                    factura_id, servicio_id, cantidad, precio_unitario,
                    subtotal, iva, total, descripcion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    factura_id,
                    servicio.id,
                    servicio.cantidad,
                    precioUnitario,
                    itemSubtotal,
                    itemIva,
                    itemTotal,
                    nombreServicio
                ]
            );
        }
        
        // Generar XML para factura electrónica SENIAT (simplificado)
        const xmlSeniat = `
            <Factura>
                <NumeroControl>${numeroControl}</NumeroControl>
                <Fecha>${new Date().toISOString()}</Fecha>
                <PacienteId>${paciente_id}</PacienteId>
                <Subtotal>${subtotal}</Subtotal>
                <IVA>${iva}</IVA>
                <Total>${total}</Total>
            </Factura>
        `;
        
        await pool.query(
            'UPDATE facturas SET xml_seniat = $1 WHERE id = $2',
            [xmlSeniat, factura_id]
        );
        
        res.status(201).json({
            id: factura_id,
            numero_control: numeroControl,
            total: total,
            xml_seniat: xmlSeniat
        });
        
    } catch (error) {
        console.error('Error al crear factura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================
// RUTAS DE REPORTES MPPS
// ============================================

app.post('/api/reportes/mpps/diario', authenticateToken, async (req, res) => {
    try {
        // Solo administradores pueden generar reportes MPPS
        if (req.user.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden generar reportes MPPS' });
        }
        
        const fecha = req.body.fecha || new Date().toISOString().split('T')[0];
        
        // Obtener datos para reporte diario MPPS
        const datosReporte = {
            fecha: fecha,
            total_pacientes: await pool.query('SELECT COUNT(*) FROM pacientes WHERE activo = true'),
            total_consultas: await pool.query('SELECT COUNT(*) FROM episodios WHERE DATE(fecha_ingreso) = $1', [fecha]),
            enfermedades_notificables: await pool.query(
                'SELECT * FROM enfermedades_notificables WHERE notificacion_obligatoria = true'
            ),
            stock_medicamentos: await pool.query(
                'SELECT COUNT(*) FROM medicamentos WHERE activo = true'
            )
        };
        
        const result = await pool.query(
            `INSERT INTO reportes_mpps (
                tipo_reporte, periodo, datos, usuario_id
            ) VALUES ($1, $2, $3, $4)
            RETURNING id`,
            ['diario', fecha, JSON.stringify(datosReporte), req.user.id]
        );
        
        res.status(201).json({
            id: result.rows[0].id,
            message: 'Reporte MPPS diario generado',
            datos: datosReporte
        });
        
    } catch (error) {
        console.error('Error al generar reporte MPPS:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================
// RUTAS DE UTILIDADES Y MISC
// ============================================

app.get('/api/estadisticas/dashboard', authenticateToken, async (req, res) => {
    try {
        // Estadísticas para dashboard
        
        // Pacientes registrados hoy
        const pacientesHoy = await pool.query(
            'SELECT COUNT(*) FROM pacientes WHERE DATE(created_at) = CURRENT_DATE'
        );
        
        // Consultas realizadas hoy
        const consultasHoy = await pool.query(
            'SELECT COUNT(*) FROM episodios WHERE DATE(fecha_ingreso) = CURRENT_DATE'
        );
        
        // Facturación hoy
        const facturacionHoy = await pool.query(
            'SELECT SUM(total) FROM facturas WHERE DATE(fecha_emision) = CURRENT_DATE AND estado = \'pagada\''
        );
        
        // Stock crítico
        const stockCritico = await pool.query(
            'SELECT COUNT(*) FROM vista_inventario_critico'
        );
        
        // Citas hoy
        const citasHoy = await pool.query(
            'SELECT COUNT(*) FROM agenda WHERE fecha = CURRENT_DATE'
        );
        
        res.json({
            pacientes_hoy: parseInt(pacientesHoy.rows[0].count),
            consultas_hoy: parseInt(consultasHoy.rows[0].count),
            facturacion_hoy: parseFloat(facturacionHoy.rows[0].sum || 0),
            stock_critico: parseInt(stockCritico.rows[0].count),
            citas_hoy: parseInt(citasHoy.rows[0].count)
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(port, () => {
    console.log(`Servidor API ejecutando en http://localhost:${port}`);
    console.log(`Sistema de Administración Hospitalaria Venezolano`);
    console.log(`Base de datos: PostgreSQL`);
    console.log(`Seguridad: JWT, BCrypt, Rate Limiting`);
});