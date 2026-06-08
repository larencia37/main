import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Farmacia({ user }) {
    const [inventario, setInventario] = useState([]);
    const [recetasPendientes, setRecetasPendientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showRecetaModal, setShowRecetaModal] = useState(false);
    const [showInventarioModal, setShowInventarioModal] = useState(false);
    const [selectedReceta, setSelectedReceta] = useState(null);
    
    // Formularios
    const [recetaForm, setRecetaForm] = useState({
        episodio_id: '',
        indicaciones_generales: '',
        medicamentos: []
    });
    
    const [medicamentoForm, setMedicamentoForm] = useState({
        codigo_venezolano: '',
        nombre_comercial: '',
        principio_activo: '',
        presentacion: '',
        precio_compra: '',
        precio_venta: '',
        stock_minimo: 10,
        stock_maximo: 100
    });

    useEffect(() => {
        fetchInventario();
        fetchRecetasPendientes();
    }, []);

    const fetchInventario = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/farmacia/inventario');
            setInventario(response.data);
        } catch (error) {
            toast.error('Error al cargar inventario');
        }
        setLoading(false);
    };

    const fetchRecetasPendientes = async () => {
        try {
            const response = await axios.get('/api/recetas/pendientes');
            setRecetasPendientes(response.data);
        } catch (error) {
            toast.error('Error al cargar recetas pendientes');
        }
    };

    const dispensarReceta = async (recetaId) => {
        try {
            const receta = recetasPendientes.find(r => r.id === recetaId);
            if (!receta) return;
            
            // Verificar disponibilidad de cada medicamento
            for (const detalle of receta.detalle) {
                const medicamento = inventario.find(m => m.id === detalle.medicamento_id);
                if (medicamento.stock_actual < detalle.cantidad) {
                    toast.error(`${medicamento.nombre_comercial}: Stock insuficiente`);
                    return;
                }
            }
            
            // Actualizar receta como dispensada
            await axios.put(`/api/recetas/${recetaId}/dispensar`);
            
            // Actualizar inventario
            for (const detalle of receta.detalle) {
                await axios.post('/api/farmacia/movimientos', {
                    tipo: 'salida',
                    medicamento_id: detalle.medicamento_id,
                    cantidad: detalle.cantidad,
                    motivo: 'dispensación receta',
                    documento_referencia: recetaId
                });
            }
            
            toast.success('Receta dispensada exitosamente');
            fetchInventario();
            fetchRecetasPendientes();
        } catch (error) {
            toast.error('Error al dispensar receta');
        }
    };

    const crearReceta = async () => {
        if (recetaForm.medicamentos.length === 0) {
            toast.error('Debe agregar medicamentos a la receta');
            return;
        }

        try {
            await axios.post('/api/farmacia/recetas', recetaForm);
            toast.success('Receta creada exitosamente');
            setShowRecetaModal(false);
            setRecetaForm({
                episodio_id: '',
                indicaciones_generales: '',
                medicamentos: []
            });
            fetchRecetasPendientes();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al crear receta');
        }
    };

    const agregarMedicamentoReceta = () => {
        const nuevoMedicamento = {
            id: '',
            cantidad: 1,
            dosis: '',
            duracion: '',
            via: 'oral',
            indicaciones: ''
        };
        
        setRecetaForm({
            ...recetaForm,
            medicamentos: [...recetaForm.medicamentos, nuevoMedicamento]
        });
    };

    const registrarMedicamento = async () => {
        if (!medicamentoForm.codigo_venezolano || !medicamentoForm.nombre_comercial) {
            toast.error('Código y nombre comercial son obligatorios');
            return;
        }

        try {
            await axios.post('/api/farmacia/medicamentos', medicamentoForm);
            toast.success('Medicamento registrado exitosamente');
            setShowInventarioModal(false);
            setMedicamentoForm({
                codigo_venezolano: '',
                nombre_comercial: '',
                principio_activo: '',
                presentacion: '',
                precio_compra: '',
                precio_venta: '',
                stock_minimo: 10,
                stock_maximo: 100
            });
            fetchInventario();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al registrar medicamento');
        }
    };

    return (
        <div className="farmacia-container">
            <div className="header">
                <h2>Gestión de Farmacia</h2>
                <div className="controls">
                    {user.rol === 'medico' && (
                        <button className="btn-primary" onClick={() => setShowRecetaModal(true)}>
                            Crear Nueva Receta
                        </button>
                    )}
                    {(user.rol === 'farmaceutico' || user.rol === 'admin') && (
                        <button className="btn-primary" onClick={() => setShowInventarioModal(true)}>
                            Registrar Nuevo Medicamento
                        </button>
                    )}
                </div>
            </div>

            <div className="farmacia-grid">
                <div className="section">
                    <h3>Inventario - Stock Actual</h3>
                    {loading && <div className="loading">Cargando inventario...</div>}
                    
                    <div className="inventario-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Medicamento</th>
                                    <th>Stock Actual</th>
                                    <th>Stock Mínimo</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventario.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.codigo_venezolano}</td>
                                        <td>{item.nombre_comercial}</td>
                                        <td>{item.stock_actual}</td>
                                        <td>{item.stock_minimo}</td>
                                        <td>
                                            {item.critico ? (
                                                <span className="status-critical">CRÍTICO</span>
                                            ) : (
                                                <span className="status-normal">NORMAL</span>
                                            )}
                                        </td>
                                        <td>
                                            <button className="btn-info">Ver Lotes</button>
                                            <button className="btn-warning">Ajustar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="section">
                    <h3>Recetas Pendientes de Dispensación</h3>
                    <div className="recetas-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Receta N°</th>
                                    <th>Paciente</th>
                                    <th>Médico</th>
                                    <th>Fecha</th>
                                    <th>Medicamentos</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recetasPendientes.map(receta => (
                                    <tr key={receta.id}>
                                        <td>REC-{receta.id}</td>
                                        <td>{receta.paciente_nombre}</td>
                                        <td>{receta.medico_nombre}</td>
                                        <td>{new Date(receta.fecha).toLocaleDateString()}</td>
                                        <td>{receta.detalle.length} medicamentos</td>
                                        <td>
                                            <button 
                                                className="btn-success"
                                                onClick={() => dispensarReceta(receta.id)}
                                            >
                                                Dispensar
                                            </button>
                                            <button 
                                                className="btn-info"
                                                onClick={() => setSelectedReceta(receta)}
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showRecetaModal && (
                <div className="modal">
                    <div className="modal-content wide">
                        <h3>Crear Nueva Receta Médica</h3>
                        <form>
                            <div className="form-group">
                                <label>Episodio ID (opcional)</label>
                                <input
                                    type="number"
                                    value={recetaForm.episodio_id}
                                    onChange={(e) => setRecetaForm({...recetaForm, episodio_id: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Indicaciones Generales</label>
                                <textarea
                                    value={recetaForm.indicaciones_generales}
                                    onChange={(e) => setRecetaForm({...recetaForm, indicaciones_generales: e.target.value})}
                                    rows={4}
                                />
                            </div>
                            <div className="form-group">
                                <label>Medicamentos</label>
                                <button 
                                    className="btn-secondary"
                                    type="button"
                                    onClick={agregarMedicamentoReceta}
                                >
                                    + Agregar Medicamento
                                </button>
                                
                                {recetaForm.medicamentos.map((med, index) => (
                                    <div key={index} className="medicamento-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Medicamento</label>
                                                <select
                                                    value={med.id}
                                                    onChange={(e) => {
                                                        const newMedicamentos = [...recetaForm.medicamentos];
                                                        newMedicamentos[index].id = e.target.value;
                                                        setRecetaForm({...recetaForm, medicamentos: newMedicamentos});
                                                    }}
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {inventario.map(m => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.nombre_comercial}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Cantidad</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={med.cantidad}
                                                    onChange={(e) => {
                                                        const newMedicamentos = [...recetaForm.medicamentos];
                                                        newMedicamentos[index].cantidad = e.target.value;
                                                        setRecetaForm({...recetaForm, medicamentos: newMedicamentos});
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Dosis</label>
                                                <input
                                                    type="text"
                                                    placeholder="1 tableta cada 8 horas"
                                                    value={med.dosis}
                                                    onChange={(e) => {
                                                        const newMedicamentos = [...recetaForm.medicamentos];
                                                        newMedicamentos[index].dosis = e.target.value;
                                                        setRecetaForm({...recetaForm, medicamentos: newMedicamentos});
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Duración</label>
                                                <input
                                                    type="text"
                                                    placeholder="7 días"
                                                    value={med.duracion}
                                                    onChange={(e) => {
                                                        const newMedicamentos = [...recetaForm.medicamentos];
                                                        newMedicamentos[index].duracion = e.target.value;
                                                        setRecetaForm({...recetaForm, medicamentos: newMedicamentos});
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowRecetaModal(false)}>
                                    Cancelar
                                </button>
                                <button type="button" className="btn-primary" onClick={crearReceta}>
                                    Crear Receta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showInventarioModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Registrar Nuevo Medicamento</h3>
                        <form>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Código Venezolano *</label>
                                    <input
                                        type="text"
                                        placeholder="Farma-12345 o MPPS-123"
                                        value={medicamentoForm.codigo_venezolano}
                                        onChange={(e) => setMedicamentoForm({...medicamentoForm, codigo_venezolano: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nombre Comercial *</label>
                                    <input
                                        type="text"
                                        value={medicamentoForm.nombre_comercial}
                                        onChange={(e) => setMedicamentoForm({...medicamentoForm, nombre_comercial: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Principio Activo</label>
                                    <input
                                        type="text"
                                        value={medicamentoForm.principio_activo}
                                        onChange={(e) => setMedicamentoForm({...medicamentoForm, principio_activo: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Presentación</label>
                                    <input
                                        type="text"
                                        placeholder="Tabletas, Suspensión, etc."
                                        value={medicamentoForm.presentacion}
                                        onChange={(e) => setMedicamentoForm({...medicamentoForm, presentacion: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Precio Compra (Bs.D)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={medicamentoForm.precio_compra}
                                        onChange={(e) => setMedicamentoForm({...medicamentoForm, precio_compra: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Precio Venta (Bs.D)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={medicamentoForm.precio_venta}
                                        onChange={(e) => setMedicamentoForm({...medicamentoForm, precio_venta: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Stock Mínimo</label>
                                    <input
                                        type="number"
                                        value={medicamentoForm.stock_minimo}
                                        onChange={(e) => setMedicamentoForm({...medicamentoForm, stock_minimo: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stock Máximo</label>
                                    <input
                                        type="number"
                                        value={medicamentoForm.stock_maximo}
                                        onChange={(e) => setMedicamentoForm({...medicamentoForm, stock_maximo: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowInventarioModal(false)}>
                                    Cancelar
                                </button>
                                <button type="button" className="btn-primary" onClick={registrarMedicamento}>
                                    Registrar Medicamento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Farmacia;
