import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import InfobipRTC, {Call} from 'infobip-rtc-react-native';
import React, {useState} from 'react';
import {CallStatus} from './CallStatus';
import {TokenService} from './TokenService';

export default function Main() {
  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState(CallStatus.CALLING);
  const [activeCall, setActiveCall] = useState(null);

  let tokenService: TokenService = new TokenService();

  const call = async (isPSTN: boolean) => {
    if (!destination || !destination.length) {
      return showError('Please enter destination for the call.');
    }

    setStatus(CallStatus.CALLING);

    try {
      let token = await tokenService.getToken();
      if (!token) {
        return showError('Error occurred while retrieving access token!');
      }
      let outboundCall = isPSTN
        ? await InfobipRTC.callPhoneNumber(token, destination)
        : await InfobipRTC.call(token, destination);
      setupActiveCall(outboundCall);
    } catch (e) {
      showError(e.message);
    }
  };

  const setupActiveCall = (outgoingCall: Call) => {
    setActiveCall(outgoingCall);
    outgoingCall.on('ringing', () => onRinging());
    outgoingCall.on('early-media', () => onRinging());
    outgoingCall.on('established', () => onEstablished());
    outgoingCall.on('hangup', (e: any) => onHangup(e));
    outgoingCall.on('error', (e: any) => onHangup(e));
  };

  const onRinging = () => {
    setStatus(CallStatus.RINGING);
  };

  const onEstablished = () => {
    setStatus(CallStatus.ESTABLISHED);
  };

  const onHangup = (e: any) => {
    setStatus(CallStatus.FINISHED);
    showInfo('Call finished. Status: ' + e.name);
    setActiveCall(undefined);
  };

  const showInfo = (message: string) => {
    return showAlert('Info!', message);
  };

  const showError = (message: string) => {
    return showAlert('Error!', message);
  };

  const showAlert = (title: string, message: string) => {
    return Alert.alert(title, message);
  };

  const hangup = () => {
    activeCall?.hangup();
  };

  return (
    <ScrollView
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps="handled">
      {!activeCall && (
        <>
          <TextInput
            placeholder="Enter destination"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCompleteType="off"
            autoCorrect={false}
            clearButtonMode="always"
            style={styles.destinationInput}
            onChangeText={(value) => setDestination(value.trim())}
            value={destination}
          />
          <TouchableOpacity
            style={[styles.button, styles.callButton]}
            onPress={() => call(false)}>
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.callButton]}
            onPress={() => call(true)}>
            <Text style={styles.buttonText}>Call Phone Number</Text>
          </TouchableOpacity>
        </>
      )}
      {activeCall && (
        <>
          <Text style={styles.peerText}>{destination}</Text>
          <Text style={styles.statusText}>{status}</Text>
          <TouchableOpacity
            style={[styles.button, styles.hangupButton]}
            onPress={hangup}>
            <Text style={styles.buttonText}>Hangup</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  peerText: {
    padding: 16,
    marginVertical: 8,
    color: 'gray',
    fontSize: 20,
    textAlign: 'center',
  },
  statusText: {
    padding: 5,
    marginVertical: 8,
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
  destinationInput: {
    height: 60,
    padding: 8,
    marginVertical: 8,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
  },
  button: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  callButton: {
    alignItems: 'center',
    backgroundColor: '#53d769',
  },
  hangupButton: {
    alignItems: 'center',
    backgroundColor: '#fc3d39',
  },
});
