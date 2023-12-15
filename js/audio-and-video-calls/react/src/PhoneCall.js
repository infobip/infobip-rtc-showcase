import React, {Component} from "react";
import {CallsApiEvent, createInfobipRtc, InfobipRTCEvent, PhoneCallOptions} from "infobip-rtc";
import httpClient from "axios";

class PhoneCall extends Component {

    constructor(props) {
        super(props);
        this.state = {
            title: 'Infobip RTC Call Showcase',
            destination: '',
            infobipRTC: null,
            activeCall: null,
            identity: '',
            status: '',
            audioInputDevices: [],
        };

        this.connectInfobipRTC();
    }

    connectInfobipRTC = async () => {
        httpClient.post('http://localhost:8080/token')
            .then((response) => {
                const token = response.data.token

                this.setState((state) => {
                    state.infobipRTC = createInfobipRtc(token, { debug: true });
                    state.infobipRTC.on(InfobipRTCEvent.CONNECTED,  (event) => {
                        this.setState({identity: event.identity});
                        console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    });
                    state.infobipRTC.on(InfobipRTCEvent.DISCONNECTED, function (event) {
                        console.warn('Disconnected from Infobip RTC Cloud.');
                    });
                    state.infobipRTC.connect();
                    this.loadAudioDevices();
                    return state;
                });
            })
            .catch(err => {
                console.error(err);
            });
    };

    loadAudioDevices = () => {
        this.state.infobipRTC.getAudioInputDevices().then(inputDevices => this.setState({audioInputDevices: inputDevices}));
    }

    setCallEventHandlers = (call) => {
        let that = this;
        call.on(CallsApiEvent.RINGING, function () {
            that.setState({status: 'Ringing...'});
            console.log('Call is ringing...');
        });
        call.on(CallsApiEvent.ESTABLISHED, function (event) {
            that.setState({status: 'Call established with: ' + that.state.activeCall.counterpart().identifier});
            console.log('Call established with ' + that.state.activeCall.counterpart().identifier);
            that.setMediaStream(that.refs.remoteAudio, event.stream);
        });
        call.on(CallsApiEvent.HANGUP, function (event) {
            that.setState({status: 'Call finished: ' + event.name});
            console.log('Call finished: ' + event.name);
            that.setMediaStream(that.refs.remoteAudio, null);
            that.setValuesAfterCall();
        });
        call.on(CallsApiEvent.ERROR, function (event) {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        });
    }

    setMediaStream = (element, stream) => {
        element.srcObject = stream;
    }

    handleChange = (event) => {
        const dest = event.target.value;
        this.setState({destination: dest});
    };

    callPhone = () => {
        if (this.state.destination) {
            let phoneCallOptions = PhoneCallOptions.builder()
                .setFrom('33712345678')
                .build();
            const activeCall = this.state.infobipRTC.callPhone(this.state.destination, phoneCallOptions);
            this.setCallEventHandlers(activeCall);
            this.setState({ activeCall: activeCall });
        }
    };

    hangup = () => {
        this.state.activeCall.hangup();
    };

    shouldDisableHangupButton = () => {
        return !this.state.activeCall || (!this.state.isCallEstablished && this.state.isIncomingCall);
    }

    setValuesAfterCall = () => {
        this.setState({
            activeCall: null,
            status: ''
        });
    }

    onAudioInputDeviceChange = async (event) => {
        const deviceId = event.target.value;
        const {activeCall} = this.state;
        if (!!activeCall) {
            await activeCall.setAudioInputDevice(deviceId);
        }
    }

    render = () => {
        const {
            title,
            identity,
            destination,
            activeCall,
            status,
            audioInputDevices,
        } = this.state;

        return (
            <div>
                <h2><span>{title}</span></h2>
                <h4>Logged as: <span>{identity}</span></h4>

                <audio ref="remoteAudio" autoPlay/>

                <input type="text" value={destination} onChange={this.handleChange}
                       placeholder="Enter phone number to call..."/>
                <br/> <br/>

                <button disabled={activeCall} onClick={() => this.callPhone()}>Call</button>

                <h4><span>{status}</span></h4>

                <button disabled={this.shouldDisableHangupButton()}
                        onClick={this.hangup}>Hangup
                </button>
                <br/><br/>

                {!!activeCall &&
                    <>
                        <label htmlFor={"audio-input-device-select"}>Choose audio input device:</label>
                        <br/>
                        <select id={"audio-input-device-select"} onChange={this.onAudioInputDeviceChange}>
                            {audioInputDevices.map(device => <option id={device.deviceId} value={device.deviceId}>{device.label || device.deviceId}</option>)}
                        </select>
                        <br/><br/>
                    </>
                }
            </div>
        )
    }
}

export default PhoneCall;
