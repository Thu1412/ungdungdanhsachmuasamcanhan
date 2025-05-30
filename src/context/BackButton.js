import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

function BackButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
      <Image
        source={require('../../images/back.png')}
        style={{ width: 24, height: 24 }}
      />
    </TouchableOpacity>
  );
};

export default BackButton;
