import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { toast } from 'react-toastify';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function Dashboard({ user }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const statsResponse = await axios.get('/api/estadisticas/dashboard');
            setStats(statsResponse.data);

            // Obtener datos para gráfico
            const citasResponse = await axios.get('/api/citas/hoy');
            await axios.get('/api/facturas', {
                params: { limit: 10 }
            });

            // Preparar datos para gráfico
            const citasPorEstado = {
                programadas: citasResponse.data.filter(c => c.estado === 'programada').length,
                atendidas: citasResponse.data.filter(c => c.estado === 'atendida').length,
                ausentes: citasResponse.data.filter(c => c.estado === 'ausente').length,
                canceladas: citasResponse.data.filter(c => c.estado === 'cancelada').length
            };

            setChartData({
                labels: ['Programadas', 'Atendidas', 'Ausentes', 'Canceladas'],
                datasets: [
                    {
                        label: 'Citas Hoy',
                        data: [
                            citasPorEstado.programadas,
                            citasPorEstado.atendidas,
                            citasPorEstado.ausentes,
                            citasPorEstado.canceladas
                        ],
                        backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#F44336']
                    }
                ]
            });
        } catch (error) {
            toast.error('Error al cargar datos del dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="dashboard-container">
            <h2>Dashboard - Sistema Hospitalario Venezolano</h2>
            <p>Bienvenido, {user.nombres} ({user.rol})</p>

            {loading && <div className="loading">Cargando dashboard...</div>}

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Pacientes Nuevos Hoy</h3>
                        <div className="stat-value">{stats.pacientes_hoy}</div>
                        <div className="stat-label">Registrados</div>
                    </div>
                    
                    <div className="stat-card">
                        <h3>Consultas Realizadas Hoy</h3>
                        <div className="stat-value">{stats.consultas_hoy}</div>
                        <div className="stat-label">Episodios</div>
                    </div>
                    
                    <div className="stat-card">
                        <h3>Facturación Hoy</h3>
                        <div className="stat-value">Bs.D {stats.facturacion_hoy.toFixed(2)}</div>
                        <div className="stat-label">Total</div>
                    </div>
                    
                    <div className="stat-card">
                        <h3>Citas Programadas Hoy</h3>
                        <div className="stat-value">{stats.citas_hoy}</div>
                        <div className="stat-label">Agenda</div>
                    </div>
                    
                    <div className="stat-card alert">
                        <h3>Stock Crítico</h3>
                        <div className="stat-value">{stats.stock_critico}</div>
                        <div className="stat-label">Medicamentos</div>
                        <button 
                            className="btn-warning"
                            onClick={() => window.location.href = '/farmacia'}
                        >
                            Ver Inventario
                        </button>
                    </div>
                </div>
            )}

            {chartData && (
                <div className="chart-section">
                    <h3>Distribución de Citas Hoy</h3>
                    <Bar data={chartData} options={{
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' }
                        }
                    }} />
                </div>
            )}

            <div className="quick-actions">
                <h3>Acciones Rápidas</h3>
                <div className="actions-grid">
                    {(user.rol === 'medico' || user.rol === 'recepcion') && (
                        <button 
                            className="action-btn"
                            onClick={() => window.location.href = '/pacientes'}
                        >
                            Registrar Nuevo Paciente
                        </button>
                    )}
                    
                    {(user.rol === 'medico' || user.rol === 'recepcion') && (
                        <button 
                            className="action-btn"
                            onClick={() => window.location.href = '/citas'}
                        >
                            Programar Nueva Cita
                        </button>
                    )}
                    
                    {user.rol === 'admin' && (
                        <button 
                            className="action-btn"
                            onClick={() => window.location.href = '/reportes'}
                        >
                            Generar Reportes MPPS
                        </button>
                    )}
                    
                    {(user.rol === 'recepcion' || user.rol === 'admin') && (
                        <button 
                            className="action-btn"
                            onClick={() => window.location.href = '/facturacion'}
                        >
                            Crear Nueva Factura
                        </button>
                    )}
                </div>
            </div>

            <div className="system-info">
                <h3>Información del Sistema</h3>
                <div className="info-grid">
                    <div>
                        <strong>Normativa:</strong> MPPS Venezuela
                    </div>
                    <div>
                        <strong>Facturación:</strong> SENIAT compatible
                    </div>
                    <div>
                        <strong>Base de datos:</strong> PostgreSQL
                    </div>
                    <div>
                        <strong>Seguridad:</strong> JWT + BCrypt
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
