import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';

const EditItem = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const { listId, itemId } = route.params;

  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItemData = async () => {
      if (!user?.email) {
        Alert.alert('Lỗi', 'Người dùng chưa đăng nhập');
        return;
      }
      try {
        const listDocRef = doc(db, 'users', user.email, 'lists', listId);
        const listDocSnap = await getDoc(listDocRef);

        if (listDocSnap.exists()) {
          const listData = listDocSnap.data();
          const items = Array.isArray(listData.items) ? listData.items : [];
          const item = items.find(i => i.id === itemId);
          if (item) {
            setItemName(item.name);
            setItemPrice(item.price.toString());
          } else {
            Alert.alert('Lỗi', 'Không tìm thấy món cần sửa');
            navigation.goBack();
          }
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy danh sách');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching item: ', error);
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu');
      }
    };

    fetchItemData();
  }, [listId, itemId, user]);

  const handleSave = async () => {
    if (!user?.email) {
      Alert.alert('Lỗi', 'Người dùng chưa đăng nhập');
      return;
    }
    if (!itemName.trim() || !itemPrice.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    const priceNumber = parseFloat(itemPrice);
    if (isNaN(priceNumber)) {
      Alert.alert('Lỗi', 'Giá phải là một số hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const emailId = user.email.replace(/\./g, ',');
      const listDocRef = doc(db, 'users', emailId, 'lists', listId);
      const listDocSnap = await getDoc(listDocRef);

      if (listDocSnap.exists()) {
        const listData = listDocSnap.data();
        const items = Array.isArray(listData.items) ? listData.items : [];

        const updatedItems = items.map(item =>
          item.id === itemId
            ? { ...item, name: itemName.trim(), price: priceNumber }
            : item
        );

        await updateDoc(listDocRef, { items: updatedItems });
        Alert.alert('Thành công', 'Đã cập nhật món ăn');
        navigation.goBack();
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy danh sách');
      }
    } catch (error) {
      console.error('Error updating item: ', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>THÊM MÓN HÀNG MỚI</Text>
      <Text style={styles.label}>Tên món</Text>
      <TextInput
        style={styles.input}
        value={itemName}
        onChangeText={setItemName}
        placeholder="Tên món"
      />
      <Text style={styles.label}>Giá</Text>
      <TextInput
        style={styles.input}
        value={itemPrice}
        onChangeText={setItemPrice}
        keyboardType="numeric"
        placeholder="Giá"
      />
      <Button title="Lưu" onPress={handleSave} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    fontSize: 16,
  },
});

export default EditItem;
