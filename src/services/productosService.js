import { db } from "../config/firebaseConfig";
import { 
  collection, addDoc, getDocs, updateDoc, doc, deleteDoc, 
  query, where, orderBy 
} from "firebase/firestore";

const productosRef = collection(db, "productos");

// Agrega un producto con la estructura escalable
export const agregarProducto = async (producto, usuarioId, tiendaId) => {
  try {
    const docRef = await addDoc(productosRef, {
      ...producto,
      usuarioId,           // Obligatorio para filtrar por usuario
      tiendaId,            // Relación con la tienda
      fechaCompra: new Date(),  // Clave para comparar meses
      activo: true         // Para "eliminación blanda"
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar producto:", error);
    throw error;
  }
};

// Obtiene todos los productos del usuario (con filtros opcionales)
export const obtenerProductos = async (usuarioId, filtros = {}) => {
  try {
    let q = query(
      productosRef,
      where("usuarioId", "==", usuarioId),
      where("activo", "==", true)  // Solo productos no eliminados
    );

    // Filtros dinámicos
    if (filtros.tiendaId) {
      q = query(q, where("tiendaId", "==", filtros.tiendaId));
    }
    if (filtros.categoriaId) {
      q = query(q, where("categoriaId", "==", filtros.categoriaId));
    }
    if (filtros.mes && filtros.año) {
      const inicio = new Date(filtros.año, filtros.mes, 1);
      const fin = new Date(filtros.año, filtros.mes + 1, 0);
      q = query(q, where("fechaCompra", ">=", inicio), where("fechaCompra", "<=", fin));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
};

// Actualiza un producto (ej: precio, categoría)
export const actualizarProducto = async (id, nuevosDatos) => {
  try {
    const productoDoc = doc(db, "productos", id);
    await updateDoc(productoDoc, {
      ...nuevosDatos,
      fechaModificacion: new Date()  // Para historial de cambios
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    throw error;
  }
};

// Eliminación blanda (marca como "inactivo")
export const eliminarProducto = async (id) => {
  try {
    const productoDoc = doc(db, "productos", id);
    await updateDoc(productoDoc, { activo: false });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    throw error;
  }
};

// Función específica para comparar precios entre meses
export const compararPreciosPorMeses = async (usuarioId, mes1, año1, mes2, año2) => {
  const productosMes1 = await obtenerProductos(usuarioId, { mes: mes1, año: año1 });
  const productosMes2 = await obtenerProductos(usuarioId, { mes: mes2, año: año2 });
  return { productosMes1, productosMes2 };
};