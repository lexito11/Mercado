import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './ComparadorPrecios.css';
import BotonCerrarSesion from './BotonCerrarSesion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useParams, useLocation } from 'react-router-dom';

// Registrar componentes necesarios de Chart.js
Chart.register(...registerables);

const ComparadorPrecios = () => {
  const [mes1, setMes1] = useState(new Date());
  const [mes2, setMes2] = useState(new Date());
  const [productos1, setProductos1] = useState([]);
  const [productos2, setProductos2] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarGrafico, setMostrarGrafico] = useState(true);
  const [tiendaActual, setTiendaActual] = useState(null);
  const [tiendaId, setTiendaId] = useState(null);
  const navigate = useNavigate();
  const params = useParams();
  
  // Al iniciar el componente, intentamos obtener la tienda actual
  useEffect(() => {
    const buscarTiendaSeleccionada = async () => {
      try {
        // Verificamos si hay un tiendaId en localStorage (lo más probable)
        const ultimaTiendaSeleccionada = localStorage.getItem('ultimaTiendaSeleccionada');
        
        console.log('Intentando obtener última tienda seleccionada del localStorage:', ultimaTiendaSeleccionada);
        
        // Si hay una tienda en localStorage
        if (ultimaTiendaSeleccionada) {
          const tiendaRef = doc(db, 'tiendas', ultimaTiendaSeleccionada);
          const tiendaSnapshot = await getDoc(tiendaRef);
          
          if (tiendaSnapshot.exists()) {
            const tiendaData = {
              id: tiendaSnapshot.id,
              ...tiendaSnapshot.data()
            };
            console.log("Tienda encontrada en localStorage:", tiendaData.nombre);
            setTiendaActual(tiendaData);
            setTiendaId(ultimaTiendaSeleccionada);
            return; // Terminamos si encontramos la tienda
          }
        }
        
        // Si llegamos aquí, intentamos obtener la primera tienda disponible
        console.log("No se encontró tienda en localStorage, buscando la primera tienda disponible");
        const tiendasRef = collection(db, 'tiendas');
        const tiendasSnapshot = await getDocs(tiendasRef);
        
        if (!tiendasSnapshot.empty) {
          const primeraTienda = tiendasSnapshot.docs[0];
          const tiendaData = {
            id: primeraTienda.id,
            ...primeraTienda.data()
          };
          console.log("Primera tienda encontrada:", tiendaData.nombre);
          setTiendaActual(tiendaData);
          setTiendaId(primeraTienda.id);
        } else {
          throw new Error("No hay tiendas disponibles");
        }
      } catch (err) {
        console.error("Error al buscar tienda:", err);
        setError("No se pudo encontrar la tienda seleccionada. Por favor, regresa y selecciona una tienda.");
      }
    };
    
    buscarTiendaSeleccionada();
  }, []);
  
  const obtenerProductosPorMes = async (fecha) => {
    try {
      if (!tiendaId) {
        console.error("No hay ID de tienda para filtrar productos");
        throw new Error('No se ha especificado una tienda');
      }

      const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      
      console.log(`Buscando productos para tienda ${tiendaId} entre ${inicio.toISOString()} y ${fin.toISOString()}`);

      // Obtener la tienda específica
      const tiendaRef = doc(db, 'tiendas', tiendaId);
      const tiendaDoc = await getDoc(tiendaRef);
      
      if (!tiendaDoc.exists()) {
        console.error(`Tienda con ID ${tiendaId} no encontrada`);
        throw new Error('Tienda no encontrada');
      }
      
      const tienda = tiendaDoc.data();
      console.log(`Tienda: ${tienda.nombre}, Productos: ${tienda.productos ? tienda.productos.length : 0}`);
      
      const productos = [];
      
      if (tienda.productos && Array.isArray(tienda.productos)) {
        tienda.productos.forEach(producto => {
          // Convertir la fecha si es un Timestamp
          let fechaCompra;
          if (typeof producto.fechaCompra === 'object' && producto.fechaCompra.toDate) {
            fechaCompra = producto.fechaCompra.toDate();
          } else if (producto.fechaCompra) {
            fechaCompra = new Date(producto.fechaCompra);
          } else {
            console.warn(`Producto sin fecha: ${producto.nombre}`);
            return; // Saltar este producto
          }

          // Verificar si la fecha está dentro del rango
          if (fechaCompra >= inicio && fechaCompra <= fin) {
            productos.push({
              ...producto,
              tienda: tienda.nombre,
              fechaCompra: fechaCompra,
              id: tiendaDoc.id + '-' + (producto.id || Math.random().toString(36).substr(2, 9))
            });
          }
        });
      } else {
        console.warn(`No se encontraron productos en la tienda ${tienda.nombre} o no es un array`);
      }
      
      console.log(`Productos encontrados para ${tienda.nombre} en ${fecha.toLocaleDateString()}: ${productos.length}`);
      return productos;
    } catch (error) {
      console.error("Error al obtener productos:", error);
      throw error;
    }
  };

  const compararPrecios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar que las fechas sean válidas
      if (!mes1 || !mes2) {
        throw new Error('Por favor, selecciona ambos meses');
      }

      // Obtener productos de ambos meses
      const [productosMes1, productosMes2] = await Promise.all([
        obtenerProductosPorMes(mes1),
        obtenerProductosPorMes(mes2)
      ]);

      // Verificar si hay productos en ambos meses
      if (productosMes1.length === 0 || productosMes2.length === 0) {
        const mensaje = productosMes1.length === 0 
          ? `No hay productos en el mes ${mes1.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`
          : `No hay productos en el mes ${mes2.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`;
        throw new Error(mensaje);
      }

      // Verificar que los meses sean diferentes
      if (mes1.getMonth() === mes2.getMonth() && mes1.getFullYear() === mes2.getFullYear()) {
        throw new Error('Los meses deben ser diferentes');
      }

      // Asegurarse de que mes1 sea el más antiguo y mes2 el más reciente
      if (mes2 < mes1) {
        // Intercambiar los meses si están en orden incorrecto
        let tempMes = mes1;
        mes1 = mes2;
        mes2 = tempMes;
        
        let tempProductos = productosMes1;
        productosMes1 = productosMes2;
        productosMes2 = tempProductos;
      }

      // Limpiar los nombres de productos (eliminar espacios en blanco)
      const productosMes1Limpios = productosMes1.map(p => ({
        ...p,
        nombre: p.nombre.trim().toLowerCase()
      }));

      const productosMes2Limpios = productosMes2.map(p => ({
        ...p,
        nombre: p.nombre.trim().toLowerCase()
      }));

      // Solo mostrar productos que existen en ambos meses
      const productosComunes = productosMes1Limpios.map(p => p.nombre)
        .filter(nombre => productosMes2Limpios.some(p => p.nombre === nombre));

      if (productosComunes.length === 0) {
        throw new Error('No hay productos en común entre los meses seleccionados');
      }

      // Solo establecer los productos si todo está bien
      const productosMes1Filtrados = productosMes1Limpios.filter(p => 
        productosComunes.includes(p.nombre)
      );

      const productosMes2Filtrados = productosMes2Limpios.filter(p => 
        productosComunes.includes(p.nombre)
      );

      // Limpiar productos existentes antes de establecer los nuevos
      setProductos1([]);
      setProductos2([]);
      
      // Establecer los nuevos productos
      setProductos1(productosMes1Filtrados);
      setProductos2(productosMes2Filtrados);
    } catch (error) {
      console.error('Error detallado:', error);
      setError(error.message || 'Error al comparar precios. Por favor intenta nuevamente.');
      // Limpiar productos en caso de error
      setProductos1([]);
      setProductos2([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular diferencia porcentual entre precios
  const calcularDiferencia = (nombreProducto, esMes1 = true) => {
    const producto1 = productos1.find(p => p.nombre.trim().toLowerCase() === nombreProducto.trim().toLowerCase());
    const producto2 = productos2.find(p => p.nombre.trim().toLowerCase() === nombreProducto.trim().toLowerCase());
    
    if (!producto1 || !producto2) {
      return 'No disponible';
    }
    
    const precio1 = parseFloat(producto1.precio) || 0;
    const precio2 = parseFloat(producto2.precio) || 0;
    
    if (precio1 === 0) return 'N/A';
    
    const diferencia = ((precio2 - precio1) / precio1 * 100);
    const variacion = diferencia.toFixed(2);
    
    return `${variacion}% ${diferencia > 0 ? '(Aumento)' : diferencia < 0 ? '(Disminución)' : '(Sin cambios)'}`;
  };

  // Preparar datos para el gráfico
  const prepararDatosGrafico = () => {
    // Solo mostrar productos que existen en ambos meses
    const productosComunes = productos1.map(p => p.nombre.trim().toLowerCase());

    return {
      labels: productosComunes,
      datasets: [
        {
          label: `${mes1.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`,
          data: productosComunes.map(nombre => {
            const producto = productos1.find(p => p.nombre.trim().toLowerCase() === nombre);
            return producto ? parseFloat(producto.precio) || 0 : 0;
          }),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: `${mes2.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`,
          data: productosComunes.map(nombre => {
            const producto = productos2.find(p => p.nombre.trim().toLowerCase() === nombre);
            return producto ? parseFloat(producto.precio) || 0 : 0;
          }),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Función para mostrar variación en el tooltip
  const afterLabel = (context) => {
    const nombre = context.dataset.label.includes(mes1.getFullYear()) 
      ? context.label 
      : context.label;
    
    const variacion = calcularDiferencia(nombre);
    if (variacion === 'Mismo mes') {
      return 'Este producto está en el mismo mes';
    }
    return `Variación: ${variacion}`;
  };

  return (
    <div className="comparador-container">
      <button 
        onClick={() => {
          navigate('/seleccionar-tienda');
          // También podríamos eliminar la tienda seleccionada para forzar mostrar la lista completa
          // localStorage.removeItem('ultimaTiendaSeleccionada');
        }}
        className="back-button"
        title="Volver a la página principal"
      >
        ❮ Volver a Tiendas
      </button>
      
      <h2 className="comparador-titulo">
        Comparador de Precios por Mes {tiendaActual && ` - ${tiendaActual.nombre}`}
      </h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="comparador-controles">
        <div className="date-picker-group">
          <label>Mes 1:</label>
          <DatePicker
            selected={mes1}
            onChange={setMes1}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="date-picker"
          />
        </div>
        
        <div className="date-picker-group">
          <label>Mes 2:</label>
          <DatePicker
            selected={mes2}
            onChange={setMes2}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="date-picker"
          />
        </div>
        
        <button
          onClick={compararPrecios}
          disabled={loading}
          className="comparar-btn"
        >
          {loading ? 'Comparando...' : 'Comparar'}
        </button>
      </div>

      {/* Solo mostrar gráfico/tabla cuando hay productos */}
      {productos1.length > 0 && productos2.length > 0 && !error && (
        <>
          <div className="grafico-toggle">
            <button 
              onClick={() => setMostrarGrafico(!mostrarGrafico)}
              className="toggle-btn"
            >
              {mostrarGrafico ? 'Mostrar Tabla' : 'Mostrar Gráfico'}
            </button>
          </div>

          {mostrarGrafico ? (
            <div className="grafico-container">
              <Bar 
                data={prepararDatosGrafico()} 
                options={{
                  responsive: true,
                  plugins: {
                    title: {
                      display: true,
                      text: `Comparación de Precios por Producto ${tiendaActual ? '- ' + tiendaActual.nombre : ''}`
                    },
                    tooltip: {
                      callbacks: {
                        afterLabel: afterLabel
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Precio ($)'
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="tablas-comparacion">
              <div className="tabla-mes">
                <h3>{mes1.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos1.map(producto => (
                      <tr key={`mes1-${producto.id}`}>
                        <td>{producto.nombre}</td>
                        <td>${producto.precio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="tabla-mes">
                <h3>{mes2.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos2.map(producto => (
                      <tr key={`mes2-${producto.id}`}>
                        <td>{producto.nombre}</td>
                        <td>${producto.precio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="tabla-variacion">
                <h3>Variación de Precios</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Variación</th>
                      <th>Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos1.map(producto => {
                      const producto1 = productos1.find(p => p.nombre === producto.nombre);
                      const producto2 = productos2.find(p => p.nombre === producto.nombre);
                      const precio1 = parseFloat(producto1?.precio) || 0;
                      const precio2 = parseFloat(producto2?.precio) || 0;
                      const diferencia = precio2 - precio1;
                      
                      return (
                        <tr key={`variacion-${producto.id}`}>
                          <td>{producto.nombre}</td>
                          <td>{calcularDiferencia(producto.nombre, true)}</td>
                          <td>
                            {diferencia !== 0 ? 
                              `$${diferencia.toFixed(2)}` : 
                              'Sin cambios'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="cerrar-sesion-container">
        <BotonCerrarSesion />
      </div>
    </div>
  );
};

export default ComparadorPrecios;