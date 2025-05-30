import React, { useState } from 'react';
import { View, TextInput,Image,Text, Button, Alert, StyleSheet, ImageBackground } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';

export default function Dangky({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dangKy = async () => {
    try {
      // Tạo tài khoản với Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Tạo document trong Firestore với email làm ID
      await setDoc(doc(db, 'users', email), {
        email: email,
        createdAt: new Date().toISOString(),
      });

      // Tạo document settings mặc định
      await setDoc(doc(db, 'users', user.email, 'settings', 'preferences'), {
        notifications: true,
        darkMode: false,
        autoComplete: true
      });

      Alert.alert('Thành công', 'Tài khoản đã được tạo!');
      navigation.navigate('Đăng Nhập');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Lỗi', error.message);
    }
  };

  return (
    <ImageBackground source={require('../../images/nenmuasam.jpg')} style={styles.nen}>
      <View style={styles.container}>
        <Image source={require('../../images/logomuasam.jpg')} style={styles.logo} />
        <Text style={styles.title}>ĐĂNG KÝ TÀI KHOẢN</Text>
        <TextInput 
          placeholder="Email" 
          value={email} 
          onChangeText={setEmail} 
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput 
          placeholder="Mật khẩu" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
          style={styles.input} 
        />
        <Button title="Đăng ký" onPress={dangKy} />
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
    width: '100%', height: 50, borderColor: 'gray', borderWidth: 1,
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
