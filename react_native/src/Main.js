import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import InfobipRTC, {
  Call,
  CallOptions,
  InfobipRTCVideoView,
} from 'infobip-rtc-react-native';
import React, {useState} from 'react';
import {CallStatus} from './CallStatus';
import {TokenService} from './TokenService';

export default function Main() {
  const [destination, setDestination] = useState('');
  const [hasLocalVideo, setHasLocalVideo] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [status, setStatus] = useState(CallStatus.CALLING);
  const [activeCall, setActiveCall] = useState(null);

  let tokenService: TokenService = new TokenService();

  const call = async (isPSTN: boolean, isVideo: boolean = false) => {
    if (!destination || !destination.length) {
      return showError('Please enter destination for the call.');
    }

    setStatus(CallStatus.CALLING);

    try {
      let token = await tokenService.getToken();
      if (!token) {
        return showError('Error occurred while retrieving access token!');
      }
      console.log('Token retrieved. Starting call...');
      let options = CallOptions.builder().setVideo(isVideo).build();
      let outboundCall = isPSTN
        ? await InfobipRTC.callPhoneNumber(token, destination)
        : await InfobipRTC.call(token, destination, options);
      setupActiveCall(outboundCall);
    } catch (e) {
      console.log(e);
      showError(e.message);
    }
  };

  const setupActiveCall = (outgoingCall: Call) => {
    setActiveCall(outgoingCall);
    outgoingCall.on('ringing', () => onRinging());
    outgoingCall.on('early-media', () => onRinging());
    outgoingCall.on('established', (e) => onEstablished(e));
    outgoingCall.on('updated', (e) => onUpdated(e));
    outgoingCall.on('hangup', (e: any) => onHangup(e));
    outgoingCall.on('error', (e: any) => onHangup(e));
  };

  const onRinging = () => {
    setStatus(CallStatus.RINGING);
  };

  const onEstablished = (event) => {
    setHasLocalVideo(event.hasLocalVideo);
    setHasRemoteVideo(event.hasRemoteVideo);
    setStatus(CallStatus.ESTABLISHED);
  };

  const onUpdated = (event) => {
    setHasLocalVideo(event.hasLocalVideo);
    setHasRemoteVideo(event.hasRemoteVideo);
  };

  const onHangup = (e: any) => {
    setStatus(CallStatus.FINISHED);
    showInfo('Call finished. Status: ' + e.name);
    setActiveCall(undefined);
    setHasRemoteVideo(false);
    setHasLocalVideo(false);
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
            onPress={() => call(false, true)}>
            <Text style={styles.buttonText}>Video Call</Text>
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
          {hasRemoteVideo && (
            <View style={styles.remoteVideoView}>
              <InfobipRTCVideoView
                streamId="remote"
                style={styles.remoteVideo}
              />
            </View>
          )}
          {hasLocalVideo && (
            <View style={styles.localVideoView}>
              <InfobipRTCVideoView streamId="local" style={styles.localVideo} />
            </View>
          )}
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
    padding: 4,
    color: 'gray',
    fontSize: 18,
    textAlign: 'center',
  },
  statusText: {
    padding: 4,
    fontSize: 12,
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
    position: 'absolute',
    width: '100%',
    bottom: 10,
    alignItems: 'center',
    backgroundColor: '#fc3d39',
  },
  localVideoView: {
    position: 'absolute',
    bottom: 100,
    right: 10,
  },
  localVideo: {
    width: 100,
    height: 140,
  },
  remoteVideoView: {
    flex: 1,
  },
  remoteVideo: {
    aspectRatio: 1,
    width: '100%',
  },
});
