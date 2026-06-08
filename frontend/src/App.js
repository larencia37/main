import React from 'react';
import Pacientes from './components/Pacientes';
import './App.css';
import './styles/App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistema de Administración Hospitalaria Venezolano</h1>
      </header>
      <main>
        <Pacientes />
      </main>
    </div>
  );
}

export default App;