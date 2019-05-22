import React, {Component} from "react";
import httpClient from "axios";
import {InfobipRTC} from "infobip-rtc";

class ReceiveCall extends Component {

    constructor(props) {
        super(props);

        this.state = {
            identity: '',
            status: '',
            infobipRTC: null,
            activeCall: null,
            isCallEstablished: false
        };

        this.connectInfobipRTC('receiveCallTest');
    }

    connectInfobipRTC = async (identity) => {
        let that = this;
        httpClient.post('/token', { identity: identity })
            .then((response) => {
                that.setState((state) => {
                    state.infobipRTC = new InfobipRTC(response.data.token, {debug: true});
                    state.identity = identity;
                    state.infobipRTC.on('connected', function (event) {
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
            .catch(err => { console.error(err); });
    };

    listenForIncomingCall() {
        let that = this;
        this.state.infobipRTC.on('incoming-call', function(incomingCall) {
            console.log('Received incoming call from: ' + incomingCall.caller.identity);

            that.setState((state) => {
                state.activeCall = incomingCall;
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
                that.setState((state) => {
                    state.status = null;
                    state.activeCall = null;
                    state.isCallEstablished = false;
                    return state;
                });
            });
        });
    }

    accept = () => {
        this.state.activeCall.accept();
    };

    decline = () => {
        this.state.activeCall.decline();
    };

    hangup = () => {
        this.state.activeCall.hangup();
    };

    render() {
        return (
            <div>
                <h2>Infobip RTC Showcase</h2>
                <h3>Receive Incoming Call</h3>
                <audio ref="remoteAudio" autoPlay> </audio>
                <h4>Logged as: <span>{this.state.identity || 'None'}</span></h4>
                <h4>Status: <span>{this.state.status || 'Idle'}</span> </h4>
                <button disabled={!this.state.activeCall || this.state.isCallEstablished} onClick={this.accept}>Accept</button>
                <button disabled={!this.state.activeCall || this.state.isCallEstablished} onClick={this.decline}>Decline</button>
                <br/><br/>
                <button disabled={!this.state.isCallEstablished} onClick={this.hangup}>Hangup</button>
            </div>
        )
    }
}

export default ReceiveCall;