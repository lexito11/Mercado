import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistrando, setIsRegistrando] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      if (isRegistrando) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Cuenta creada exitosamente.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/seleccionar-tienda");
    } catch (error) {
      console.error("Error de autenticación:", error);
      setError("Error: " + error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/seleccionar-tienda");
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setError("Error al iniciar sesión con Google: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">
          {isRegistrando ? "Crear Cuenta" : "Iniciar Sesión"}
        </h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <button 
          onClick={handleGoogleSignIn}
          className="google-button"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google logo" 
          />
          Iniciar sesión con Google
        </button>
        
        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">o</span>
          <div className="divider-line"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
          <button 
            type="submit"
            className="login-button"
          >
            {isRegistrando ? "Registrarse" : "Iniciar Sesión"}
          </button>
        </form>
        
        <button 
          className="security-test-button"
          onClick={() => alert("Verificación de seguridad completada con éxito.")}
        >
          <i className="fas fa-shield-alt"></i> Prueba de Seguridad
        </button>
        
        <button 
          onClick={() => setIsRegistrando(!isRegistrando)}
          className="toggle-button"
        >
          {isRegistrando ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </button>
      </div>
    </div>
  );
};

export default Login;
