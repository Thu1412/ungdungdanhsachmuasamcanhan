import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';

export default function History() {
  const { user } = useContext(AuthContext);
  const [completedLists, setCompletedLists] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [expandedListId, setExpandedListId] = useState(null); // ID list đang mở chi tiết
  const [itemsByList, setItemsByList] = useState({}); // lưu danh sách item theo listId
  const [loadingItems, setLoadingItems] = useState(false); // trạng thái load item

  useEffect(() => {
    if (!user) return;

    const listsRef = collection(db, 'users', user.email, 'lists');
    const q = query(listsRef, where('completed', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      setCompletedLists(lists);
      setIsLoadingLists(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleDetail = (listId) => {
    if (expandedListId === listId) {
      // Đóng chi tiết nếu đã mở
      setExpandedListId(null);
    } else {
      // Mở chi tiết, load item nếu chưa load
      setExpandedListId(listId);
      if (!itemsByList[listId]) {
        loadItemsForList(listId);
      }
    }
  };

  const loadItemsForList = (listId) => {
    if (!user) return;
    setLoadingItems(true);

    const itemsRef = collection(db, 'users', user.email, 'lists', listId, 'items');
    const q = query(itemsRef, where('purchased', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItemsByList(prev => ({ ...prev, [listId]: items }));
      setLoadingItems(false);
    });

    // Không cần unsubscribe ở đây vì mình dùng onSnapshot
    // Nếu muốn unsubscribe có thể lưu unsubscribe và gọi khi unmount hoặc đóng detail

    return unsubscribe;
  };

  if (isLoadingLists) {
    return (
      <View style={styles.container}>
        <Text>Đang tải danh sách...</Text>
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
            <View style={styles.listHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listDate}>
                  Hoàn thành: {new Date(item.completedAt).toLocaleDateString('vi-VN')}
                </Text>
                <Text style={styles.listTotal}>
                  Tổng chi phí: {item.totalSpent?.toLocaleString()}đ
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleDetail(item.id)}>
                <Image
                  source={require('../../images/resume-icon.png')}
                  style={styles.detailIcon}
                />
              </TouchableOpacity>
            </View>

            {expandedListId === item.id && (
              <View style={styles.itemList}>
                <Text style={styles.itemListTitle}>Danh sách món đã mua (hoàn thành):</Text>
                {loadingItems && !itemsByList[item.id] ? (
                  <ActivityIndicator size="small" color="#007bff" />
                ) : itemsByList[item.id]?.length > 0 ? (
                  itemsByList[item.id].map((m) => (
                    <Text key={m.id} style={styles.itemText}>• {m.name} - {m.quantity}</Text>
                  ))
                ) : (
                  <Text style={styles.itemText}>Không có món nào đã hoàn thành.</Text>
                )}
              </View>
            )}
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
    backgroundColor: '#CCCCFF',
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
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  detailIcon: {
    width: 28,
    height: 28,
    marginLeft: 10,
    tintColor: '#007bff',
  },
  itemList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 10,
  },
  itemListTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 16,
    color: '#333',
  },
  itemText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
});
