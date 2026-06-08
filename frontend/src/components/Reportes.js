import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

function Reportes() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0]);
    const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reportes/consolidado', {
                params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
            });
            setReportData(response.data);
        } catch (error) {
            toast.error('Error al cargar reportes');
        }
        setLoading(false);
    };

    const generarReporteMPPS = async (tipo) => {
        try {
            const response = await axios.post('/api/reportes/mpps/diario', {
                tipo_reporte: tipo,
                fecha: new Date().toISOString().split('T')[0]
            });
            toast.success(`Reporte ${tipo} MPPS generado`);
            console.log('XML MPPS:', response.data.xml_mpps || response.data.datos);
        } catch (error) {
            toast.error('Error al generar reporte MPPS');
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    return (
        <div className="reportes-container">
            <h2>Reportes y Estadísticas</h2>

            <div className="filtros">
                <h3>Filtros de Fecha</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Desde</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Hasta</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <button className="btn-primary" type="button" onClick={fetchReportData}>
                            Actualizar Reportes
                        </button>
                    </div>
                </div>
            </div>

            {loading && <div className="loading">Generando reportes...</div>}

            {reportData && (
                <div className="reportes-grid">
                    <div className="reporte-card">
                        <h3>Reportes MPPS Obligatorios</h3>
                        <div className="mpps-actions">
                            <button className="btn-primary" type="button" onClick={() => generarReporteMPPS('diario')}>
                                Generar Reporte Diario
                            </button>
                            <button className="btn-primary" type="button" onClick={() => generarReporteMPPS('semanal')}>
                                Generar Reporte Semanal
                            </button>
                            <button className="btn-primary" type="button" onClick={() => generarReporteMPPS('mensual')}>
                                Generar Reporte Mensual
                            </button>
                        </div>
                        <div className="mpps-info">
                            <p><strong>Último reporte:</strong> {reportData.ultimo_reporte_mpps || 'N/A'}</p>
                            <p><strong>Estado:</strong> {reportData.estado_mpps || 'Pendiente'}</p>
                        </div>
                    </div>

                    <div className="reporte-card">
                        <h3>Estadísticas Generales</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span>Total Pacientes</span>
                                <strong>{reportData.total_pacientes ?? 0}</strong>
                            </div>
                            <div className="stat-item">
                                <span>Consultas en Período</span>
                                <strong>{reportData.total_consultas ?? 0}</strong>
                            </div>
                            <div className="stat-item">
                                <span>Facturación Total</span>
                                <strong>Bs.D {reportData.facturacion_total?.toFixed(2) ?? '0.00'}</strong>
                            </div>
                            <div className="stat-item">
                                <span>Recetas Generadas</span>
                                <strong>{reportData.total_recetas ?? 0}</strong>
                            </div>
                        </div>
                    </div>

                    {reportData.chart_facturacion && (
                        <div className="reporte-card wide">
                            <h3>Facturación por Día</h3>
                            <Line
                                data={reportData.chart_facturacion}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'top' }
                                    }
                                }}
                            />
                        </div>
                    )}

                    {reportData.chart_consultas && (
                        <div className="reporte-card">
                            <h3>Consultas por Especialidad</h3>
                            <Pie
                                data={reportData.chart_consultas}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'right' }
                                    }
                                }}
                            />
                        </div>
                    )}

                    <div className="reporte-card">
                        <h3>Medicamentos más Utilizados</h3>
                        <div className="medicamentos-list">
                            {reportData.top_medicamentos?.map((med, index) => (
                                <div key={index} className="medicamento-item">
                                    <span>{med.nombre}</span>
                                    <strong>{med.cantidad} rec</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="reporte-card">
                        <h3>Exportar Reportes</h3>
                        <div className="export-actions">
                            <button className="btn-secondary" type="button">Exportar Excel</button>
                            <button className="btn-secondary" type="button">Exportar PDF</button>
                            <button className="btn-secondary" type="button">Exportar CSV</button>
                        </div>
                        <div className="export-info">
                            <p><strong>Formatos soportados:</strong> PDF, Excel, CSV, XML</p>
                            <p><strong>Normativa:</strong> Cumple MPPS y SENIAT</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="reportes-normativos">
                <h3>Reportes Normativos Obligatorios</h3>
                <div className="normativos-grid">
                    <div className="normativo-item">
                        <h4>MPPS - Ministerio de Salud</h4>
                        <ul>
                            <li>Reporte diario de atención</li>
                            <li>Reporte epidemiológico semanal</li>
                            <li>Reporte mensual consolidado</li>
                            <li>Enfermedades de notificación obligatoria</li>
                        </ul>
                    </div>

                    <div className="normativo-item">
                        <h4>SENIAT - Facturación</h4>
                        <ul>
                            <li>Facturas electrónicas XML</li>
                            <li>Libro de ventas</li>
                            <li>Declaración de impuestos</li>
                            <li>Retenciones IVA</li>
                        </ul>
                    </div>

                    <div className="normativo-item">
                        <h4>Auditoría Interna</h4>
                        <ul>
                            <li>Reporte de auditoría diaria</li>
                            <li>Control de acceso</li>
                            <li>Trazabilidad de acciones</li>
                            <li>Backup automático regular</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reportes;
