import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

class Header extends React.Component<{title: any}> {
  render() {
    let {title} = this.props;
    return (
      <View style={styles.header}>
        <Text style={styles.text}>{title}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    padding: 15,
    backgroundColor: '#e9530e',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  text: {
    color: 'white',
    fontSize: 23,
    textAlign: 'center',
  },
});

export default Header;
