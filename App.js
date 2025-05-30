import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-get-random-values';
export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </AuthProvider>
  );
} 