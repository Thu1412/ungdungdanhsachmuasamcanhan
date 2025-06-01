import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Alert, TextInput } from 'react-native';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import SearchIcon from '../../images/loupe.png';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Modal sửa tên danh sách
  const [editingList, setEditingList] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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
    setEditingList(item);
    setEditedName(item.name);
  };




  const saveEditedList = async () => {
    if (!editedName.trim()) {
      Alert.alert('Lỗi', 'Tên danh sách không được để trống');
      return;
    }

    try {
      setIsUpdating(true);
      const docRef = doc(db, 'users', user.email, 'lists', editingList.id);
      await updateDoc(docRef, { name: editedName.trim() });

      setEditingList(null);
      setEditedName('');
    } catch (error) {
      Alert.alert('Lỗi khi cập nhật', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteList = async (item) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa danh sách "${item.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.email, 'lists', item.id));
            } catch (error) {
              Alert.alert('Lỗi khi xóa', error.message);
            }
          }
        }
      ]
    );
  };

  const filteredLists = lists.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <Text style={styles.emailText}>Xin chào: {user.email}</Text>

      <View style={styles.searchContainer}> 
      <Image source={SearchIcon} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm danh sách..."
        placeholderTextColor="#333"
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />  
      </View>

      <FlatList
        data={filteredLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleListPress(item)}
            onLongPress={() => handleEditList(item)}
            style={styles.listItem}
          >
            <View style={styles.listItemContent}>
              <Image source={icons.shoppingCart} style={styles.itemIcon} />
              <Text style={styles.itemText}>{item.name}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => handleEditList(item)} style={styles.actionButton}>
                <Image source={icons.edit} style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteList(item)} style={styles.actionButton}>
                <Image source={icons.delete} style={styles.actionIcon} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy danh sách phù hợp</Text>}
      />

      <TouchableOpacity onPress={() => navigation.navigate('AddList')} style={styles.addButton}>
        <Image source={icons.add} style={styles.addIcon} />
      </TouchableOpacity>

      {/* Modal chỉnh sửa */}
      {editingList && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sửa tên danh sách</Text>
            <TextInput
              style={styles.modalInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Nhập tên mới"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={saveEditedList} disabled={isUpdating}>
                <Text style={styles.modalButtonText}>{isUpdating ? 'Đang lưu...' : 'Lưu'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setEditingList(null)}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#CCCCCC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'red',
    textAlign: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#333',
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
   searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 15,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
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
  },
  emailText: {
  fontSize: 15,
  color: '#333',
  textAlign: 'center',
  marginBottom: 10,
},
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
