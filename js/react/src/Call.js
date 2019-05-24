import React, {Component} from "react";
import {InfobipRTC} from "infobip-rtc";
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
        this.state.infobipRTC.on('incoming-call', function (incomingCall) {
            console.log('Received incoming call from: ' + incomingCall.caller.identity);

            that.setState((state) => {
                state.activeCall = incomingCall;
                state.isIncomingCall = true;
                state.status = 'Incoming call from: ' + incomingCall.caller.identity;
                return state;
            });
            incomingCall.on('established', () => {
                that.refs.remoteAudio.srcObject = incomingCall.remoteStream;
                that.setState((state) => {
                    state.status = 'In a call with: ' + incomingCall.caller.identity;
                    state.isCallEstablished = true;
                    return state;
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

    listenForCallEvents() {
        if (this.state.activeCall) {
            let that = this;
            this.state.activeCall.on('established', function (event) {
                that.setState((state) => {
                    state.status = 'Call established with: ' + that.destination;
                    return state;
                });
                console.log('Call established with ' + that.state.destination);
                that.refs.remoteAudio.srcObject = event.remoteStream;
            });
            this.state.activeCall.on('hangup', function (event) {
                that.setValuesAfterOutgoingCall();
            });
            this.state.activeCall.on('ringing', function () {
                that.setState((state) => {
                    state.status = 'Ringing...';
                    return state;
                });
                console.log('Call is ringing...');
            });
            this.state.activeCall.on('error', function (event) {
                console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
                that.setValuesAfterOutgoingCall();
            });
        }
    }

    handleChange = (event) => {
        const dest = event.target.value;
        this.setState((state) => {
            state.destination = dest;
            return state;
        });
    };

    call = () => {
        if (this.state.destination) {
            this.setState((state) => {
                state.activeCall = this.state.infobipRTC.call(this.state.destination, {});
                state.isOutgoingCall = true;
                this.listenForCallEvents();
                return state;
            });
        }
    };

    callPhoneNumber = () => {
        if (this.state.destination) {
            this.setState((state) => {
                state.activeCall = this.state.infobipRTC.callPhoneNumber(this.state.destination, {from: '33755531044'});
                this.listenForCallEvents();
                return state;
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
        this.setState((state) => {
            state.status = null;
            state.activeCall = null;
            state.isCallEstablished = false;
            state.isIncomingCall = false;
            return state;
        });
    }

    setValuesAfterOutgoingCall() {
        this.setState((state) => {
            state.status = null;
            state.activeCall = null;
            state.isOutgoingCall = false;
            return state;
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