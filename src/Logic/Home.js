import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Alert } from 'react-native';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Import ảnh PNG icon
const icons = {
  shoppingCart: require('../../images/shopping-cart.png'),
  add: require('../../images/add.png'),
  edit: require('../../images/edit.png'),
  delete: require('../../images/delete.png')
};

export default function Home() {
  const { user, loading } = useContext(AuthContext);
  const navigation = useNavigation();
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Đăng Nhập' }],
      });
      return;
    }

    const q = query(collection(db, 'users', user.email, 'lists'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLists(data);
        setIsLoading(false);
      },
      (error) => {
        console.error('Firestore error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, loading, navigation]);

  const handleListPress = (item) => {
    navigation.navigate('ListDetail', { 
      listId: item.id, 
      listName: item.name 
    });
  };

  const handleEditList = (item) => {
    Alert.prompt(
      'Sửa tên danh sách',
      'Nhập tên mới cho danh sách:',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Lưu',
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              try {
                const listRef = doc(db, 'users', user.email, 'lists', item.id);
                await updateDoc(listRef, {
                  name: newName.trim(),
                  updatedAt: new Date().toISOString()
                });
              } catch (error) {
                console.error('Update list error:', error);
                Alert.alert('Lỗi', 'Không thể cập nhật tên danh sách');
              }
            }
          }
        }
      ],
      'plain-text',
      item.name
    );
  };

  const handleDeleteList = (item) => {
    Alert.alert(
      'Xóa danh sách',
      'Bạn có chắc muốn xóa danh sách này?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const listRef = doc(db, 'users', user.email, 'lists', item.id);
              await deleteDoc(listRef);
            } catch (error) {
              console.error('Delete list error:', error);
              Alert.alert('Lỗi', 'Không thể xóa danh sách');
            }
          }
        }
      ]
    );
  };

  const showListOptions = (item) => {
    Alert.alert(
      item.name,
      'Chọn thao tác',
      [
        {
          text: 'Sửa tên',
          onPress: () => handleEditList(item)
        },
        {
          text: 'Xóa',
          onPress: () => handleDeleteList(item),
          style: 'destructive'
        },
        {
          text: 'Hủy',
          style: 'cancel'
        }
      ]
    );
  };

  if (loading || isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DANH SÁCH MUA SẮM</Text>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleListPress(item)}
            onLongPress={() => showListOptions(item)}
            style={styles.listItem}
          >
            <View style={styles.listItemContent}>
              <Image
                source={icons.shoppingCart}
                style={styles.itemIcon}
              />
              <Text style={styles.itemText}>{item.name}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleEditList(item)}
                style={styles.actionButton}
              >
                <Image source={icons.edit} style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteList(item)}
                style={styles.actionButton}
              >
                <Image source={icons.delete} style={styles.actionIcon} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có danh sách mua sắm nào</Text>
        }
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('AddList')}
        style={styles.addButton}
      >
        <Image
          source={icons.add}
          style={styles.addIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    
    justifyContent: 'space-between',
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    
    flex: 1,
  },
  itemIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  itemText: {
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionIcon: {
    width: 20,
    height: 20,
    tintColor: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#1E90FF',
    borderRadius: 30,
    padding: 16,
    elevation: 5,
  },
  addIcon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
  },
});
