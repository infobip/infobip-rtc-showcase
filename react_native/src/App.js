import * as React from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';

import Main from './Main';
import Header from './Header';

export default function App() {
  return (
    <>
      <SafeAreaView style={styles.statusBar}>
        <StatusBar backgroundColor="#ca480c" barStyle="light-content" />
      </SafeAreaView>
      <Header title="Infobip RTC Showcase" />
      <SafeAreaView style={styles.container}>
        <Main />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    backgroundColor: '#e9530e',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 16,
  },
});
