import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "./SeleccionarTienda.css";
import "./styles/nav-buttons.css";
import "./styles/store-section.css";
import BotonCerrarSesion from "./BotonCerrarSesion";
import { collection, doc, updateDoc, getDoc, getDocs, addDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { auth } from "../config/firebaseConfig";
import { signOut, setPersistence, browserLocalPersistence } from "firebase/auth";

function SeleccionarTienda() {
  const [tiendas, setTiendas] = useState([]);
  const [nuevaTienda, setNuevaTienda] = useState("");
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", marca: "", precio: "", unidad: "", categoria: "" });
  const [categorias, setCategorias] = useState([]);
  const [productoEditando, setProductoEditando] = useState(null);
  const [productosEliminados, setProductosEliminados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [categoriasUnicas, setCategoriasUnicas] = useState([]);
  const [filtros, setFiltros] = useState({
    nombre: '',
    marca: '',
    precio: '',
    categoria: ''
  });

  // Esta parte es opcional: detectar cierre de ventana
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // Guardar timestamp para saber cuándo el usuario dejó la página
      localStorage.setItem('lastActivity', Date.now());
    } else if (document.visibilityState === 'visible') {
      const lastActivity = localStorage.getItem('lastActivity');
      // Si han pasado más de 5 segundos, consideramos que cerró la ventana
      if (lastActivity && (Date.now() - parseInt(lastActivity)) > 5000) {
        signOut(auth);
      }
    }
  };

  // Función para obtener tiendas
  const obtenerTiendas = async () => {
    try {
      // Obtener productos eliminados del localStorage con manejo de errores
      let productosEliminadosGuardados = [];
      try {
        const savedData = localStorage.getItem('productosEliminados');
        if (savedData) {
          productosEliminadosGuardados = JSON.parse(savedData);
          if (!Array.isArray(productosEliminadosGuardados)) {
            console.warn('Los productos eliminados no son un array, reiniciando');
            productosEliminadosGuardados = [];
          }
        }
      } catch (e) {
        console.error('Error al recuperar productos eliminados:', e);
        productosEliminadosGuardados = [];
      }
      
      console.log('Productos eliminados recuperados de localStorage (cantidad):', productosEliminadosGuardados.length);
      if (productosEliminadosGuardados.length > 0) {
        console.log('Primer producto eliminado:', productosEliminadosGuardados[0]);
      }
      
      // Actualizar el estado local con los productos eliminados
      setProductosEliminados(productosEliminadosGuardados);
      
      // Obtener tiendas de Firebase
      const querySnapshot = await getDocs(collection(db, "tiendas"));
      const tiendasCargadas = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        productos: doc.data().productos || []
      }));

      // Filtrar los productos eliminados de las tiendas
      const tiendasFiltradas = tiendasCargadas.map(tienda => ({
        ...tienda,
        productos: tienda.productos.filter(producto => 
          !productosEliminadosGuardados.some(eliminado => 
            eliminado.nombre === producto.nombre && eliminado.marca === producto.marca
          )
        ),
      }));

      console.log('Tiendas cargadas después de filtrar productos desactivados:', tiendasFiltradas);
      setTiendas(tiendasFiltradas);
    } catch (error) {
      console.error("Error al obtener tiendas:", error);
    } finally {
      setCargando(false);
    }
  };

  // Cargar tiendas al inicio
  useEffect(() => {
    // Obtener tiendas y productos eliminados
    obtenerTiendas();
    
    // Detectar cambios de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Actualizar categorías únicas cuando cambia la tienda seleccionada
  useEffect(() => {
    if (tiendaSeleccionada && tiendaSeleccionada.productos) {
      const categorias = new Set(tiendaSeleccionada.productos.map(p => p.categoria));
      setCategoriasUnicas(['Todas', ...Array.from(categorias)]);
    }
  }, [tiendaSeleccionada]);

  // Recarga productos desactivados cuando se activa la vista
  useEffect(() => {
    const handleStorageChange = () => {
      const productosGuardados = JSON.parse(localStorage.getItem('productosEliminados')) || [];
      setProductosEliminados(productosGuardados);
    };
    
    // Escuchar cambios en el localStorage
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const agregarTienda = async () => {
    if (nuevaTienda.trim() === "") return;

    try {
      const tiendasRef = collection(db, "tiendas");
      const docRef = await addDoc(tiendasRef, { nombre: nuevaTienda, productos: [] });
      setTiendas([...tiendas, { id: docRef.id, nombre: nuevaTienda, productos: [] }]);
      setNuevaTienda("");
    } catch (error) {
      console.error("Error al agregar la tienda:", error);
    }
  };

  const agregarProducto = async () => {
    if (!tiendaSeleccionada || !nuevoProducto.nombre.trim()) return;
  
    try {
      const tiendaRef = doc(db, "tiendas", tiendaSeleccionada.id);
      
      if (productoEditando !== null) {
        // Si estamos editando, reemplazamos el producto en su posición original
        const nuevaListaProductos = tiendaSeleccionada.productos.map((producto, index) => 
          index === productoEditando.index ? { 
            ...nuevoProducto,
            fechaCompra: producto.fechaCompra || new Date().toISOString()
          } : producto
        );
        
        // Actualizar en Firebase
        await updateDoc(tiendaRef, { 
          productos: nuevaListaProductos 
        });

        // Actualizar el estado local
        setTiendaSeleccionada({
          ...tiendaSeleccionada,
          productos: nuevaListaProductos
        });

        // Limpiar el formulario
        setNuevoProducto({ 
          nombre: "", 
          marca: "", 
          precio: "", 
          unidad: "", 
          categoria: "" 
        });
        setProductoEditando(null);

      } else {
        // Si es un nuevo producto, lo agregamos al final de la lista con fecha actual
        const nuevaListaProductos = [...tiendaSeleccionada.productos, { 
          ...nuevoProducto,
          fechaCompra: new Date().toISOString()
        }];

        // Actualizar en Firebase
        await updateDoc(tiendaRef, { 
          productos: nuevaListaProductos 
        });

        // Actualizar el estado local
        setTiendaSeleccionada({
          ...tiendaSeleccionada,
          productos: nuevaListaProductos
        });

        // Limpiar el formulario
        setNuevoProducto({ 
          nombre: "", 
          marca: "", 
          precio: "", 
          unidad: "", 
          categoria: "" 
        });
      }
    } catch (error) {
      console.error("Error al gestionar el producto:", error);
    }
  };  

  const eliminarProducto = async (index) => {
    if (!tiendaSeleccionada) return;

    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        // 1. Obtener el producto que se va a eliminar
        const productoAEliminar = tiendaSeleccionada.productos[index];
        const fechaActual = new Date();

        // 2. Crear el producto desactivado
        const productoDesactivado = {
          nombre: productoAEliminar.nombre,
          marca: productoAEliminar.marca,
          precio: productoAEliminar.precio,
          unidad: productoAEliminar.unidad,
          categoria: productoAEliminar.categoria,
          tiendaId: tiendaSeleccionada.id,
          tiendaNombre: tiendaSeleccionada.nombre,
          fechaDesactivacion: fechaActual.toISOString()
        };

        // 3. Guardar en Firebase
        const desactivadosRef = collection(db, "desactivados");
        await addDoc(desactivadosRef, productoDesactivado);

        // 4. Actualizar la lista de productos activos en Firebase
        const nuevaListaProductos = tiendaSeleccionada.productos.filter((_, i) => i !== index);
        const tiendaRef = doc(db, "tiendas", tiendaSeleccionada.id);
        await updateDoc(tiendaRef, { productos: nuevaListaProductos });

        // 5. Actualizar estados locales
        const nuevosProductosEliminados = [...productosEliminados, productoDesactivado];
        setProductosEliminados(nuevosProductosEliminados);

        // 6. Actualizar tienda seleccionada
        const tiendaActualizada = {
          ...tiendaSeleccionada,
          productos: nuevaListaProductos
        };
        setTiendaSeleccionada(tiendaActualizada);

        // 7. Actualizar lista de tiendas
        setTiendas(prev => prev.map(t => 
          t.id === tiendaSeleccionada.id ? tiendaActualizada : t
        ));

        // 8. Actualizar categorías
        const nuevasCategorias = new Set(nuevaListaProductos.map(p => p.categoria));
        setCategorias(Array.from(nuevasCategorias));

        // 9. Mostrar mensaje de éxito
        alert('Producto eliminado correctamente y guardado en productos desactivados');

      } catch (error) {
        console.error('Error detallado:', error);
        console.error('Mensaje de error:', error.message);
        alert('Error al eliminar el producto. Por favor, intenta nuevamente.');
      }
    }
  };

  // Cargar tiendas y productos desactivados al inicio
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Obtener productos desactivados de Firebase
        const productosDesactivados = await cargarProductosDesactivados();
        console.log('Productos desactivados cargados de Firebase:', productosDesactivados);
        setProductosEliminados(productosDesactivados);
        
        // 2. Obtener tiendas
        await obtenerTiendas();
        setCargando(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const cargarProductosDesactivados = async () => {
    try {
      const desactivadosRef = collection(db, "desactivados");
      const querySnapshot = await getDocs(desactivadosRef);
      
      console.log("Colección desactivados existe:", !querySnapshot.empty);
      console.log("Número de documentos en desactivados:", querySnapshot.size);
      
      const productosDesactivados = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Productos desactivados encontrados:", productosDesactivados);
      return productosDesactivados;
    } catch (error) {
      console.error("Error al cargar productos desactivados:", error);
      return [];
    }
  };

  // Función para limpiar productos desactivados
  const limpiarProductosDesactivados = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar la lista de productos desactivados?')) {
      localStorage.setItem('productosEliminados', '[]');
      setProductosEliminados([]);
    }
  };

  const seleccionarTienda = async (tienda) => {
    try {
      const tiendaRef = doc(db, "tiendas", tienda.id);
      const tiendaSnapshot = await getDoc(tiendaRef);
      
      if (!tiendaSnapshot.exists()) {
        console.error("La tienda seleccionada no existe en Firebase.");
        return;
      }

      const tiendaActualizada = tiendaSnapshot.data();
      const productosActualizados = Array.isArray(tiendaActualizada.productos) ? tiendaActualizada.productos : [];

      console.log("Tienda seleccionada desde Firebase:", tiendaActualizada);

      const tiendaConProductos = {
        id: tienda.id,
        ...tiendaActualizada,
        productos: productosActualizados
      };

      setTiendaSeleccionada(tiendaConProductos);
      
      // Actualizar la tienda en la lista local
      setTiendas(prev => prev.map(t => 
        t.id === tienda.id ? tiendaConProductos : t
      ));

    } catch (error) {
      console.error("Error al obtener la tienda seleccionada:", error);
    }
  };

  const verHistorialProductos = async () => {
    try {
      const historialRef = doc(db, "productos", tiendaSeleccionada.id);
      const historialDoc = await getDoc(historialRef);
      
      if (historialDoc.exists()) {
        const historial = historialDoc.data().historialProductos;
        console.log("Historial de productos:", historial);
        return historial;
      }
      
      return [];
    } catch (error) {
      console.error("Error al obtener el historial:", error);
      return [];
    }
  };

  const filtrarProductos = (productos) => {
    if (!productos) return [];

    // Primero filtramos los productos eliminados
    const productosActivos = productos.filter(producto => 
      !productosEliminados.some(eliminado => 
        eliminado.nombre === producto.nombre && 
        eliminado.marca === producto.marca
      )
    );

    // Luego aplicamos los filtros de búsqueda
    return productosActivos.filter(producto => 
      producto.nombre.toLowerCase().includes(filtros.nombre.toLowerCase()) &&
      producto.marca.toLowerCase().includes(filtros.marca.toLowerCase()) &&
      (!filtros.precio || producto.precio.toString().includes(filtros.precio)) &&
      (!filtros.categoria || producto.categoria === filtros.categoria)
    );
  };

  useEffect(() => {
    // Configurar persistencia local (mantiene sesión entre recargas)
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Persistencia local configurada");
      })
      .catch((error) => {
        console.error("Error al configurar persistencia:", error);
      });

    // Esta parte es opcional: detectar cierre de ventana
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Guardar timestamp para saber cuándo el usuario dejó la página
        localStorage.setItem('lastActivity', Date.now());
      } else if (document.visibilityState === 'visible') {
        const lastActivity = localStorage.getItem('lastActivity');
        // Si han pasado más de 5 segundos, consideramos que cerró la ventana
        if (lastActivity && (Date.now() - parseInt(lastActivity)) > 5000) {
          signOut(auth);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    obtenerTiendas();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Actualizar categorías únicas cuando cambia la tienda seleccionada
  useEffect(() => {
    if (tiendaSeleccionada && tiendaSeleccionada.productos) {
      const categorias = new Set(tiendaSeleccionada.productos.map(p => p.categoria));
      setCategoriasUnicas(['Todas', ...Array.from(categorias)]);
    }
  }, [tiendaSeleccionada]);

  const recargarProductosDesactivados = async () => {
    try {
      const productosDesactivados = await cargarProductosDesactivados();
      setProductosEliminados(productosDesactivados);
      alert(`Lista recargada: ${productosDesactivados.length} productos desactivados`);
    } catch (error) {
      console.error('Error al recargar productos desactivados:', error);
      alert('Error al recargar la lista. Por favor, intenta nuevamente.');
    }
  };

  const editarProducto = async (index) => {
    if (!tiendaSeleccionada) return;

    try {
      const productoAEeditar = tiendaSeleccionada.productos[index];
      setProductoEditando({
        index,
        ...productoAEeditar
      });
    } catch (error) {
      console.error('Error al editar el producto:', error);
      alert('Error al editar el producto. Por favor, intenta nuevamente.');
    }
  };

  const guardarEdicion = async () => {
    if (!tiendaSeleccionada || !productoEditando) return;

    try {
      const nuevosProductos = [...tiendaSeleccionada.productos];
      nuevosProductos[productoEditando.index] = productoEditando;

      const tiendaRef = doc(db, "tiendas", tiendaSeleccionada.id);
      await updateDoc(tiendaRef, { productos: nuevosProductos });

      setTiendaSeleccionada({
        ...tiendaSeleccionada,
        productos: nuevosProductos
      });

      setProductoEditando(null);
      alert('Producto editado correctamente');

      // Actualizar categorías
      const nuevasCategorias = new Set(nuevosProductos.map(p => p.categoria));
      setCategorias(Array.from(nuevasCategorias));

    } catch (error) {
      console.error('Error al guardar la edición:', error);
      alert('Error al guardar la edición. Por favor, intenta nuevamente.');
    }
  };

  const cancelarEdicion = () => {
    setProductoEditando(null);
  };

  if (cargando) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      {tiendaSeleccionada ? (
        <div>
          <h2>{tiendaSeleccionada.nombre}</h2>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '10px',
            width: '100%'
          }}>
            <Link to="/comparar-precios" style={{ textDecoration: 'none' }}>
              <button 
                style={{ 
                  backgroundColor: 'red', 
                  color: 'white', 
                  padding: '12px 20px', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                COMPARAR PRECIOS POR MES
              </button>
            </Link>
            
            <Link to="/resumen-gastos" style={{ textDecoration: 'none' }}>
              <button 
                style={{ 
                  backgroundColor: '#3498db', 
                  color: 'white', 
                  padding: '12px 20px', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                RESUMEN DE GASTOS MENSUALES
              </button>
            </Link>
          </div>

          <div className="filtros">
            <input
              type="text"
              placeholder="Filtrar por nombre"
              value={filtros.nombre}
              onChange={(e) => setFiltros(prev => ({ ...prev, nombre: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Filtrar por marca"
              value={filtros.marca}
              onChange={(e) => setFiltros(prev => ({ ...prev, marca: e.target.value }))}
            />
            <input
              type="number"
              placeholder="Filtrar por precio máximo"
              value={filtros.precio}
              onChange={(e) => setFiltros(prev => ({ ...prev, precio: e.target.value }))}
            />
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
            >
              {categoriasUnicas.map((categoria, index) => (
                <option key={index} value={categoria === 'Todas' ? '' : categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input type="text" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} placeholder="Nombre del producto" />
            <input type="text" value={nuevoProducto.marca} onChange={(e) => setNuevoProducto({ ...nuevoProducto, marca: e.target.value })} placeholder="Marca" />
            <input type="number" value={nuevoProducto.precio} onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })} placeholder="Precio" />
            <input type="text" value={nuevoProducto.unidad} onChange={(e) => setNuevoProducto({ ...nuevoProducto, unidad: e.target.value })} placeholder="Unidad de medida" />
            <input type="text" value={nuevoProducto.categoria} onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })} placeholder="Categoría" />
            <button onClick={agregarProducto}>{productoEditando !== null ? "Actualizar Producto" : "Agregar Producto"}</button>
          </div>

          <h3>Filtrar por Categoría</h3>
          <select onChange={(e) => setCategoriaSeleccionada(e.target.value)}>
            {categorias.map((categoria, index) => (
              <option key={index} value={categoria}>{categoria}</option>
            ))}
          </select>

          <h3>Lista de Productos</h3>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Precio</th>
                <th>Unidad</th>
                <th>Categoría</th>
                <th>Fecha de Compra</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrarProductos(tiendaSeleccionada.productos).map((producto, index) => (
                <tr key={index}>
                  <td>{producto.nombre}</td>
                  <td>{producto.marca}</td>
                  <td>{producto.precio}</td>
                  <td>{producto.unidad}</td>
                  <td>{producto.categoria}</td>
                  <td>{producto.fechaCompra ? new Date(producto.fechaCompra).toLocaleDateString() : 'No disponible'}</td>
                  <td>
                    <button onClick={() => editarProducto(index)}>Editar</button>
                    <button onClick={() => eliminarProducto(index)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="tabla-productos-desactivados" style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Productos Desactivados</h3>
              <div>
                <button onClick={limpiarProductosDesactivados} style={{ marginRight: '10px' }}>Limpiar Lista</button>
              </div>
            </div>
            
            <div style={{ marginTop: '10px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Marca</th>
                    <th>Precio</th>
                    <th>Unidad</th>
                    <th>Categoría</th>
                    <th>Fecha Desactivación</th>
                  </tr>
                </thead>
                <tbody>
                  {productosEliminados.map((producto, index) => (
                    <tr key={producto.id || index}>
                      <td>{producto.nombre}</td>
                      <td>{producto.marca}</td>
                      <td>{producto.precio}</td>
                      <td>{producto.unidad}</td>
                      <td>{producto.categoria}</td>
                      <td>{
                        (() => {
                          try {
                            return new Date(producto.fechaDesactivacion).toLocaleDateString();
                          } catch (e) {
                            return 'Fecha no disponible';
                          }
                        })()
                      }</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2>Selecciona o Agrega una Tienda</h2>
          <div className="agregar-tienda">
            <input
              type="text"
              value={nuevaTienda}
              onChange={(e) => setNuevaTienda(e.target.value)}
              placeholder="Nombre de la nueva tienda"
            />
            <button onClick={agregarTienda}>Agregar Tienda</button>
          </div>
          {tiendas.length > 0 ? (
            <ul className="lista-tiendas">
              {tiendas.map((tienda) => (
                <li key={tienda.id}>
                  <button onClick={() => seleccionarTienda(tienda)}>
                    {tienda.nombre}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay tiendas disponibles. Agrega una nueva tienda.</p>
          )}
        </div>
      )}
      <BotonCerrarSesion className="logout-button" />
    </div>
  );
}

export default SeleccionarTienda;
