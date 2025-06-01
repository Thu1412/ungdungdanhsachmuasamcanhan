import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Text,
} from 'react-native';
import { InteractionManager } from 'react-native';
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';

export default function AddList({ navigation }) {
  const [listName, setListName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      // Lấy danh sách các món đã mua từ collection purchase_history
      const historyRef = collection(db, 'users', user.email, 'purchase_history');
      const q = query(historyRef, orderBy('frequency', 'desc'), limit(5));
      const snapshot = await getDocs(q);

      const suggestedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSuggestions(suggestedItems);
    } catch (error) {
      console.error('Load suggestions error:', error);
    }
  };

  const handleCreateList = async () => {
  if (!listName.trim()) {
    Alert.alert('Lỗi', 'Vui lòng nhập tên danh sách');
    return;
  }

  try {
    const listsRef = collection(db, 'users', user.email, 'lists');
    const newListDoc = doc(listsRef, listName.trim());

    await setDoc(newListDoc, {
      name: listName.trim(),
      createdAt: new Date().toISOString(),
      items: [],
      completed: false,
      totalSpent: 0
    });

    Alert.alert('Thành công', 'Đã tạo danh sách mới');
    navigation.navigate('HomeScreen');
    // Có thể chuyển hướng đến màn hình danh sách tại đây nếu muốn
    // navigation.navigate('ListOverview');

  } catch (error) {
    console.error('Create list error:', error);
    Alert.alert('Lỗi', 'Không thể tạo danh sách. Vui lòng thử lại.');
  }
};


  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => navigation.navigate('AddItem', { 
        listId: item.listId,
        suggestedItem: {
          name: item.name,
          price: item.lastPrice,
          quantity: 1
        }
      })}
    >
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDetails}>
        Đã mua {item.frequency} lần - Giá gần nhất: {item.lastPrice.toLocaleString()}đ
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>THÊM DANH SÁCH MỚI</Text>
      <TextInput
        style={styles.input}
        placeholder="Tên danh sách"
        value={listName}
        onChangeText={setListName}
      />
      <Button title="Tạo danh sách" onPress={handleCreateList} />

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Gợi ý món thường mua:</Text>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={item => item.id}
            style={styles.suggestionsList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  suggestionsContainer: {
    marginTop: 24,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  suggestionsList: {
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  suggestionItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
