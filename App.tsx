import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import GeofenceComponent from './src/Components/GeofenceComponent';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <GeofenceComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
