import { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType, writeBatch, getDocs } from '../firebase';
import { useAuth } from './useAuth';
import { Timestamp } from 'firebase/firestore';

export interface Client {
  id: string;
  name: string;
  phone: string;
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
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    });

    return unsubscribe;
  }, [user]);

  const addClient = async (name: string, phone: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'clients'), {
        name,
        phone,
        createdAt: Timestamp.now(),
        userId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  };

  const editClient = async (id: string, name: string, phone: string) => {
    try {
      await updateDoc(doc(db, 'clients', id), {
        name,
        phone
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const removeClient = async (id: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // 1. Find all orders for this client
      const ordersQuery = query(collection(db, 'orders'), where('clientId', '==', id));
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
    }
  };

  return { clients, loading, addClient, editClient, removeClient };
}
