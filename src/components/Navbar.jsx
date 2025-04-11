// src/components/Navbar.jsx
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-xl font-bold">
          WIDENYU
        </Link>
        
        <div className="flex items-center gap-4">
          {/* Botón de Asistencia */}
          <Link
            href="/asistencia"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" // Mismo estilo que "Cerrar Sesión"
          >
            Asistencia
          </Link>

          {/* Botón de Cerrar Sesión (si está en el Navbar) */}
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;