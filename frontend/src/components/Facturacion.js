import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Facturacion() {
    const [facturas, setFacturas] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [facturaForm, setFacturaForm] = useState({
        paciente_id: '',
        forma_pago: 'efectivo',
        servicios: []
    });

    useEffect(() => {
        fetchFacturas();
        fetchServicios();
        fetchPacientes();
    }, []);

    const fetchFacturas = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/facturas');
            setFacturas(response.data);
        } catch (error) {
            toast.error('Error al cargar facturas');
        }
        setLoading(false);
    };

    const fetchServicios = async () => {
        try {
            const response = await axios.get('/api/servicios');
            setServicios(response.data);
        } catch (error) {
            toast.error('Error al cargar servicios');
        }
    };

    const fetchPacientes = async () => {
        try {
            const response = await axios.get('/api/pacientes', { params: { limit: 50 } });
            setPacientes(response.data.pacientes);
        } catch (error) {
            toast.error('Error al cargar pacientes');
        }
    };

    const calcularTotales = () => {
        let subtotal = 0;
        let iva = 0;

        facturaForm.servicios.forEach((servicio) => {
            const servicioInfo = servicios.find(s => s.id === servicio.id);
            if (servicioInfo) {
                const itemSubtotal = servicioInfo.precio * servicio.cantidad;
                const itemIva = itemSubtotal * (servicioInfo.iva_porcentaje / 100);
                subtotal += itemSubtotal;
                iva += itemIva;
            }
        });

        return {
            subtotal: subtotal.toFixed(2),
            iva: iva.toFixed(2),
            total: (subtotal + iva).toFixed(2)
        };
    };

    const crearFactura = async () => {
        if (!facturaForm.paciente_id) {
            toast.error('Seleccione un paciente');
            return;
        }

        if (facturaForm.servicios.length === 0) {
            toast.error('Agregue servicios a la factura');
            return;
        }

        try {
            const response = await axios.post('/api/facturas', facturaForm);
            toast.success(`Factura ${response.data.numero_control} creada exitosamente`);
            setShowModal(false);
            setFacturaForm({
                paciente_id: '',
                forma_pago: 'efectivo',
                servicios: []
            });
            fetchFacturas();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al crear factura');
        }
    };

    const agregarServicio = () => {
        const nuevoServicio = {
            id: '',
            cantidad: 1
        };

        setFacturaForm({
            ...facturaForm,
            servicios: [...facturaForm.servicios, nuevoServicio]
        });
    };

    const registrarPago = async (facturaId) => {
        try {
            await axios.post(`/api/facturas/${facturaId}/pagar`, {
                forma_pago: 'efectivo'
            });
            toast.success('Pago registrado exitosamente');
            fetchFacturas();
        } catch (error) {
            toast.error('Error al registrar pago');
        }
    };

    const generarFacturaSeniat = async (facturaId) => {
        try {
            const response = await axios.get(`/api/facturas/${facturaId}/seniat`);
            toast.success('XML SENIAT generado');
            console.log('XML SENIAT:', response.data.xml_seniat);
        } catch (error) {
            toast.error('Error al generar XML SENIAT');
        }
    };

    const totals = calcularTotales();

    return (
        <div className="facturacion-container">
            <div className="header">
                <h2>Gestión de Facturación SENIAT</h2>
                <div className="controls">
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        Crear Nueva Factura
                    </button>
                    <button className="btn-info" onClick={() => window.location.href = '/reportes/facturacion'}>
                        Reportes de Facturación
                    </button>
                </div>
            </div>

            {loading && <div className="loading">Cargando facturas...</div>}

            <div className="facturas-table">
                <table>
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Paciente</th>
                            <th>Fecha</th>
                            <th>Total (Bs.D)</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {facturas.length === 0 ? (
                            <tr>
                                <td colSpan="6">No hay facturas registradas</td>
                            </tr>
                        ) : (
                            facturas.map(factura => (
                                <tr key={factura.id}>
                                    <td>{factura.numero_control}</td>
                                    <td>{factura.paciente_id}</td>
                                    <td>{new Date(factura.fecha_emision).toLocaleDateString()}</td>
                                    <td>Bs.D {factura.total.toFixed(2)}</td>
                                    <td>{factura.estado}</td>
                                    <td>
                                        {factura.estado !== 'pagada' && (
                                            <button className="btn-success" onClick={() => registrarPago(factura.id)}>
                                                Registrar Pago
                                            </button>
                                        )}
                                        <button className="btn-info" onClick={() => generarFacturaSeniat(factura.id)}>
                                            Generar XML SENIAT
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content wide">
                        <h3>Crear Nueva Factura SENIAT</h3>
                        <form>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Paciente *</label>
                                    <select
                                        value={facturaForm.paciente_id}
                                        onChange={(e) => setFacturaForm({ ...facturaForm, paciente_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar Paciente</option>
                                        {pacientes.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.cedula} - {p.nombres} {p.apellidos}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Forma de Pago</label>
                                    <select
                                        value={facturaForm.forma_pago}
                                        onChange={(e) => setFacturaForm({ ...facturaForm, forma_pago: e.target.value })}
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="mixto">Mixto</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Servicios</label>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={agregarServicio}
                                >
                                    + Agregar Servicio
                                </button>

                                {facturaForm.servicios.map((servicio, index) => (
                                    <div key={index} className="servicio-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Servicio</label>
                                                <select
                                                    value={servicio.id}
                                                    onChange={(e) => {
                                                        const nuevosServicios = [...facturaForm.servicios];
                                                        nuevosServicios[index].id = e.target.value;
                                                        setFacturaForm({ ...facturaForm, servicios: nuevosServicios });
                                                    }}
                                                >
                                                    <option value="">Seleccionar Servicio</option>
                                                    {servicios.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.nombre} - Bs.D {s.precio}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Cantidad</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={servicio.cantidad}
                                                    onChange={(e) => {
                                                        const nuevosServicios = [...facturaForm.servicios];
                                                        nuevosServicios[index].cantidad = parseInt(e.target.value, 10);
                                                        setFacturaForm({ ...facturaForm, servicios: nuevosServicios });
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <button
                                                    type="button"
                                                    className="btn-danger"
                                                    onClick={() => {
                                                        const nuevosServicios = facturaForm.servicios.filter((_, i) => i !== index);
                                                        setFacturaForm({ ...facturaForm, servicios: nuevosServicios });
                                                    }}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="totales">
                                <h4>Totales</h4>
                                <div className="totales-grid">
                                    <div>Subtotal: <strong>Bs.D {totals.subtotal}</strong></div>
                                    <div>IVA: <strong>Bs.D {totals.iva}</strong></div>
                                    <div>Total: <strong>Bs.D {totals.total}</strong></div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="button" className="btn-primary" onClick={crearFactura}>
                                    Generar Factura SENIAT
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Facturacion;
