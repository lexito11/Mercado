import React, { useState } from "react";
import { agregarProducto } from "../services/productosService";
import { auth } from "../config/firebaseConfig";

function AgregarProductos({ tiendaSeleccionada }) {
  const [producto, setProducto] = useState({
    nombre: "",
    marca: "",
    precio: "",
    unidad: "",
    categoria: ""
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto(prev => ({
      ...prev,
      [name]: name === "precio" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!tiendaSeleccionada?.id) {
      setError("Por favor selecciona una tienda primero");
      return;
    }

    if (!producto.nombre.trim()) {
      setError("El nombre del producto es obligatorio");
      return;
    }

    try {
      await agregarProducto(
        {
          nombre: producto.nombre.trim(),
          marca: producto.marca.trim(),
          precio: producto.precio,
          unidad: producto.unidad.trim(),
          categoria: producto.categoria.trim()
        },
        auth.currentUser.uid,
        tiendaSeleccionada.id
      );

      setSuccess(true);
      setProducto({
        nombre: "",
        marca: "",
        precio: "",
        unidad: "",
        categoria: ""
      });

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error al agregar producto:", error);
      setError("Error al agregar el producto. Por favor intenta nuevamente.");
    }
  };

  return (
    <div className="agregar-producto-container">
      <h2>Agregar Nuevo Producto</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">¡Producto agregado con éxito!</div>}

      <form onSubmit={handleSubmit} className="producto-form">
        <div className="form-group">
          <label htmlFor="nombre">Nombre*</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            placeholder="Ej: Arroz"
            value={producto.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="marca">Marca</label>
          <input
            type="text"
            id="marca"
            name="marca"
            placeholder="Ej: Diana"
            value={producto.marca}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="precio">Precio*</label>
          <input
            type="number"
            id="precio"
            name="precio"
            placeholder="Ej: 2500"
            value={producto.precio || ""}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="unidad">Unidad de medida</label>
          <input
            type="text"
            id="unidad"
            name="unidad"
            placeholder="Ej: Libra, Kilo, Litro"
            value={producto.unidad}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="categoria">Categoría</label>
          <input
            type="text"
            id="categoria"
            name="categoria"
            placeholder="Ej: Granos, Lácteos"
            value={producto.categoria}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="submit-btn">
          Agregar Producto
        </button>
      </form>
    </div>
  );
}

export default AgregarProductos;