import React, {Component} from "react";
import {
    CallsApiEvent,
    createInfobipRtc,
    InfobipRTCEvent,
    WebrtcCallOptions,
    NetworkQuality,
    AudioQualityMode
} from "infobip-rtc";
import httpClient from "axios";

const audioQualityModes = {
    "Low": AudioQualityMode.LOW_DATA,
    "Auto": AudioQualityMode.AUTO,
    "High": AudioQualityMode.HIGH_QUALITY
}

class WebrtcCall extends Component {

    constructor(props) {
        super(props);
        this.state = {
            title: 'Infobip RTC Call Showcase',
            destination: '',
            infobipRTC: null,
            activeCall: null,
            identity: '',
            status: '',
            isIncomingCall: false,
            isCallEstablished: false,
            isIphoneOrIpad: !!(window.navigator.userAgent.match(/iPad/i) || window.navigator.userAgent.match(/iPhone/i)),
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
                    state.infobipRTC = createInfobipRtc(token, {debug: true});
                    state.infobipRTC.on(InfobipRTCEvent.CONNECTED, event => {
                        this.setState({identity: event.identity});
                        console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    });
                    state.infobipRTC.on(InfobipRTCEvent.DISCONNECTED, event => {
                        console.warn('Disconnected from Infobip RTC Cloud.');
                    });
                    state.infobipRTC.connect();
                    this.listenForIncomingCall();
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

    listenForIncomingCall = () => {
        this.state.infobipRTC.on(InfobipRTCEvent.INCOMING_WEBRTC_CALL, incomingCallEvent => {
            const incomingCall = incomingCallEvent.incomingCall;
            console.log('Received incoming call from: ' + incomingCall.counterpart().identifier);

            this.setState({
                activeCall: incomingCall,
                isIncomingCall: true,
                status: 'Incoming ' + (incomingCall.options.video ? 'video' : 'audio') + ' call from: ' + incomingCall.counterpart().identifier
            });

            this.setCallEventHandlers(incomingCall);
        });
    }

    setCallEventHandlers = (call) => {
        call.on(CallsApiEvent.RINGING, () => {
            this.setState({status: 'Ringing...'});
            console.log('Call is ringing...');
        });
        call.on(CallsApiEvent.ESTABLISHED, event => {
            this.setState({
                status: 'Call established with: ' + this.state.activeCall.counterpart().identifier,
                isCallEstablished: true
            });
            console.log('Call established with ' + this.state.activeCall.counterpart().identifier);
            this.setMediaStream(this.refs.remoteAudio, event.stream);
        });
        call.on(CallsApiEvent.HANGUP, event => {
            this.setState({status: 'Call finished: ' + event.errorCode.name});
            console.log('Call finished: ' + event.errorCode.name);
            this.removeAllMediaStreams();
            this.setValuesAfterCall();
        });

        call.on(CallsApiEvent.ERROR, event => {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        });

        call.on(CallsApiEvent.CAMERA_VIDEO_ADDED, event => {
            this.setState({status: 'Local camera video has been added'});
            console.log('Local camera video has been added');
            this.setMediaStream(this.refs.localCameraVideo, event.stream);
        });
        call.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, event => {
            this.setState({status: 'Local camera video has been updated'});
            console.log('Local camera video has been updated');
            this.setMediaStream(this.refs.localCameraVideo, event.stream);
        });
        call.on(CallsApiEvent.CAMERA_VIDEO_REMOVED, () => {
            this.setState({status: 'Local camera video has been removed'});
            console.log('Local camera video has been removed');
            this.setMediaStream(this.refs.localCameraVideo, null);
        });

        call.on(CallsApiEvent.SCREEN_SHARE_ADDED, event => {
            this.setState({status: 'Local screenshare has been added'});
            console.log('Local screenshare has been added');
            this.setMediaStream(this.refs.localScreenShare, event.stream);
        });
        call.on(CallsApiEvent.SCREEN_SHARE_REMOVED, () => {
            this.setState({status: 'Local screenshare has been removed'});
            console.log('Local screenshare has been removed');
            this.setMediaStream(this.refs.localScreenShare, null);
        });

        call.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_ADDED, event => {
            this.setState({status: 'Remote camera video has been added'});
            console.log('Remote camera video has been added');
            this.setMediaStream(this.refs.remoteCameraVideo, event.stream);
        });
        call.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_REMOVED, () => {
            this.setState({status: 'Remote camera video has been removed'});
            console.log('Remote camera video has been removed');
            this.setMediaStream(this.refs.remoteCameraVideo, null);
        });

        call.on(CallsApiEvent.REMOTE_SCREEN_SHARE_ADDED, event => {
            this.setState({status: 'Remote screenshare has been added'});
            console.log('Remote screenshare has been added');
            this.setMediaStream(this.refs.remoteScreenShare, event.stream);
        });
        call.on(CallsApiEvent.REMOTE_SCREEN_SHARE_REMOVED, () => {
            this.setState({status: 'Remote screenshare has been removed'});
            console.log('Remote screenshare has been removed');
            this.setMediaStream(this.refs.remoteScreenShare, null);
        });

