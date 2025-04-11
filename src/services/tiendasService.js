import { db } from "../config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const tiendasRef = collection(db, "tiendas");

export const agregarTienda = async (nombreTienda) => {
  const docRef = await addDoc(tiendasRef, { nombre: nombreTienda });
  return docRef.id;
};

export const obtenerTiendas = async () => {
  const snapshot = await getDocs(tiendasRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
