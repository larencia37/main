// frontend/src/components/Pacientes.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Pacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        cedula: '',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        sexo: 'M',
        telefono: '',
        direccion: '',
        tipo_sangre: '',
        alergias: ''
    });

    useEffect(() => {
        fetchPacientes();
    }, [search]);

    const fetchPacientes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/pacientes?search=${search}`);
            setPacientes(response.data.pacientes);
        } catch (error) {
            toast.error('Error al cargar pacientes');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validar cédula venezolana
        if (!formData.cedula.match(/^[VEP]-\d{5,9}$/)) {
            toast.error('Cédula inválida. Formato: V-12345678');
            return;
        }
        
        try {
            const response = await axios.post('/api/pacientes', formData);
            toast.success('Paciente registrado exitosamente');
            setShowModal(false);
            setFormData({
                cedula: '',
                nombres: '',
                apellidos: '',
                fecha_nacimiento: '',
                sexo: 'M',
                telefono: '',
                direccion: '',
                tipo_sangre: '',
                alergias: ''
            });
            fetchPacientes();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al registrar paciente');
        }
    };

    return (
        <div className="pacientes-container">
            <div className="header">
                <h2>Gestión de Pacientes</h2>
                <div className="controls">
                    <input
                        type="text"
                        placeholder="Buscar por cédula, nombre o expediente"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        Nuevo Paciente
                    </button>
                </div>
            </div>

            {loading && <div className="loading">Cargando...</div>}

            <div className="pacientes-table">
                <table>
                    <thead>
                        <tr>
                            <th>Exp. Número</th>
                            <th>Cédula</th>
                            <th>Nombres</th>
                            <th>Apellidos</th>
                            <th>Teléfono</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pacientes.map(paciente => (
                            <tr key={paciente.id}>
                                <td>{paciente.expediente}</td>
                                <td>{paciente.cedula}</td>
                                <td>{paciente.nombres}</td>
                                <td>{paciente.apellidos}</td>
                                <td>{paciente.telefono}</td>
                                <td>
                                    <button className="btn-info">Ver Historia</button>
                                    <button className="btn-warning">Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Registro de Nuevo Paciente</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cédula Venezolana *</label>
                                    <input
                                        type="text"
                                        placeholder="V-12345678"
                                        value={formData.cedula}
                                        onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                                        required
                                    />
                                    <small>Formato: V/E/P-12345678</small>
                                </div>
                                <div className="form-group">
                                    <label>Nombres *</label>
                                    <input
                                        type="text"
                                        value={formData.nombres}
                                        onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Apellidos *</label>
                                    <input
                                        type="text"
                                        value={formData.apellidos}
                                        onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha Nacimiento *</label>
                                    <input
                                        type="date"
                                        value={formData.fecha_nacimiento}
                                        onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Sexo</label>
                                    <select
                                        value={formData.sexo}
                                        onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                                    >
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                        <option value="O">Otro</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <input
                                        type="tel"
                                        placeholder="0414-123-4567"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Dirección</label>
                                <textarea
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                                    rows={3}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tipo de Sangre</label>
                                    <select
                                        value={formData.tipo_sangre}
                                        onChange={(e) => setFormData({...formData, tipo_sangre: e.target.value})}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Alergias</label>
                                    <textarea
                                        value={formData.alergias}
                                        onChange={(e) => setFormData({...formData, alergias: e.target.value})}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Registrar Paciente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Pacientes;