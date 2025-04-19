import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import BotonCerrarSesion from './BotonCerrarSesion';
import { useNavigate, useLocation } from 'react-router-dom';

const ResumenGastos = () => {
  const [mostrarDesactivados, setMostrarDesactivados] = useState(false);
  const [productosDesactivados, setProductosDesactivados] = useState([]);
  const [editandoProducto, setEditandoProducto] = useState(null);
  const [productoEditado, setProductoEditado] = useState({
    nombre: '',
    marca: '',
    precio: '',
    unidad: '',
    categoria: ''
  });
  const [gastosMensuales, setGastosMensuales] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth());
  const [año, setAño] = useState(new Date().getFullYear());
  const [tiendaActual, setTiendaActual] = useState(null);
  const [tiendaId, setTiendaId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Intentar obtener tiendaId de varias fuentes
  useEffect(() => {
    const buscarTiendaSeleccionada = async () => {
      try {
        // Verificar si el usuario está autenticado
        if (!auth.currentUser) {
          throw new Error('Usuario no autenticado');
        }
        
        const userId = auth.currentUser.uid;
        
        // 1. Primero, intentar obtener tiendaId de los parámetros o estado
        let idTienda = location.state?.tiendaId || new URLSearchParams(window.location.search).get('tiendaId');
        
        // 2. Si no hay tiendaId en los parámetros, intentar obtenerlo de localStorage
        if (!idTienda) {
          const ultimaTiendaSeleccionada = localStorage.getItem('ultimaTiendaSeleccionada');
          console.log('Obteniendo tienda de localStorage:', ultimaTiendaSeleccionada);
          if (ultimaTiendaSeleccionada) {
            idTienda = ultimaTiendaSeleccionada;
          }
        }
        
        // 3. Si encontramos un ID de tienda, obtener los datos completos
        if (idTienda) {
          const tiendaRef = doc(db, 'usuarios', userId, 'tiendas', idTienda);
          const tiendaSnapshot = await getDoc(tiendaRef);
          
          if (tiendaSnapshot.exists()) {
            const tiendaData = {
              id: tiendaSnapshot.id,
              ...tiendaSnapshot.data()
            };
            setTiendaActual(tiendaData);
            setTiendaId(idTienda);
            console.log("Tienda encontrada:", tiendaData.nombre);
          } else {
            throw new Error('Tienda no encontrada');
          }
        } else {
          // 4. Si no hay tiendaId, intentar obtener la primera tienda disponible
          console.log("No se encontró ID de tienda, buscando la primera tienda disponible");
          const tiendasRef = collection(db, 'usuarios', userId, 'tiendas');
          const tiendasSnapshot = await getDocs(tiendasRef);
          
          if (!tiendasSnapshot.empty) {
            const primeraTienda = tiendasSnapshot.docs[0];
            const tiendaData = {
              id: primeraTienda.id,
              ...primeraTienda.data()
            };
            setTiendaActual(tiendaData);
            setTiendaId(primeraTienda.id);
            console.log("Primera tienda encontrada:", tiendaData.nombre);
          } else {
            throw new Error("No hay tiendas disponibles");
          }
        }
      } catch (err) {
        console.error("Error al buscar tienda:", err);
        setError("No se pudo encontrar la tienda seleccionada. Por favor, regresa y selecciona una tienda.");
      }
    };
    
    buscarTiendaSeleccionada();
  }, [location]);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    if (tiendaId) {
      obtenerResumen(); // Cargar datos cuando tengamos el tiendaId
    }
  }, [mes, año, tiendaId]); // Se ejecutará cuando cambie el mes, año o tiendaId

  const obtenerResumen = async () => {
    try {
      if (!tiendaId) {
        console.error("No hay ID de tienda para obtener resumen");
        throw new Error('No se ha especificado una tienda');
      }

      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      const userId = auth.currentUser.uid;

      // Obtener datos solo de la tienda actual
      const tiendaRef = doc(db, "usuarios", userId, "tiendas", tiendaId);
      const tiendaDoc = await getDoc(tiendaRef);

      if (!tiendaDoc.exists()) {
        throw new Error('Tienda no encontrada');
      }

      const tienda = tiendaDoc.data();
      let totalGastos = 0;
      const gastosPorTienda = {
        tienda: tienda.nombre,
        total: 0,
        cantidadProductos: 0
      };

      // Procesar productos de la tienda actual
      if (tienda.productos) {
        tienda.productos.forEach(producto => {
          // Verificar si tiene fecha de compra
          if (!producto.fechaCompra) return;

          // Convertir la fecha (puede ser string o Timestamp)
          let fechaCompra;
          if (typeof producto.fechaCompra === 'object' && producto.fechaCompra.toDate) {
            fechaCompra = producto.fechaCompra.toDate();
          } else {
            fechaCompra = new Date(producto.fechaCompra);
          }

          // Verificar si la fecha es válida
          if (isNaN(fechaCompra.getTime())) return;

          // Verificar si está en el rango del mes seleccionado
          const primerDiaMes = new Date(año, mes, 1);
          const ultimoDiaMes = new Date(año, mes + 1, 0);
          if (fechaCompra >= primerDiaMes && fechaCompra <= ultimoDiaMes) {
            const precio = parseFloat(producto.precio) || 0;
            
            gastosPorTienda.total += precio;
            gastosPorTienda.cantidadProductos += 1;
            totalGastos += precio;
          }
        });
      }

      setGastosMensuales({
        total: totalGastos,
        porTienda: [gastosPorTienda]
      });
    } catch (error) {
      console.error("Error al obtener resumen:", error);
      alert('Error al cargar los gastos. Por favor, intenta nuevamente.');
    }
  };

  const handleEdit = (producto) => {
    setEditandoProducto(producto);
    setProductoEditado({
      nombre: producto.nombre,
      marca: producto.marca || '',
      precio: producto.precio || '',
      unidad: producto.unidad || '',
      categoria: producto.categoria || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      const userId = auth.currentUser.uid;
      const productoRef = doc(db, 'usuarios', userId, 'productos', editandoProducto.id);
      await updateDoc(productoRef, {
        ...productoEditado,
        precio: parseFloat(productoEditado.precio) || 0
      });
      setEditandoProducto(null);
      obtenerResumen();
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
    }
  };

  const handleDelete = async (producto) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        if (!auth.currentUser) {
          throw new Error('Usuario no autenticado');
        }
        
        const userId = auth.currentUser.uid;
        
        // 1. Obtener el producto completo
        const productoRef = doc(db, 'usuarios', userId, 'productos', producto.id);
        const productoDoc = await getDoc(productoRef);
        const productoData = productoDoc.data();

        // 2. Agregar a la colección de desactivados
        const desactivadosRef = collection(db, 'usuarios', userId, 'desactivados');
        await addDoc(desactivadosRef, {
          ...productoData,
          fechaDesactivacion: new Date(),
          productoId: producto.id,
          tiendaNombre: productoData.tiendaNombre || 'Desconocida'
        });

        // 3. Actualizar el documento de la tienda
        if (productoData.tiendaId) {
          const tiendaRef = doc(db, 'usuarios', userId, 'tiendas', productoData.tiendaId);
          const tiendaDoc = await getDoc(tiendaRef);
          
          if (tiendaDoc.exists()) {
            const tiendaData = tiendaDoc.data();
            const productos = tiendaData.productos || [];
            const nuevosProductos = productos.filter(p => p.id !== producto.id);
            await updateDoc(tiendaRef, { productos: nuevosProductos });
          }
        }

        // 4. Eliminar de la colección productos
        await deleteDoc(productoRef);

        // 5. Actualizar la interfaz
        obtenerResumen();
        if (mostrarDesactivados) {
          obtenerProductosDesactivados();
        }
      } catch (error) {
        console.error('Error al eliminar el producto:', error);
      }
    }
  };

  const obtenerProductosDesactivados = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      const userId = auth.currentUser.uid;
      const desactivadosRef = collection(db, 'usuarios', userId, 'desactivados');
      const q = query(desactivadosRef);
      const snapshot = await getDocs(q);
      
      const productos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProductosDesactivados(productos);
    } catch (error) {
      console.error('Error al obtener productos desactivados:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/seleccionar-tienda')}
            className="back-button"
            title="Volver a la tienda"
          >
            <span>❮</span> Volver a Tienda
          </button>
        </div>
      </div>
      
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>
        Resumen de Gastos Mensuales
        {tiendaActual && (
          <span style={{ fontSize: '0.8em', display: 'block', color: '#3498db', marginTop: '5px' }}>
            {tiendaActual.nombre}
          </span>
        )}
      </h1>
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          textAlign: 'center' 
        }}>
          {error}
        </div>
      )}
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <select 
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px' }}
          >
            {meses.map((nombreMes, index) => (
              <option key={index} value={index}>{nombreMes}</option>
            ))}
          </select>
          
          <select 
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px' }}
          >
            {[2023, 2024, 2025].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          
          <button 
            onClick={obtenerResumen}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Ver Resumen
          </button>
        </div>
      </div>

      {gastosMensuales && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            Total Gastado: ${gastosMensuales.total.toFixed(2)}
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ color: '#2c3e50', fontWeight: 'bold' }}>Tienda con más gastos:</span>
              <span style={{ color: '#007bff' }}>{gastosMensuales.porTienda[0]?.tienda}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ color: '#2c3e50', fontWeight: 'bold' }}>Total productos:</span>
              <span style={{ color: '#007bff' }}>{gastosMensuales.porTienda.reduce((sum, gasto) => sum + gasto.cantidadProductos, 0)}</span>
            </div>
          </div>
          
          <h3>Gastos por Tienda:</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Tienda</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Productos</th>
              </tr>
            </thead>
            <tbody>
              {gastosMensuales.porTienda.map((gasto, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{gasto.tienda}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    ${gasto.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {gasto.cantidadProductos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <BotonCerrarSesion />
      </div>
    </div>
  );
};

export default ResumenGastos;
