import React, { useState } from 'react';
import { View, TextInput,Image,Text, Button, Alert, StyleSheet, ImageBackground } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../Config/firebaseConfig';

export default function Quenmatkhau({ navigation }) {
  const [email, setEmail] = useState('');

  const layLaiMatKhau = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert('Thành công', 'Email khôi phục đã được gửi!');
        navigation.goBack();
      })
      .catch((error) => {
        Alert.alert('Lỗi', error.message);
      });
  };

  return (
    <ImageBackground source={require('../../images/nenmuasam.jpg')} style={styles.nen}>
      <View style={styles.container}>
        <Image source={require('../../images/logomuasam.jpg')} style={styles.logo} />
        <Text style={styles.title}>LẤY LẠI MẬT KHẨU</Text>
        <TextInput placeholder="Nhập email của bạn" value={email} onChangeText={setEmail} style={styles.input} />
        <Button title="Gửi email khôi phục" onPress={layLaiMatKhau} />
        <Button title="Quay lại đăng nhập" onPress={() => navigation.goBack()} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  nen: { flex: 1 },
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  input: {
    width: '100%', height: 50, borderColor: 'gray', borderWidth: 1,color: '#333',
    borderRadius: 5, marginBottom: 10, paddingHorizontal: 10, backgroundColor: 'white',
  },
   logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  }
});
