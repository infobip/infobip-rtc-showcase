import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import InfobipRTC, {Call, CallOptions, InfobipRTCVideoView} from 'infobip-rtc-react-native';
import React from 'react';
import {CallStatus} from './CallStatus';
import {TokenService} from './TokenService';
import {IncomingCallHandler} from './IncomingCallHandler';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      peer: '',
      status: CallStatus.CALLING,
      activeCall: null,
      isIncoming: false,
      token: null,
      incomingCallHandler: null,
    };
  }

  async componentDidMount() {
    this.state.token = await TokenService.getToken();
    if (!this.state.token) {
      return this.showError('Error occurred while retrieving access token!');
    }
    this.state.incomingCallHandler = new IncomingCallHandler(this.state.token);
    await this.state.incomingCallHandler.initializePush((incomingCall) => this.setupIncomingCall(incomingCall));
    await this.state.incomingCallHandler.initializeCallKit(
      () => this.answerCall(),
      () => this.endCall()
    );
  }

  setupIncomingCall(incomingCall) {
    this.setupActiveCall(incomingCall);
    this.setState({
      peer: incomingCall.source().identity,
      isIncoming: true,
    });
  }

  answerCall() {
    let video = this.state.activeCall?.hasRemoteVideo();
    this.accept(video);
  }

  endCall() {
    if (this.state.isIncoming) {
      this.decline();
    } else {
      this.state?.activeCall?.hangup();
    }
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
      let outboundCall = await InfobipRTC.callConversations(this.state.token, options);
      this.setupActiveCall(outboundCall);
    } catch (e) {
      this.showError(e.message);
    }
  }

  setupActiveCall(call: Call) {
    call.on('ringing', () => this.onRinging());
    call.on('early-media', () => this.onRinging());
    call.on('established', (e) => this.onEstablished(e));
    call.on('updated', (e) => this.onUpdated(e));
    call.on('hangup', (e: any) => this.onHangup(e));
    call.on('error', (e: any) => this.onHangup(e));
    this.setState({activeCall: call});
  }

  onRinging() {
    this.setState({status: CallStatus.RINGING});
  }

  async onEstablished(event) {
    let call = this.state.activeCall;
    if (this.state.isIncoming) {
      await this.state.incomingCallHandler.startCallKitCall(call);
    }
    this.setState({
      status: CallStatus.ESTABLISHED,
      isIncoming: false,
    });
  }

  onUpdated(event) {
    this.setState({status: CallStatus.ESTABLISHED});
  }

  async onHangup(e: any) {
    await this.state.incomingCallHandler.endCallKitCall(this.state.activeCall?.id());
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
      <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
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
            <TouchableOpacity style={[styles.button, styles.basicButton]} onPress={() => this.call(false)}>
              <Text style={styles.buttonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.basicButton]} onPress={() => this.call(false, true)}>
              <Text style={styles.buttonText}>Video Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.basicButton]} onPress={() => this.call(true)}>
              <Text style={styles.buttonText}>Call Phone Number</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.basicButton]} onPress={() => this.callConversations()}>
              <Text style={styles.buttonText}>Call Conversations</Text>
            </TouchableOpacity>
          </>
        )}
        {this.state.isIncoming && (
          <>
            <Text style={styles.peerText}>{this.state.peer}</Text>
            <Text style={styles.statusText}>Incoming call</Text>
            <TouchableOpacity style={[styles.button, styles.basicButton]} onPress={() => this.accept(false)}>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            {this.state.activeCall.hasRemoteVideo() && (
              <TouchableOpacity style={[styles.button, styles.basicButton]} onPress={() => this.accept(true)}>
                <Text style={styles.buttonText}>Accept with video</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.button, styles.hangupButton]} onPress={() => this.decline()}>
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
                <InfobipRTCVideoView streamId="remote" style={styles.remoteVideo} />
              </View>
            )}
            {this.state.activeCall.hasLocalVideo() && this.state.status === CallStatus.ESTABLISHED && (
              <View style={styles.localVideoView}>
                <InfobipRTCVideoView streamId="local" style={styles.localVideo} />
              </View>
            )}
            {this.state.status === CallStatus.ESTABLISHED && (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={() => this.toggleLocalVideo()}>
                  {this.state.activeCall.hasLocalVideo() && <Text style={styles.buttonText}>Video Off</Text>}
                  {!this.state.activeCall.hasLocalVideo() && <Text style={styles.buttonText}>Video On</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={() => this.toggleSpeakerphone()}>
                  <Text style={styles.buttonText}>Speaker</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.smallButton]} onPress={() => this.toggleMute()}>
                  <Text style={styles.buttonText}>Mute</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={[styles.button, styles.hangupButton]} onPress={() => this.hangup()}>
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
