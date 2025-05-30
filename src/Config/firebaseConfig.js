// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCmDh5PZUM3dkkaN29mzVimCZ4Eb-2HTq8",
  authDomain: "ungdungdanhsachmuasam.firebaseapp.com",
  databaseURL: "https://ungdungdanhsachmuasam-default-rtdb.firebaseio.com",
  projectId: "ungdungdanhsachmuasam",
  storageBucket: "ungdungdanhsachmuasam.firebasestorage.app",
  messagingSenderId: "319093840487",
  appId: "1:319093840487:web:2b520be2a0e08ac333d2c2",
  measurementId: "G-F96XRL4X23"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

export { app, auth, db };
