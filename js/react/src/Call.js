import React, {Component} from "react";
import {InfobipRTC} from "infobip-rtc";
import httpClient from "axios";

class Call extends Component {

    constructor(props) {
        super(props);
        this.state = {
            destination: '',
            infobipRTC: null,
            activeCall: null
        };

        this.connectInfobipRTC('callTest');
    }

    connectInfobipRTC = async (identity) => {
        let that = this;
        httpClient.post('/token', { identity: identity })
            .then((response) => {
                that.setState((state) => {
                    state.infobipRTC = new InfobipRTC(response.data.token, {debug: true});
                    state.infobipRTC.on('connected', function (event) {
                        console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    });
                    state.infobipRTC.on('disconnected', function (event) {
                        console.warn('Disconnected from Infobip RTC Cloud.');
                    });
                    state.infobipRTC.connect();
                    return state;
                });
            });
    };

    listenForCallEvents() {
        if (this.state.activeCall) {
            let that = this;
            this.state.activeCall.on('established', function (event) {
                console.log('Call established with ' + that.state.destination);
                that.refs.remoteAudio.srcObject = event.remoteStream;
            });
            this.state.activeCall.on('hangup', function (event) {
                that.setState((state) => {
                    state.activeCall = null;
                    return state;
                });
            });
            this.state.activeCall.on('ringing', function () {
                console.log('Call is ringing...');
            });
            this.state.activeCall.on('error', function (event) {
                console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
            });
        }
    }

    handleChange = (event) => {
        var dest = event.target.value;
        this.setState((state) => {
            state.destination = dest;
            return state;
        });
    };

    call = () => {
        if(this.state.destination) {
            this.setState((state) => {
                state.activeCall = this.state.infobipRTC.call(this.state.destination, {});
                this.listenForCallEvents();
                return state;
            });
        }
    };

    callPhoneNumber = () => {
        if(this.state.destination) {
            this.setState((state) => {
                state.activeCall = this.state.infobipRTC.callPhoneNumber(this.state.destination, {from: '38761225883'});
                this.listenForCallEvents();
                return state;
            });
        }
    };

    hangup = () => {
        this.state.activeCall.hangup();
    };

    render() {
        return (
            <div>
                <h2> Infobip RTC Showcase </h2>
                <h3>Basic Call</h3>
                <audio ref="remoteAudio" autoPlay> </audio>
                <input type="text" value={this.state.destination} onChange={this.handleChange} placeholder="Enter destination to call..." />
                <br/> <br/>
                <button disabled={this.state.activeCall} onClick={this.call}>Call</button>
                <button disabled={this.state.activeCall} onClick={this.callPhoneNumber}>Call Phone Number</button>
                <br/><br/>
                <button disabled={!this.state.activeCall} onClick={this.hangup}>Hangup</button>
            </div>
        )
    }
}
export default Call;