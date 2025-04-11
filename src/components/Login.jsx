import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistrando, setIsRegistrando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistrando) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Cuenta creada exitosamente.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/dashboard"); // Redirige después de iniciar sesión o registrarse
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <h2>{isRegistrando ? "Crear Cuenta" : "Iniciar Sesión"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isRegistrando ? "Registrarse" : "Iniciar Sesión"}</button>
      </form>
      <button onClick={() => setIsRegistrando(!isRegistrando)}>
        {isRegistrando ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
      </button>
    </div>
  );
};

export default Login;
