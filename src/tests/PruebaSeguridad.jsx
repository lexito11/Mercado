import React, { useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import './PruebaSeguridad.css';
import { Link } from 'react-router-dom';

const PruebaSeguridad = () => {
  // Estado para almacenar resultados de pruebas
  const [resultados, setResultados] = useState({
    seguridad: [],
    usabilidad: [],
    rendimiento: []
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ejecutarPruebas = async () => {
      try {
        setCargando(true);
        
        // 1. Pruebas de Seguridad
        const resultadosSeguridad = await pruebasSeguridad();
        
        // 2. Pruebas de Usabilidad
        const resultadosUsabilidad = await pruebasUsabilidad();
        
        // 3. Pruebas de Rendimiento
        const resultadosRendimiento = await pruebasRendimiento();
        
        setResultados({
          seguridad: resultadosSeguridad,
          usabilidad: resultadosUsabilidad,
          rendimiento: resultadosRendimiento
        });
      } catch (error) {
        console.error("Error en pruebas:", error);
        setError(error.message);
      } finally {
        setCargando(false);
      }
    };
    
    ejecutarPruebas();
  }, []);

  // Función para pruebas de seguridad
  const pruebasSeguridad = async () => {
    const pruebas = [];
    
    // Prueba 1: Verificar autenticación
    try {
      const usuario = auth.currentUser;
      pruebas.push({
        nombre: "Autenticación de usuario",
        resultado: usuario ? "ÉXITO" : "FALLO",
        detalles: usuario ? "Usuario autenticado correctamente" : "No hay usuario autenticado"
      });
    } catch (error) {
      pruebas.push({
        nombre: "Autenticación de usuario",
        resultado: "ERROR",
        detalles: error.message
      });
    }
    
    // Prueba 2: Verificar permisos de Firestore
    try {
      const tiendasRef = collection(db, "tiendas");
      await getDocs(tiendasRef);
      pruebas.push({
        nombre: "Permisos de Firestore",
        resultado: "ÉXITO",
        detalles: "Acceso correcto a la colección de tiendas"
      });
    } catch (error) {
      pruebas.push({
        nombre: "Permisos de Firestore",
        resultado: "FALLO",
        detalles: error.message
      });
    }
    
    return pruebas;
  };

  // Función para pruebas de usabilidad
  const pruebasUsabilidad = async () => {
    const pruebas = [];
    
    // Prueba 1: Verificar localStorage
    try {
      localStorage.setItem('test', 'test');
      const valor = localStorage.getItem('test');
      localStorage.removeItem('test');
      
      pruebas.push({
        nombre: "Acceso a localStorage",
        resultado: valor === 'test' ? "ÉXITO" : "FALLO",
        detalles: valor === 'test' ? "Funcionamiento correcto" : "No se pudo acceder a localStorage"
      });
    } catch (error) {
      pruebas.push({
        nombre: "Acceso a localStorage",
        resultado: "ERROR",
        detalles: error.message
      });
    }
    
    // Prueba 2: Verificar carga de tiendas
    try {
      const ultimaTiendaSeleccionada = localStorage.getItem('ultimaTiendaSeleccionada');
      
      pruebas.push({
        nombre: "Memoria de última tienda",
        resultado: ultimaTiendaSeleccionada ? "ÉXITO" : "AVISO",
        detalles: ultimaTiendaSeleccionada 
          ? `Última tienda guardada: ${ultimaTiendaSeleccionada}` 
          : "No hay tienda en memoria. Es normal si es la primera vez que se usa la app."
      });
    } catch (error) {
      pruebas.push({
        nombre: "Memoria de última tienda",
        resultado: "ERROR",
        detalles: error.message
      });
    }
    
    return pruebas;
  };

  // Función para pruebas de rendimiento
  const pruebasRendimiento = async () => {
    const pruebas = [];
    
    // Prueba 1: Medir tiempo de carga de datos
    try {
      const tiempoInicio = performance.now();
      const tiendasRef = collection(db, "tiendas");
      await getDocs(tiendasRef);
      const tiempoFin = performance.now();
      const tiempoTotal = tiempoFin - tiempoInicio;
      
      pruebas.push({
        nombre: "Tiempo de carga de tiendas",
        resultado: tiempoTotal < 2000 ? "ÉXITO" : "AVISO",
        detalles: `Tiempo de carga: ${tiempoTotal.toFixed(2)}ms (${tiempoTotal < 2000 ? "Aceptable" : "Lento"})`
      });
    } catch (error) {
      pruebas.push({
        nombre: "Tiempo de carga de tiendas",
        resultado: "ERROR",
        detalles: error.message
      });
    }
    
    return pruebas;
  };

  // Renderizar resultados
  return (
    <div className="prueba-seguridad-container">
      <h1 className="prueba-seguridad-titulo">Pruebas de Seguridad y Usabilidad</h1>
      
      {error && (
        <div className="prueba-error">
          {error}
        </div>
      )}
      
      {cargando ? (
        <div className="prueba-cargando">
          Ejecutando pruebas...
        </div>
      ) : (
        <div>
          {/* Sección de seguridad */}
          <div className="seccion-pruebas">
            <h2 className="seccion-titulo">Seguridad</h2>
            <table className="tabla-pruebas">
              <thead>
                <tr>
                  <th>Prueba</th>
                  <th>Resultado</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {resultados.seguridad.map((prueba, index) => (
                  <tr key={index}>
                    <td>{prueba.nombre}</td>
                    <td>
                      <div className={
                        prueba.resultado === "ÉXITO" ? "resultado-exito" : 
                        prueba.resultado === "AVISO" ? "resultado-aviso" : 
                        "resultado-fallo"
                      }>
                        {prueba.resultado}
                      </div>
                    </td>
                    <td>{prueba.detalles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Sección de usabilidad */}
          <div className="seccion-pruebas">
            <h2 className="seccion-titulo">Usabilidad</h2>
            <table className="tabla-pruebas">
              <thead>
                <tr>
                  <th>Prueba</th>
                  <th>Resultado</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {resultados.usabilidad.map((prueba, index) => (
                  <tr key={index}>
                    <td>{prueba.nombre}</td>
                    <td>
                      <div className={
                        prueba.resultado === "ÉXITO" ? "resultado-exito" : 
                        prueba.resultado === "AVISO" ? "resultado-aviso" : 
                        "resultado-fallo"
                      }>
                        {prueba.resultado}
                      </div>
                    </td>
                    <td>{prueba.detalles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Sección de rendimiento */}
          <div className="seccion-pruebas">
            <h2 className="seccion-titulo">Rendimiento</h2>
            <table className="tabla-pruebas">
              <thead>
                <tr>
                  <th>Prueba</th>
                  <th>Resultado</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {resultados.rendimiento.map((prueba, index) => (
                  <tr key={index}>
                    <td>{prueba.nombre}</td>
                    <td>
                      <div className={
                        prueba.resultado === "ÉXITO" ? "resultado-exito" : 
                        prueba.resultado === "AVISO" ? "resultado-aviso" : 
                        "resultado-fallo"
                      }>
                        {prueba.resultado}
                      </div>
                    </td>
                    <td>{prueba.detalles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Link to="/seleccionar-tienda" className="boton-volver">
            Volver a Tiendas
          </Link>
        </div>
      )}
    </div>
  );
};

export default PruebaSeguridad;
