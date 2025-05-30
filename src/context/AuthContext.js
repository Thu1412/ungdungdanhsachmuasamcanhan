import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../Config/firebaseConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔴 Luôn sign out khi app khởi động
    firebaseSignOut(auth).then(() => {
      console.log('Signed out automatically on app start');
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await signOut();
  navigation.navigate('HomeScreen');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
