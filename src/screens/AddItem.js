import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
  getDocs,
  increment,
} from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import ListDetail from '../Logic/ListDetail';

const addIcon = require('../../images/add.png');

export default function AddItem({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const { listId, suggestedItem } = route.params || {};

  const [itemName, setItemName] = useState(suggestedItem?.name || '');
  const [quantity, setQuantity] = useState(suggestedItem?.quantity?.toString() || '');
  const [price, setPrice] = useState(suggestedItem?.price?.toString() || '');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (suggestedItem) {
      setItemName(suggestedItem.name);
      setQuantity(suggestedItem.quantity.toString());
      setPrice(suggestedItem.price.toString());
    }
  }, [suggestedItem]);

  const updatePurchaseHistory = async (itemData) => {
    if (!user?.email) return;
    try {
      const historyRef = collection(db, 'users', user.email, 'purchase_history');
      const q = query(historyRef, where('name', '==', itemData.name));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(historyRef, {
          name: itemData.name,
          frequency: 1,
          lastPrice: parseFloat(itemData.price),
          lastPurchased: new Date().toISOString(),
        });
      } else {
        const historyDoc = snapshot.docs[0];
        await updateDoc(historyDoc.ref, {
          frequency: increment(1),
          lastPrice: parseFloat(itemData.price),
          lastPurchased: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Update purchase history error:', error);
    }
  };

  const handleAddItem = async () => {
    if (!itemName.trim() || !quantity.trim() || !price.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (!listId) {
      Alert.alert('Lỗi', 'Danh sách không hợp lệ');
      return;
    }

    try {
      
      const itemData = {
        id: uuidv4(),
        name: itemName.trim(),
        quantity: parseInt(quantity),
        price: parseFloat(price),
        note: note.trim(),
        completed: false,
        addedAt: new Date().toISOString(),
      };

      // Thêm item vào collection con "items" bên trong document list
      const itemRef = doc(db, 'users', user.email, 'lists', listId, 'items', itemData.id);
      await setDoc(itemRef, itemData);

      await updatePurchaseHistory(itemData);

      Alert.alert('Thành công', 'Đã thêm món vào danh sách', [
  {
    text: 'OK',
    onPress: () => navigation.navigate('ListDetail', { listId }),
  },
]);
    } catch (error) {
      console.error('Add item error:', error);
      Alert.alert('Lỗi', 'Không thể thêm món. Vui lòng thử lại.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      
      <ScrollView>
        <Text style={styles.title}>THÊM MÓN HÀNG MỚI</Text>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên món hàng *</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="Nhập tên món hàng"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Số lượng</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Giá (đ)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Thêm ghi chú cho món hàng"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Image source={addIcon} style={styles.icon} />
              <Text style={styles.buttonText}>Thêm vào danh sách</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  form: { padding: 16 },
  row: { flexDirection: 'row', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  addButton: {
    backgroundColor: '#1E90FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  icon: { width: 24, height: 24, tintColor: '#fff', marginRight: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '500' },
  buttonContainer: { alignItems: 'center' },
});
