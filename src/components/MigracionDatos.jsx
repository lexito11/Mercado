import { useState } from 'react';
import { auth } from '../config/firebaseConfig';
import { migrarDatos } from '../services/migracionService';

function MigracionDatos() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMigracion = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        throw new Error('Debes iniciar sesión primero');
      }
      
      const resultado = await migrarDatos();
      setMessage(`Migración exitosa. ${resultado} productos migrados.`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Migración de Datos</h2>
      <button onClick={handleMigracion} disabled={loading}>
        {loading ? 'Migrando...' : 'Iniciar Migración'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default MigracionDatos;