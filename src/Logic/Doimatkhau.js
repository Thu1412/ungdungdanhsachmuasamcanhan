import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function Doimatkhau({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      // Xác thực lại user với mật khẩu cũ
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);

      // Cập nhật mật khẩu mới
      await updatePassword(user, newPassword);

      Alert.alert('Thành công', 'Doimatkhau thành công!');
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Lỗi', error.message || 'Đã có lỗi xảy ra');
    }
    setLoading(false);
  };

  return (
    <ImageBackground source={require('../../images/nenmuasam.jpg')} style={styles.nen}>
    <View style={styles.container}>
      <Image source={require('../../images/logomuasam.jpg')} style={styles.logo} />
      <Text style={styles.title}>Doimatkhau</Text>
      <TextInput
        placeholder="Mật khẩu cũ"
        secureTextEntry
        style={styles.input}
        value={oldPassword}
        onChangeText={setOldPassword}
      />
      <TextInput
        placeholder="Mật khẩu mới"
        secureTextEntry
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        placeholder="Xác nhận mật khẩu mới"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: '#aaa' }]}
        onPress={handleChangePassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Đang xử lý...' : 'Doimatkhau'}</Text>
      </TouchableOpacity>
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#2196F3' },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
