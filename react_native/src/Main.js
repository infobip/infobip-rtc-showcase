import {
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import InfobipRTC, {
  Call,
  CallOptions,
  IncomingCall,
  InfobipRTCVideoView,
} from 'infobip-rtc-react-native';
import React from 'react';
import {CallStatus} from './CallStatus';
import {TokenService} from './TokenService';
import PermissionProvider from './PermissionProvider';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      peer: '',
      status: CallStatus.CALLING,
      activeCall: null,
      isIncoming: false,
      token: null,
    };
  }

  async componentDidMount() {
    let tokenService: TokenService = new TokenService();
    this.state.token = await tokenService.getToken();
    if (!this.state.token) {
      return this.showError('Error occurred while retrieving access token!');
    }
    if (Platform.OS === 'android') {
      PermissionProvider.requestPermission([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]).catch((e) => {
        Alert.alert('Error!', e.message);
      });
      InfobipRTC.enablePushNotification(this.state.token)
        .then(console.log('Enabled push notifications.'))
        .catch((e) =>
          console.error('Error occurred while enabling push notifications.', e),
        );

      messaging().onMessage(this.handleNotification());
      messaging().setBackgroundMessageHandler(this.handleNotification());
    }
  }

  handleNotification() {
    return async (remoteMessage) => {
      try {
        let incomingCall: IncomingCall = await InfobipRTC.handleIncomingCall(
          remoteMessage.data,
        );
        if (incomingCall) {
          this.setState({
            peer: incomingCall.source().identity,
            isIncoming: true,
          });
          this.setupActiveCall(incomingCall);
          console.log(
            'Incoming call from: ' + this.state.activeCall.source().identity,
          );
        }
      } catch (error) {
        console.error('Error handling incoming call: ', error);
      }
    };
  }

  async call(isPSTN: boolean, isVideo: boolean = false) {
    if (!this.state.peer || !this.state.peer.length) {
      return this.showError('Please enter destination for the call.');
    }

    this.setState({status: CallStatus.CALLING});

    try {
      let options = CallOptions.builder().setVideo(isVideo).build();
      let outboundCall = isPSTN
        ? await InfobipRTC.callPhoneNumber(this.state.token, this.state.peer)
        : await InfobipRTC.call(this.state.token, this.state.peer, options);
      this.setupActiveCall(outboundCall);
    } catch (e) {
      this.showError(e.message);
    }
  }

  async callConversations() {
    this.setState({status: CallStatus.CALLING});

    try {
      let options = CallOptions.builder().setVideo(true).build();
      let outboundCall = await InfobipRTC.callConversations(
        this.state.token,
        options,
      );
      this.setupActiveCall(outboundCall);
    } catch (e) {
      this.showError(e.message);
    }
  }

  setupActiveCall(call: Call) {
    this.setState({activeCall: call});
    this.state.activeCall.on('ringing', () => this.onRinging());
    this.state.activeCall.on('early-media', () => this.onRinging());
    this.state.activeCall.on('established', (e) => this.onEstablished(e));
    this.state.activeCall.on('updated', (e) => this.onUpdated(e));
    this.state.activeCall.on('hangup', (e: any) => this.onHangup(e));
    this.state.activeCall.on('error', (e: any) => this.onHangup(e));
  }

  onRinging() {
    this.setState({status: CallStatus.RINGING});
  }

  onEstablished(event) {
    this.setState({
      status: CallStatus.ESTABLISHED,
      isIncoming: false,
    });
  }

  onUpdated(event) {
    this.setState({status: CallStatus.ESTABLISHED});
  }

  onHangup(e: any) {
    this.setState({
      status: CallStatus.FINISHED,
      activeCall: undefined,
      isIncoming: false,
    });
    this.showInfo('Call finished. Status: ' + e.name);
  }

  showInfo(message: string) {
    return this.showAlert('Info!', message);
  }

  showError(message: string) {
    return this.showAlert('Error!', message);
  }

  showAlert(title: string, message: string) {
    return Alert.alert(title, message);
  }

  hangup() {
    this.state.activeCall?.hangup();
  }

  accept(isVideo: boolean = false) {
    let options = CallOptions.builder().setVideo(isVideo).build();
    this.state.activeCall?.accept(options);
  }

  decline() {
    this.state.activeCall?.decline();
  }

  setPeer(peer) {
    this.setState({peer: peer});
  }

  toggleLocalVideo() {
    const call = this.state.activeCall;
    call?.localVideo(!call.hasLocalVideo());
  }

  toggleSpeakerphone() {
    const call = this.state.activeCall;
    call?.speakerphone(!call.speakerphoneOn());
  }

  toggleMute() {
    const call = this.state.activeCall;
    call?.mute(!call.muted());
  }

  render() {
    return (
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
        {!this.state.activeCall && !this.state.isIncoming && (
          <>
            <TextInput
              placeholder="Enter destination"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCompleteType="off"
              autoCorrect={false}
              clearButtonMode="always"
              style={styles.peerInput}
              onChangeText={(value) => this.setPeer(value.trim())}
              value={this.state.peer}
            />
            <TouchableOpacity
              style={[styles.button, styles.basicButton]}
              onPress={() => this.call(false)}>
              <Text style={styles.buttonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.basicButton]}
              onPress={() => this.call(false, true)}>
              <Text style={styles.buttonText}>Video Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.basicButton]}
              onPress={() => this.call(true)}>
              <Text style={styles.buttonText}>Call Phone Number</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.basicButton]}
              onPress={() => this.callConversations()}>
              <Text style={styles.buttonText}>Call Conversations</Text>
            </TouchableOpacity>
          </>
        )}
        {this.state.isIncoming && (
          <>
            <Text style={styles.peerText}>{this.state.peer}</Text>
            <Text style={styles.statusText}>Incoming call</Text>
            <TouchableOpacity
              style={[styles.button, styles.basicButton]}
              onPress={() => this.accept(false)}>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            {this.state.activeCall.hasRemoteVideo() && (
              <TouchableOpacity
                style={[styles.button, styles.basicButton]}
                onPress={() => this.accept(true)}>
                <Text style={styles.buttonText}>Accept with video</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.hangupButton]}
              onPress={() => this.decline()}>
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
          </>
        )}
        {this.state.activeCall && !this.state.isIncoming && (
          <>
            <Text style={styles.peerText}>{this.state.peer}</Text>
            <Text style={styles.statusText}>{this.state.status}</Text>
            {this.state.activeCall.hasRemoteVideo() && (
              <View style={styles.remoteVideoView}>
                <InfobipRTCVideoView
                  streamId="remote"
                  style={styles.remoteVideo}
                />
              </View>
            )}
            {this.state.activeCall.hasLocalVideo() &&
              this.state.status === CallStatus.ESTABLISHED && (
                <View style={styles.localVideoView}>
                  <InfobipRTCVideoView
                    streamId="local"
                    style={styles.localVideo}
                  />
                </View>
              )}
            {this.state.status === CallStatus.ESTABLISHED && (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.smallButton]}
                  onPress={() => this.toggleLocalVideo()}>
                  {this.state.activeCall.hasLocalVideo() && (
                    <Text style={styles.buttonText}>Video Off</Text>
                  )}
                  {!this.state.activeCall.hasLocalVideo() && (
                    <Text style={styles.buttonText}>Video On</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.smallButton]}
                  onPress={() => this.toggleSpeakerphone()}>
                  <Text style={styles.buttonText}>Speaker</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.smallButton]}
                  onPress={() => this.toggleMute()}>
                  <Text style={styles.buttonText}>Mute</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.button, styles.hangupButton]}
              onPress={() => this.hangup()}>
              <Text style={styles.buttonText}>Hangup</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  peerText: {
    padding: 40,
    color: 'gray',
    fontSize: 22,
    textAlign: 'center',
  },
  statusText: {
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
  peerInput: {
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
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  basicButton: {
    backgroundColor: '#53d769',
  },
  smallButton: {
    maxWidth: '33%',
    backgroundColor: '#53d769',
  },
  buttonsContainer: {
    flexDirection: 'row',
    height: 70,
    justifyContent: 'space-between',
  },
  hangupButton: {
    bottom: 10,
    backgroundColor: '#fc3d39',
  },
  localVideoView: {
    position: 'absolute',
    bottom: 150,
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

export default Main;
