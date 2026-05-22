import { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './useAuth';
import { Timestamp } from 'firebase/firestore';

export interface Order {
  id: string;
  name: string;
  price: number;
  clientId: string;
  status: 'pending' | 'completed' | 'cancelled';
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
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return unsubscribe;
  }, [user]);

  const addOrder = async (name: string, price: number, clientId: string, dueDate?: Date) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'orders'), {
        name,
        price,
        clientId,
        status: 'pending',
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        createdAt: Timestamp.now(),
        userId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const editOrder = async (id: string, name: string, price: number, clientId: string, status: Order['status'], dueDate?: Date) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        name,
        price,
        clientId,
        status,
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const removeOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
    }
  };

  return { orders, loading, addOrder, editOrder, removeOrder };
}
