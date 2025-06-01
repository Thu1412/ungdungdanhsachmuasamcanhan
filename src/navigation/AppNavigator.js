import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Image,ImageBackground  } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import BackButton from '../context/BackButton';

// Auth Screens
import Dangnhap from '../Logic/Dangnhap';
import Dangky from '../Logic/Dangky';
import Quenmatkhau from '../Logic/Quenmatkhau';
import Doimatkhau from '../Logic/Doimatkhau';
// Main Screens
import Home from '../Logic/Home';
import ListDetail from '../Logic/ListDetail';
import AddList from '../screens/AddList';
import History from '../screens/History';
import Statistics from '../screens/Statistics';
import Profile from '../screens/Profile';
import AddItem from '../screens/AddItem';
import EditDetail from '../screens/EditDetail';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icons = {
  home: require('../../images/house.png'),
  home_outline: require('../../images/house.png'),
  time: require('../../images/history.png'),
  time_outline: require('../../images/history.png'),
  stats_chart: require('../../images/analysis.png'),
  stats_chart_outline: require('../../images/analysis.png'),
  person: require('../../images/user.png'),
  person_outline: require('../../images/user.png'),
};
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      key="profile-stack"
    >
      <Stack.Screen name="ProfileMain" component={Profile} />
      <Stack.Screen name="Doimatkhau" component={Doimatkhau} />
    </Stack.Navigator>
  );
}
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Đăng Nhập" component={Dangnhap} options={{ headerShown: false }} />
      <Stack.Screen name="Đăng Ký" component={Dangky} options={{ headerShown: false }}/>
      <Stack.Screen name="Quên Mật Khẩu" component={Quenmatkhau} options={{ headerShown: false }}/>
      <Stack.Screen name="Doimatkhau" component={Doimatkhau} options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
      headerTitleAlign: 'center',
      animation: 'slide_from_right',
      // bỏ headerLeft đi
    }}
      key="home-stack"
    >
      <Stack.Screen
        name="HomeScreen"  // đổi tên thành HomeScreen
        component={Home}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ListDetail"
        component={ListDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddList"
        component={AddList}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItem}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditDetail"
        component={EditDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Doimatkhau"
        component={Doimatkhau}
       options={{ headerShown: false }}
      />
      
    </Stack.Navigator>
  );
}
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconSource;

          switch (route.name) {
            case 'Home':
              iconSource = focused ? icons.home : icons.home_outline;
              break;
            case 'History':
              iconSource = focused ? icons.time : icons.time_outline;
              break;
            case 'Statistics':
              iconSource = focused ? icons.stats_chart : icons.stats_chart_outline;
              break;
            case 'Profile':
              iconSource = focused ? icons.person : icons.person_outline;
              break;
            default:
              iconSource = icons.home_outline;
          }

          return (
            <Image
              source={iconSource}
              style={{ width: size, height: size }}
              resizeMode="contain"
            />
          );
        },
        tabBarActiveTintColor: '#1E90FF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
      backBehavior="history"
      lazy={true}
      // Avoid aggressively unmounting tabs which might cause child view removal errors
      
    >
       <Tab.Screen
        name="Home"
        component={HomeStack}
        listeners={({ navigation, route }) => ({
          tabPress: e => {
            // Nếu bạn muốn khi nhấn tab Home, reset stack về HomeScreen:
            // Ngăn sự kiện mặc định
            e.preventDefault();

            // Navigate về màn hình HomeScreen trong stack HomeStack
            navigation.navigate('Home', {
              screen: 'HomeScreen', // Tên màn hình stack bên trong HomeStack
            });
          },
        })}
      />
      <Tab.Screen name="History" component={History} options={{ title: 'Lịch sử' }} />
      <Tab.Screen name="Statistics" component={Statistics} options={{ title: 'Thống kê' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ title: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  const navKey = user?.uid ?? 'guest';

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

