import { signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig";

function BotonCerrarSesion() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return <button onClick={handleLogout}>Cerrar Sesión</button>;
}

export default BotonCerrarSesion;
