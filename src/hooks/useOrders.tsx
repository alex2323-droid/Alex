import { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './useAuth';
import { Timestamp } from 'firebase/firestore';

export interface Order {
  id: string;
  name: string;
  price: number;
  clientId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: any;
  createdAt: any;
  userId: string;
}

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      ordersData.sort((a, b) => {
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
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return unsubscribe;
  }, [user]);

  const addOrder = async (name: string, price: number, clientId: string, dueDate?: Date) => {
    if (!user) throw new Error('No estás autenticado');
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        name: name.trim(),
        price,
        clientId,
        status: 'pending',
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        createdAt: Timestamp.now(),
        userId: user.uid
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      throw error;
    }
  };

  const editOrder = async (id: string, name: string, price: number, clientId: string, status: Order['status'], dueDate?: Date) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        name: name.trim(),
        price,
        clientId,
        status,
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
      throw error;
    }
  };

  const removeOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
      throw error;
    }
  };

  return { orders, loading, addOrder, editOrder, removeOrder };
}
