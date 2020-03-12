import React, {Component} from "react";
import {CallPhoneNumberOptions, InfobipRTC} from "infobip-rtc";
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
                status: 'Incoming call from: ' + incomingCall.source().identity
            });
            incomingCall.on('established', () => {
                that.refs.remoteAudio.srcObject = incomingCall.remoteStream;
                that.setState({
                    status: 'In a call with: ' + incomingCall.source().identity,
                    isCallEstablished: true
                });
            });
            incomingCall.on('hangup', () => {
                that.setValuesAfterIncomingCall();
            });
            incomingCall.on('error', (event) => {
                console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
                that.setValuesAfterIncomingCall();
            });
        });
    }

    setCallEventHandlers(call) {
        let that = this;
        call.on('established', function (event) {
            that.setState({status: 'Call established with: ' + that.state.destination});
            console.log('Call established with ' + that.state.destination);
            that.refs.remoteAudio.srcObject = event.remoteStream;
        });
        call.on('hangup', function (event) {
            that.setValuesAfterOutgoingCall();
            that.setState({status: 'Call finished, status: ' + event.status.description});
        });
        call.on('ringing', function () {
            that.setState({status: 'Ringing...'});
            console.log('Call is ringing...');
        });
        call.on('error', function (event) {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
            that.setValuesAfterOutgoingCall();
        });
    }

    handleChange = (event) => {
        const dest = event.target.value;
        this.setState({destination: dest});
    };

    call = () => {
        if (this.state.destination) {
            const activeCall = this.state.infobipRTC.call(this.state.destination);
            this.setCallEventHandlers(activeCall);
            this.setState({
                activeCall: activeCall,
                isOutgoingCall: true
            });
        }
    };

    callPhoneNumber = () => {
        if (this.state.destination) {
            const activeCall = this.state.infobipRTC.callPhoneNumber(this.state.destination, new CallPhoneNumberOptions('33712345678'));
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
                <audio ref="remoteAudio" autoPlay></audio>
                <input type="text" value={this.state.destination} onChange={this.handleChange}
                       placeholder="Enter destination to call..."/>
                <br/> <br/>
                <button disabled={this.state.activeCall} onClick={this.call}>Call</button>
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
            </div>
        )
    }
}

export default Call;