import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebaseConfig";
import Login from "./components/Login";
import SeleccionarTienda from "./components/SeleccionarTienda";
import Categorias from "./components/Categorias";
import AgregarProductos from "./components/AgregarProductos";
import ComparadorPrecios from "./components/ComparadorPrecios";
import MigracionDatos from './components/MigracionDatos';
import ResumenGastos from './components/ResumenGastos';
import Soporte from './components/Soporte';
import Asistencia from './components/Asistencia';
import PruebaSeguridad from './tests/PruebaSeguridad';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargando(false);
    });
  
    return () => unsubscribe();
  }, []);
  
  if (cargando) return <p>Cargando...</p>;

  return (
    <Router basename="/Mercado">
      <Routes>
        <Route path="/" element={usuario ? <Navigate to="/seleccionar-tienda" /> : <Login />} />
        <Route path="/seleccionar-tienda" element={usuario ? <SeleccionarTienda /> : <Navigate to="/" />} />
        <Route path="/categorias" element={usuario ? <Categorias /> : <Navigate to="/" />} />
        <Route path="/agregar-producto" element={usuario ? <AgregarProductos /> : <Navigate to="/" />} />
        <Route path="/comparar-precios" element={usuario ? <ComparadorPrecios /> : <Navigate to="/" />} />
        <Route path="/migracion" element={<MigracionDatos />} />
        <Route path="/resumen-gastos" element={usuario ? <ResumenGastos /> : <Navigate to="/" />} />
        <Route path="/soporte" element={usuario ? <Soporte /> : <Navigate to="/" />} />
        <Route path="/asistencia" element={usuario ? <Asistencia /> : <Navigate to="/" />} />
        <Route path="/prueba-seguridad" element={<PruebaSeguridad />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
