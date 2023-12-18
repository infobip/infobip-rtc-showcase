import React, {Component} from "react";
import {AudioQualityMode, CallsApiEvent, createInfobipRtc, InfobipRTCEvent, PhoneCallOptions} from "infobip-rtc";
import httpClient from "axios";

const audioQualityModes = {
    "Low": AudioQualityMode.LOW_DATA,
    "Auto": AudioQualityMode.AUTO,
    "High": AudioQualityMode.HIGH_QUALITY
}

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
            selectedAudioQualityMode: "Auto"
        };

        this.connectInfobipRTC();
    }

    connectInfobipRTC = async () => {
        httpClient.post('http://localhost:8080/token')
            .then((response) => {
                const token = response.data.token

                this.setState((state) => {
                    state.infobipRTC = createInfobipRtc(token, { debug: true });
                    state.infobipRTC.on(InfobipRTCEvent.CONNECTED, event => {
                        this.setState({identity: event.identity});
                        console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    });
                    state.infobipRTC.on(InfobipRTCEvent.DISCONNECTED, event => {
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
        call.on(CallsApiEvent.RINGING, () => {
            this.setState({status: 'Ringing...'});
            console.log('Call is ringing...');
        });
        call.on(CallsApiEvent.ESTABLISHED, event => {
            this.setState({status: 'Call established with: ' + this.state.activeCall.counterpart().identifier});
            console.log('Call established with ' + this.state.activeCall.counterpart().identifier);
            this.setMediaStream(this.refs.remoteAudio, event.stream);
        });
        call.on(CallsApiEvent.HANGUP, event => {
            this.setState({status: 'Call finished: ' + event.name});
            console.log('Call finished: ' + event.name);
            this.setMediaStream(this.refs.remoteAudio, null);
            this.setValuesAfterCall();
        });
        call.on(CallsApiEvent.ERROR, event => {
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
            status: '',
            selectedAudioQualityMode: "Auto"
        });
    }

    onAudioInputDeviceChange = async (event) => {
        const deviceId = event.target.value;
        const {activeCall} = this.state;
        if (!!activeCall) {
            await activeCall.setAudioInputDevice(deviceId);
        }
    }

    onAudioQualityChange = event => {
        const audioQuality = event.target.value;
        const {activeCall} = this.state;
        this.setState({selectedAudioQualityMode: audioQuality});

        if (!!activeCall) {
            activeCall.audioQualityMode(audioQualityModes[audioQuality]);
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
            selectedAudioQualityMode
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

                        <label htmlFor={"audio-input-device-select"}>Choose audio quality mode:</label>
                        <br/>
                        <select id={"audio-input-device-select"} onChange={this.onAudioQualityChange} value={selectedAudioQualityMode}>
                            {Object.keys(audioQualityModes).map(mode => <option id={mode} value={mode}>{mode}</option>)}
                        </select>
                        <br/><br/>
                    </>
                }
            </div>
        )
    }
}

export default PhoneCall;
