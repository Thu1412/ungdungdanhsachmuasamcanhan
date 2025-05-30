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
  add: require('../../images/add.png'),
  checkmarkDone: require('../../images/mark.png'),
  search: require('../../images/loupe.png'),
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
      setTimeout(() => {
        navigation.goBack();
      }, 100);

    } catch (error) {
      console.error('Complete list error:', error);
      Alert.alert('Lỗi', 'Không thể hoàn thành danh sách. Vui lòng thử lại sau.');
    }
  };

  const renderItem = ({ item }) => {
    const swipeAnim = new Animated.Value(0);

    return (
      <Animated.View
        style={[
          styles.item,
          {
            transform: [{
              translateX: swipeAnim
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => togglePurchased(item.id, item.purchased)}
        >
          <Image
            source={item.purchased ? icons.checkmarkCircle : icons.ellipseOutline}
            style={[styles.checkbox]}
          />
          <View style={styles.itemDetails}>
            <Text style={[
              styles.itemText,
              item.purchased && styles.purchasedItem
            ]}>
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
        <Text style={styles.title}>DANH SÁCH MÓN HÀNG</Text>
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
            Đã mua: {purchasedCost.toLocaleString()}đ
          </Text>
          <Text style={styles.totalText}>
            Tổng cộng: {totalCost.toLocaleString()}đ
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
         
            <Text style={styles.buttonText}>Hoàn thành</Text>
          </View>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    alignItems: 'center',
    textShadowColor: '#333',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  activeFilter: {
    backgroundColor: '#28a745',
  },
  filterText: {
    color: '#000',
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
  },
  purchasedItem: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  itemSubtext: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#888',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
});
