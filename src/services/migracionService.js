import { db, auth } from '../config/firebaseConfig';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';

export const migrarDatos = async () => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const usuarioId = auth.currentUser.uid;
  const tiendasSnapshot = await getDocs(collection(db, 'tiendas'));
  let productosMigrados = 0;

  for (const tiendaDoc of tiendasSnapshot.docs) {
    const productos = tiendaDoc.data().productos || [];
    
    for (const producto of productos) {
      // Verificar si el producto ya existe
      const q = query(
        collection(db, 'productos'),
        where('nombre', '==', producto.nombre),
        where('tiendaId', '==', tiendaDoc.id),
        where('usuarioId', '==', usuarioId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'productos'), {
          ...producto,
          tiendaId: tiendaDoc.id,
          usuarioId,
          fechaCompra: producto.fechaCompra || new Date(),
          activo: true
        });
        productosMigrados++;
      }
    }
  }

  return productosMigrados;
};