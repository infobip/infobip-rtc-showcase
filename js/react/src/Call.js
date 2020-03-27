import React, {Component} from "react";
import {CallOptions, CallPhoneNumberOptions, InfobipRTC} from "infobip-rtc";
import httpClient from "axios";

class Call extends Component {

    constructor(props) {
        super(props);
        this.state = {
            destination: '',
            infobipRTC: null,
            activeCall: null,
            identity: '',
            status: '',
            isCallEstablished: false,
            isOutgoingCall: false,
            isIncomingCall: false
        };

        this.connectInfobipRTC();
    }

    connectInfobipRTC = async () => {
        let that = this;
        httpClient.post('http://localhost:8080/token')
            .then((response) => {
                that.setState((state) => {
                    state.infobipRTC = new InfobipRTC(response.data.token, {debug: true});
                    state.infobipRTC.on('connected', function (event) {
                        that.setState({identity: event.identity});
                        console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    });
                    state.infobipRTC.on('disconnected', function (event) {
                        console.warn('Disconnected from Infobip RTC Cloud.');
                    });
                    state.infobipRTC.connect();
                    that.listenForIncomingCall();
                    return state;
                });
            })
            .catch(err => {
                console.error(err);
            });
    };

    listenForIncomingCall() {
        let that = this;
        this.state.infobipRTC.on('incoming-call', function (incomingCallEvent) {
            const incomingCall = incomingCallEvent.incomingCall;
            console.log('Received incoming call from: ' + incomingCall.source().identity);

            that.setState({
                activeCall: incomingCall,
                isIncomingCall: true,
                status: 'Incoming ' + (incomingCall.options.video ? 'video' : 'audio') + ' call from: ' + incomingCall.source().identity
            });
            incomingCall.on('established', event => {
                that.setMediaStream(incomingCall, event);
                that.setState({
                    status: 'In a call with: ' + incomingCall.source().identity,
                    isCallEstablished: true
                });
            });
            incomingCall.on('hangup', () => {
                that.removeMediaStream();
                that.setValuesAfterIncomingCall();
            });
            incomingCall.on('error', (event) => {
                console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
                that.removeMediaStream();
                that.setValuesAfterIncomingCall();
            });
        });
    }

    setCallEventHandlers(call) {
        let that = this;
        call.on('established', function (event) {
            that.setState({status: 'Call established with: ' + that.state.destination});
            console.log('Call established with ' + that.state.destination);
            that.setMediaStream(call, event);
        });
        call.on('hangup', function (event) {
            that.removeMediaStream();
            that.setValuesAfterOutgoingCall();
            that.setState({status: 'Call finished, status: ' + event.status.description});
        });
        call.on('ringing', function () {
            that.setState({status: 'Ringing...'});
            console.log('Call is ringing...');
        });
        call.on('error', function (event) {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
            that.removeMediaStream();
            that.setValuesAfterOutgoingCall();
        });
    }

    setMediaStream(call, event) {
        if (call.options.video) {
            this.refs.localVideo.srcObject = event.localStream;
            this.refs.remoteVideo.srcObject = event.remoteStream;
        } else {
            this.refs.remoteAudio.srcObject = event.remoteStream;
        }
    }

    removeMediaStream() {
        this.refs.localVideo.srcObject = null;
        this.refs.remoteVideo.srcObject = null;
        this.refs.remoteAudio.srcObject = null;
    }

    handleChange = (event) => {
        const dest = event.target.value;
        this.setState({destination: dest});
    };

    call = (video = false) => {
        if (this.state.destination) {
            let callOptions = CallOptions.builder()
                .setVideo(video)
                .build();

            const activeCall = this.state.infobipRTC.call(this.state.destination, callOptions);
            this.setCallEventHandlers(activeCall);
            this.setState({
                activeCall: activeCall,
                isOutgoingCall: true
            });
        }
    };

    callPhoneNumber = () => {
        if (this.state.destination) {
            let callPhoneNumberOptions = CallPhoneNumberOptions.builder()
                .setFrom('33712345678')
                .build();
            const activeCall = this.state.infobipRTC.callPhoneNumber(this.state.destination, callPhoneNumberOptions);
            this.setCallEventHandlers(activeCall);
            this.setState({
                activeCall: activeCall,
                isOutgoingCall: true
            });
        }
    };

    accept = () => {
        this.state.activeCall.accept();
    };

    decline = () => {
        this.state.activeCall.decline();
    };

    hangup = () => {
        this.state.activeCall.hangup();
    };

    shouldDisableButtonsOnIncomingCall() {
        return this.state.isCallEstablished || this.state.isOutgoingCall || !this.state.isIncomingCall;
    }

    shouldDisableHangupButton() {
        return !this.state.activeCall || (!this.state.isCallEstablished && this.state.isIncomingCall);
    }

    setValuesAfterIncomingCall() {
        this.setState({
            status: null,
            activeCall: null,
            isCallEstablished: false,
            isIncomingCall: false
        });
    }

    setValuesAfterOutgoingCall() {
        this.setState({
            activeCall: null,
            isOutgoingCall: false
        });
    }

    render() {
        return (
            <div>
                <h4>Logged as: <span>{this.state.identity}</span></h4>
                <audio ref="remoteAudio" autoPlay/>
                <input type="text" value={this.state.destination} onChange={this.handleChange}
                       placeholder="Enter destination to call..."/>
                <br/> <br/>
                <button disabled={this.state.activeCall} onClick={() => this.call(false)}>Call</button>
                <button disabled={this.state.activeCall} onClick={() => this.call(true)}>Video Call</button>
                <button disabled={this.state.activeCall} onClick={this.callPhoneNumber}>Call Phone Number</button>
                <br/><br/>

                <h4><span>{this.state.status}</span></h4>
                <button
                    disabled={this.shouldDisableButtonsOnIncomingCall()}
                    onClick={this.accept}>Accept
                </button>
                <button
                    disabled={this.shouldDisableButtonsOnIncomingCall()}
                    onClick={this.decline}>Decline
                </button>
                <br/><br/>
                <button disabled={this.shouldDisableHangupButton()}
                        onClick={this.hangup}>Hangup
                </button>
                <br/><br/>

                <video width="700" height="700"
                       style={{"object-fit": "cover"}}
                       autoPlay
                       ref="remoteVideo"/>
                <video width="700" height="700"
                       style={{"object-fit": "cover"}}
                       autoPlay
                       ref="localVideo"/>
            </div>
        )
    }
}

export default Call;