import { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType, writeBatch, getDocs } from '../firebase';
import { useAuth } from './useAuth';
import { Timestamp } from 'firebase/firestore';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: any;
  userId: string;
}

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'clients'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];
      
      clientsData.sort((a, b) => {
        const getTime = (val: any) => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          if (val.seconds) return val.seconds * 1000;
          const parsed = new Date(val).getTime();
          return isNaN(parsed) ? 0 : parsed;
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });
      
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    });

    return unsubscribe;
  }, [user]);

  const addClient = async (name: string, phone: string, email?: string) => {
    if (!user) throw new Error('No estás autenticado');
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        createdAt: Timestamp.now(),
        userId: user.uid
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
      throw error;
    }
  };

  const editClient = async (id: string, name: string, phone: string, email?: string) => {
    try {
      await updateDoc(doc(db, 'clients', id), {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
      throw error;
    }
  };

  const removeClient = async (id: string) => {
    if (!user) throw new Error('No estás autenticado');
    try {
      const batch = writeBatch(db);
      
      // 1. Find all orders for this client belonging to this user
      const ordersQuery = query(
        collection(db, 'orders'), 
        where('userId', '==', user.uid),
        where('clientId', '==', id)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // 2. Add order deletions to batch
      ordersSnapshot.docs.forEach((orderDoc) => {
        batch.delete(orderDoc.ref);
      });
      
      // 3. Add client deletion to batch
      batch.delete(doc(db, 'clients', id));
      
      // 4. Commit batch
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
      throw error;
    }
  };

  return { clients, loading, addClient, editClient, removeClient };
}
