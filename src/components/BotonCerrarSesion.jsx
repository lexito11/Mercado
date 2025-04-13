import { signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import "./BotonCerrarSesion.css";

function BotonCerrarSesion() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <button 
      className="btn-cerrar-sesion" 
      onClick={handleLogout}
    >
      <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
    </button>
  );
}

export default BotonCerrarSesion;
