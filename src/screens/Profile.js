import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ImageBackground,
  Image,
  TextInput,
  Switch,
} from 'react-native';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import { updatePassword, updateEmail } from 'firebase/auth';
import Doimatkhau from '../Logic/Doimatkhau';
const icons = {
  profile: require('../../images/profile1.png'),
  logout: require('../../images/logout.png'),
  edit: require('../../images/edit.png'),
  stats: require('../../images/analysis.png'),
};

export default function Profile({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState({
    displayName: '',
    email: user?.email || '',
    phoneNumber: '',
  });
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoComplete: true,
  });
  const [stats, setStats] = useState({
    totalLists: 0,
    completedLists: 0,
    totalSpent: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user?.email) {
      loadUserInfo();
      loadUserSettings();
      loadUserStats();
    }
  }, [user]);

  const loadUserInfo = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.email));
      if (userDoc.exists()) {
        setUserInfo({
          ...userInfo,
          ...userDoc.data(),
        });
      }
    } catch (error) {
      console.error('Load user info error:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    }
  };

  const loadUserSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'users', user.email, 'settings', 'preferences'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      // Đếm tổng số danh sách
      const listsQuery = query(collection(db, 'users', user.email, 'lists'));
      const listsSnapshot = await getDocs(listsQuery);
      const totalLists = listsSnapshot.size;

      // Đếm số danh sách đã hoàn thành
      const completedQuery = query(
        collection(db, 'users', user.email, 'lists'),
        where('completed', '==', true)
      );
      const completedSnapshot = await getDocs(completedQuery);
      const completedLists = completedSnapshot.size;

      // Tính tổng chi tiêu
      let totalSpent = 0;
      completedSnapshot.forEach((doc) => {
        totalSpent += doc.data().totalSpent || 0;
      });

      setStats({
        totalLists,
        completedLists,
        totalSpent,
      });
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Cập nhật thông tin cơ bản
      const userRef = doc(db, 'users', user.email);
      await updateDoc(userRef, {
        displayName: userInfo.displayName,
        phoneNumber: userInfo.phoneNumber,
      });

      // Cập nhật email nếu có thay đổi
      if (userInfo.email !== user.email) {
        await updateEmail(user, userInfo.email);
      }

      // Cập nhật mật khẩu nếu có nhập mới
      if (newPassword) {
        await updatePassword(user, newPassword);
        setNewPassword('');
      }

      setIsEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const settingsRef = doc(db, 'users', user.email, 'settings', 'preferences');
      await updateDoc(settingsRef, { [key]: value });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Update setting error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật cài đặt');
    }
  };

 const handleSignOut = () => {
  Alert.alert(
    'Đăng xuất',
    'Bạn có chắc muốn đăng xuất?',
    [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => signOut(), // Đây là hàm từ AuthContext
      },
    ]
  );
};


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={icons.profile} style={styles.avatar} />
        {isEditing ? (
          <TextInput
            style={styles.nameInput}
            value={userInfo.displayName}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, displayName: text }))}
            placeholder="Nhập tên hiển thị"
          />
        ) : (
          <Text style={styles.displayName}>{userInfo.displayName || 'Chưa có tên'}</Text>
        )}
        <Text style={styles.email}>{userInfo.email}</Text>
      </View>

      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Image source={icons.edit} style={styles.icon} />
          </TouchableOpacity>
        

        {isEditing ? (
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={userInfo.email}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={userInfo.phoneNumber}
                onChangeText={(text) => setUserInfo(prev => ({ ...prev, phoneNumber: text }))}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Nhập để Đổi Mật Khẩu"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{userInfo.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại:</Text>
              <Text style={styles.infoValue}>{userInfo.phoneNumber || 'Chưa cập nhật'}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
  <Text style={styles.sectionTitle}>Thống kê</Text>
  <View style={styles.statsContainer}>
    <View style={styles.statItem}>
      <Image source={icons.stats} style={styles.statIcon} />
      <Text style={styles.statNumber}>{stats.totalLists}</Text>
      <Text style={styles.statLabel}>SL Danh Sách</Text>
    </View>
    <View style={styles.statItem}>
      <Image source={icons.stats} style={styles.statIcon} />
      <Text style={styles.statNumber}>{stats.completedLists}</Text>
      <Text style={styles.statLabel}>SL Hoàn Thành</Text>
    </View>
    <View style={styles.statItem}>
      <Image source={icons.stats} style={styles.statIcon} />
      <Text style={styles.statNumber}>
        {stats.totalSpent.toLocaleString()}đ
      </Text>
      <Text style={styles.statLabel}>Tổng Tiền Mua</Text>
    </View>
  </View>
</View>


      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Thông báo</Text>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => updateSetting('notifications', value)}
          />
        </View>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Doimatkhau')}
        >
          <Text style={[styles.settingLabel, { color: '#333' }]}>Đổi Mật Khẩu</Text>
        </TouchableOpacity>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Tự động hoàn thành</Text>
          <Switch
            value={settings.autoComplete}
            onValueChange={(value) => updateSetting('autoComplete', value)} 
          />
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Image source={icons.logout} style={styles.logoutIcon} />
        <Text style={styles.signOutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#CCCCFF',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#CCCCFF',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#663366',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    marginVertical: 20,
  paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#009966',
     fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
  textAlign: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#666',
  },
  form: {
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 16,
    
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#1E90FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 10,

  },
  statIcon: {
    width: 32,
    height: 32,
    marginBottom: 8,
    tintColor: '#1E90FF',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  logoutIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
    marginRight: 8,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
