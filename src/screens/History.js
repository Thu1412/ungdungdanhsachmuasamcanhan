import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';

export default function History() {
  const { user } = useContext(AuthContext);
  const [completedLists, setCompletedLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const listsRef = collection(db, 'users', user.email, 'lists');
    const q = query(
      listsRef,
      where('completed', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); // Sort in memory instead
      
      setCompletedLists(lists);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LỊCH SỬ MUA SẮM</Text>
      <FlatList
        data={completedLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listName}>{item.name}</Text>
            <Text style={styles.listDate}>
              Hoàn thành: {new Date(item.completedAt).toLocaleDateString('vi-VN')}
            </Text>
            <Text style={styles.listTotal}>
              Tổng chi phí: {item.totalSpent?.toLocaleString()}đ
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Chưa có danh sách mua sắm nào hoàn thành
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#CCCCFF'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  listItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listDate: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  listTotal: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  }
}); 