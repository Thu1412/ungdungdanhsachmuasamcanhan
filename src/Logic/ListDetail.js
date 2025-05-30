import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';

// Import ảnh PNG icon
const icons = {
  checkmarkCircle: require('../../images/mark.png'),
  ellipseOutline: require('../../images/circle.png'),
  add: require('../../images/plus.png'),
  checkmarkDone: require('../../images/mark.png'),
  search: require('../../images/loupe.png'),
  // Đã xóa icon 3 chấm
};

export default function ListDetail({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'purchased', 'unpurchased'
  const [totalCost, setTotalCost] = useState(0);
  const [purchasedCost, setPurchasedCost] = useState(0);

  const params = route.params || {};
  const listId = params.listId;
  const listName = params.listName || 'Danh sách mới';

  useEffect(() => {
    if (!user || !listId) {
      navigation.goBack();
      return;
    }

    const itemsRef = collection(db, 'users', user.email, 'lists', listId, 'items' );

    // realtime listener
    const unsubscribe = onSnapshot(itemsRef, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(data);
      updateFilteredItems(data, searchText, filter);
      calculateTotals(data);
      setIsLoading(false);
    }, error => {
      console.error('onSnapshot error:', error);
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu danh sách');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, listId]);

  useEffect(() => {
    updateFilteredItems(items, searchText, filter);
  }, [searchText, filter, items]);

  const updateFilteredItems = (itemsList, search, currentFilter) => {
    let result = itemsList;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(item =>
        item.name && item.name.toLowerCase().includes(lowerSearch)
      );
    }

    if (currentFilter === 'purchased') {
      result = result.filter(item => item.purchased === true);
    } else if (currentFilter === 'unpurchased') {
      result = result.filter(item => item.purchased !== true);
    }

    setFilteredItems(result);
  };

  const calculateTotals = (itemsList) => {
    let total = 0;
    let purchased = 0;

    itemsList.forEach(item => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      const itemTotal = itemPrice * itemQuantity;

      total += itemTotal;

      if (item.purchased) {
        purchased += itemTotal;
      }
    });

    setTotalCost(total);
    setPurchasedCost(purchased);
  };

  const togglePurchased = async (itemId, currentStatus) => {
    try {
      const userDocId = user.email;

      const itemRef = doc(db, 'users', userDocId, 'lists', listId, 'items', itemId);
      await updateDoc(itemRef, {
        purchased: !currentStatus
      });
    } catch (error) {
      console.error('Toggle error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const completeList = async () => {
    if (!listId) {
      Alert.alert('Lỗi', 'Không tìm thấy danh sách');
      return;
    }

    if (isNaN(purchasedCost)) {
      Alert.alert('Lỗi', 'Tổng chi phí không hợp lệ');
      return;
    }

    try {
      const userDocId = user.email;
      const listRef = doc(db, 'users', userDocId, 'lists', listId);

      // Check if document exists first
      const listDoc = await getDoc(listRef);
      if (!listDoc.exists()) {
        Alert.alert('Lỗi', 'Không tìm thấy danh sách');
        return;
      }

      await updateDoc(listRef, {
        completed: true,
        completedAt: new Date().toISOString(),
        totalSpent: purchasedCost || 0
      });

      // Delay 100ms để UI có thời gian ổn định
      Alert.alert('Thành công', 'Đã hoàn thành danh sách', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('HomeScreen'),
        },
      ]);

    } catch (error) {
      console.error('Complete list error:', error);
      Alert.alert('Lỗi', 'Không thể hoàn thành danh sách. Vui lòng thử lại sau.');
    }
  };

  const renderItem = ({ item }) => {
    return (
      <Animated.View style={styles.item}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => togglePurchased(item.id, item.purchased)}
        >
          {/* Đã xóa icon 3 chấm */}

          {/* Checkbox */}
          <Image
            source={item.purchased ? icons.checkmarkCircle : icons.ellipseOutline}
            style={styles.checkbox}
          />

          <View style={styles.itemDetails}>
            <Text style={[styles.itemText, item.purchased && styles.purchasedItem]}>
              {item.name}
            </Text>
            <Text style={styles.itemSubtext}>
              Số lượng: {item.quantity} | Giá: {Number(item.price).toLocaleString()}đ
            </Text>
            <Text style={styles.itemTotal}>
              Tổng: {(Number(item.quantity) * Number(item.price)).toLocaleString()}đ
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.title}>DANH SÁCH CÁC MÓN HÀNG</Text>
        <Text style={styles.title1}>{listName}</Text>
        <View style={styles.searchBar}>
          <Image source={icons.search} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm món hàng..."
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={styles.filterText}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unpurchased' && styles.activeFilter]}
            onPress={() => setFilter('unpurchased')}
          >
            <Text style={styles.filterText}>Chưa mua</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'purchased' && styles.activeFilter]}
            onPress={() => setFilter('purchased')}
          >
            <Text style={styles.filterText}>Đã mua</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có món hàng nào</Text>
        }
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Đã mua: {"\n"}{purchasedCost.toLocaleString()}đ
          </Text>
          
          <Text style={styles.totalText}>
            Tổng cộng:{"\n"}
            {totalCost.toLocaleString()}đ
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddItem', { listId })}
          >
            <Image source={icons.add} style={{ width: 24, height: 24 }} />
            <Text style={styles.buttonText}>Thêm món</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => {
              Alert.alert(
                'Xác nhận',
                'Bạn có chắc muốn hoàn thành danh sách?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Đồng ý', onPress: () => completeList() }
                ]
              );
            }}
          >
            <Image source={icons.checkmarkDone} style={{ width: 24, height: 24 }} />
            <Text style={styles.buttonText}>Hoàn thành</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 12,
    backgroundColor: '#f0f0f0',
  },
  title1: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#555',
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  activeFilter: {
    backgroundColor: '#4caf50',
  },
  filterText: {
    color: '#000',
    fontWeight: '600',
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    fontWeight: '600',
  },
  purchasedItem: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  itemSubtext: {
    color: '#555',
    fontSize: 14,
  },
  itemTotal: {
    marginTop: 4,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '700',
  },
});