        call.on(CallsApiEvent.REMOTE_MUTED, () => {
            this.setState({status: 'Remote participant has been muted'});
            console.log('Remote participant has been muted');
        });
        call.on(CallsApiEvent.REMOTE_UNMUTED, () => {
            this.setState({status: 'Remote participant has been unmuted'});
            console.log('Remote participant has been unmuted');
        });

        call.on(CallsApiEvent.NETWORK_QUALITY_CHANGED, event => {
            console.log('Local network quality has changed: ' + NetworkQuality[event.networkQuality]);
        });
        call.on(CallsApiEvent.REMOTE_NETWORK_QUALITY_CHANGED, event => {
            console.log('Remote network quality has changed: ' + NetworkQuality[event.networkQuality]);
        });
    }

    setMediaStream = (element, stream) => {
        element.srcObject = stream;
    }

    removeAllMediaStreams = () => {
        this.refs.localCameraVideo.srcObject = null;
        this.refs.localScreenShare.srcObject = null;
        this.refs.remoteCameraVideo.srcObject = null;
        this.refs.remoteScreenShare.srcObject = null;
        this.refs.remoteAudio.srcObject = null;
    }

    handleChange = event => {
        const dest = event.target.value;
        this.setState({destination: dest});
    };

    call = (video = false) => {
        if (this.state.destination) {
            let webrtcCallOptions = WebrtcCallOptions.builder()
                .setVideo(video)
                .build();

            const activeCall = this.state.infobipRTC.callWebrtc(this.state.destination, webrtcCallOptions);
            this.setCallEventHandlers(activeCall);
            this.setState({activeCall: activeCall});
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

    shouldShowButtonsOnIncomingCall = () => {
        return this.state.isIncomingCall && !this.state.isCallEstablished;
    }

    shouldDisableHangupButton = () => {
        return !this.state.activeCall || (!this.state.isCallEstablished && this.state.isIncomingCall);
    }

    hasLocalVideos = () => {
        return this.state.activeCall && (this.state.activeCall.hasCameraVideo() || this.state.activeCall.hasScreenShare());
    }

    hasRemoteVideos = () => {
        return this.state.activeCall && (this.state.activeCall.hasRemoteCameraVideo() || this.state.activeCall.hasRemoteScreenShare());
    }

    setValuesAfterCall = () => {
        this.setState({
            activeCall: null,
            isCallEstablished: false,
            isIncomingCall: false,
            status: '',
            selectedAudioQualityMode: "Auto"
        });
    }

    onAudioInputDeviceChange = async event => {
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
            activeCall.setAudioQualityMode(audioQualityModes[audioQuality]);
        }
    }

    render = () => {
        const {
            title,
            identity,
            destination,
            activeCall,
            status,
            isIphoneOrIpad,
            audioInputDevices,
            selectedAudioQualityMode
        } = this.state;

        return (
            <div>
                <h2><span>{title}</span></h2>
                <h4>Logged as: <span>{identity}</span></h4>

                <audio ref="remoteAudio" autoPlay/>

                <input type="text" value={destination} onChange={this.handleChange}
                       placeholder="Enter destination to call..."/>
                <br/> <br/>

                <button disabled={activeCall} onClick={() => this.call(false)}>Call</button>
                <button disabled={activeCall} onClick={() => this.call(true)}>Video Call</button>
                <br/><br/>

                <button disabled={!activeCall}
                        onClick={() => activeCall.cameraVideo(!activeCall.hasCameraVideo())}>
                    Toggle Camera Video
                </button>
                <button disabled={!activeCall}
                        onClick={() => activeCall.screenShare(!activeCall.hasScreenShare())}>
                    Toggle Screen Share
                </button>

                <h4><span>{status}</span></h4>

                {this.shouldShowButtonsOnIncomingCall() &&
                    <div>
                        <button onClick={this.accept}>Accept</button>
                        <button onClick={this.decline}>Decline</button>
                        <br/><br/>
                    </div>}

                <button disabled={this.shouldDisableHangupButton()}
                        onClick={this.hangup}>Hangup
                </button>
                <br/><br/>

                {isIphoneOrIpad && (<button onClick={() => {
                    this.refs.remoteVideo.muted = false
                }}>Tap to Unmute</button>)}

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

                <div hidden={this.hasRemoteVideos() ? '' : 'hidden'}>
                    <h3>Remote video/screenshare</h3>
                    <video ref="remoteCameraVideo" autoPlay
                           muted={isIphoneOrIpad}
                           style={{"objectFit": "cover"}}
                           width="300" height="300">
                    </video>
                    <video ref="remoteScreenShare" autoPlay
                           style={{"objectFit": "cover"}}
                           width="300" height="300">
                    </video>
                </div>

                <div hidden={this.hasLocalVideos() ? '' : 'hidden'}>
                    <h3>Local video/screenshare</h3>
                    <video ref="localCameraVideo" autoPlay muted
                           style={{"objectFit": "cover"}}
                           width="300" height="300">
                    </video>
                    <video ref="localScreenShare" autoPlay
                           style={{"objectFit": "cover"}}
                           width="300" height="300">
                    </video>
                </div>
            </div>
        )
    }
}

export default WebrtcCall;
