import { db } from "../config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const categoriasRef = collection(db, "categorias");

export const agregarCategoria = async (nombreCategoria) => {
  const docRef = await addDoc(categoriasRef, { nombre: nombreCategoria });
  return docRef.id;
};

export const obtenerCategorias = async () => {
  const snapshot = await getDocs(categoriasRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
