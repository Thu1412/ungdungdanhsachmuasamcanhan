import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ImageBackground,
  Button,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';

export default function Dangnhap({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(AuthContext);

  const dangNhap = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Lấy uid user để làm document ID
      const uid = userCredential.user.uid;

      // Lưu thông tin người dùng trong context
      setUser({
        uid: uid,
        email: userCredential.user.email,
      });
 const emailAsId = userCredential.user.email;
      // Lưu hoặc cập nhật thông tin người dùng vào Firestore theo uid
      await setDoc(
        doc(db, 'users', emailAsId),
        {
          email: userCredential.user.email,
          lastLogin: new Date(),
        },
        { merge: true }
      );


      // Điều hướng đến trang Home
      navigation.navigate('HomeScreen');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Lỗi', 'Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <ImageBackground source={require('../../images/nenmuasam.jpg')} style={styles.nen}>
      <View style={styles.container}>
        <Image source={require('../../images/logomuasam.jpg')} style={styles.logo} />

        <Text style={styles.title}>ĐĂNG NHẬP</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Mật khẩu"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <Button title="Đăng nhập" onPress={dangNhap} />

        <TouchableOpacity onPress={() => navigation.navigate('Đăng Ký')}>
          <Text style={styles.link}>Chưa có tài khoản? Đăng ký</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Quên Mật Khẩu')}>
          <Text style={styles.link}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  nen: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    fontSize: 16,
  },
  link: {
    color: '#007AFF',
    marginTop: 10,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
