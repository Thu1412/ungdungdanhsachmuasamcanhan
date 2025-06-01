import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Alert } from 'react-native';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig'; 
import { AuthContext } from '../context/AuthContext';  // thêm dòng này

export default function ListDetail({ route, navigation }) {
  const { user } = useContext(AuthContext);  // thêm dòng này để có user

  const { listId, itemId, itemData } = route.params;

  const [name, setName] = useState(itemData.name);
  const [price, setPrice] = useState(String(itemData.price));
  const [quantity, setQuantity] = useState(String(itemData.quantity));
  const [note, setNote] = useState(itemData.note || '');

  const handleSave = async () => {
    // Validate dữ liệu
    if (!user) {
      Alert.alert('Lỗi', 'Bạn chưa đăng nhập');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }
    if (isNaN(price) || Number(price) <= 0) {
      Alert.alert('Lỗi', 'Giá phải là số lớn hơn 0');
      return;
    }
    if (isNaN(quantity) || Number(quantity) < 0) {
      Alert.alert('Lỗi', 'Số lượng phải là số không âm');
      return;
    }

    const updatedItem = {
      ...itemData,
      name: name.trim(),
      price: Number(price),
      quantity: Number(quantity),
      note: note.trim(),
    };

    try {
      const itemRef = doc(db, 'users', user.email, 'lists', listId, 'items', itemId);
      const docSnap = await getDoc(itemRef);

      if (docSnap.exists()) {
        // Nếu document tồn tại thì update
        await updateDoc(itemRef, updatedItem);
      } else {
        // Nếu không tồn tại thì tạo mới
        await setDoc(itemRef, updatedItem, { merge: true });
      }

      Alert.alert(
        'Thành công',
        'Đã lưu thay đổi',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ListDetail', { updatedItem, listId, itemId });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu dữ liệu: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chỉnh sửa chi tiết</Text>

      <Text style={styles.label}>Tên:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nhập tên"
      />

      <Text style={styles.label}>Giá:</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="Nhập giá"
      />

      <Text style={styles.label}>Số lượng:</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="Nhập số lượng"
      />

      <Text style={styles.label}>Ghi chú:</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Nhập ghi chú"
      />

      <View style={styles.buttonContainer}>
        <Button title="Lưu" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginTop: 10, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 30,
  },
});

