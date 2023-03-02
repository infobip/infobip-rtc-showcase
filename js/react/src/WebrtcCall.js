import React, {Component} from "react";
import {CallsApiEvent, createInfobipRtc, WebrtcCallOptions} from "infobip-rtc";
import httpClient from "axios";

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
            isIphoneOrIpad: !!(window.navigator.userAgent.match(/iPad/i) || window.navigator.userAgent.match(/iPhone/i))
        };

        this.connectInfobipRTC();
    }

    connectInfobipRTC = async () => {
        httpClient.post('http://localhost:8080/token')
            .then((response) => {
                const token = response.data.token

                this.setState((state) => {
                    state.infobipRTC = createInfobipRtc(token, { debug: true });
                    state.infobipRTC.on('connected',  (event) => {
                        this.setState({identity: event.identity});
                        console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    });
                    state.infobipRTC.on('disconnected', function (event) {
                        console.warn('Disconnected from Infobip RTC Cloud.');
                    });
                    state.infobipRTC.connect();
                    this.listenForIncomingCall();
                    return state;
                });
            })
            .catch(err => {
                console.error(err);
            });
    };

    listenForIncomingCall = () => {
        let that = this;
        this.state.infobipRTC.on('incoming-webrtc-call', function (incomingCallEvent) {
            const incomingCall = incomingCallEvent.incomingCall;
            console.log('Received incoming call from: ' + incomingCall.counterpart().identifier);

            that.setState({
                activeCall: incomingCall,
                isIncomingCall: true,
                status: 'Incoming ' + (incomingCall.options.video ? 'video' : 'audio') + ' call from: ' + incomingCall.counterpart().identifier
            });

            that.setCallEventHandlers(incomingCall);
        });
    }

    setCallEventHandlers = (call) => {
        let that = this;
        call.on(CallsApiEvent.RINGING, function () {
            that.setState({status: 'Ringing...'});
            console.log('Call is ringing...');
        });
        call.on(CallsApiEvent.ESTABLISHED, function (event) {
            that.setState({
                status: 'Call established with: ' + that.state.activeCall.counterpart().identifier,
                isCallEstablished: true
            });
            console.log('Call established with ' + that.state.activeCall.counterpart().identifier);
            that.setMediaStream(that.refs.remoteAudio, event.stream);
        });
        call.on(CallsApiEvent.HANGUP, function (event) {
            that.setState({status: 'Call finished: ' + event.errorCode.name});
            console.log('Call finished: ' + event.errorCode.name);
            that.removeAllMediaStreams();
            that.setValuesAfterCall();
        });

        call.on(CallsApiEvent.ERROR, function (event) {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        });

        call.on(CallsApiEvent.CAMERA_VIDEO_ADDED, function (event) {
            that.setState({status: 'Local camera video has been added'});
            console.log('Local camera video has been added');
            that.setMediaStream(that.refs.localCameraVideo, event.stream);
        });
        call.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, function (event) {
            that.setState({status: 'Local camera video has been updated'});
            console.log('Local camera video has been updated');
            that.setMediaStream(that.refs.localCameraVideo, event.stream);
        });
        call.on(CallsApiEvent.CAMERA_VIDEO_REMOVED, function () {
            that.setState({status: 'Local camera video has been removed'});
            console.log('Local camera video has been removed');
            that.setMediaStream(that.refs.localCameraVideo, null);
        });

        call.on(CallsApiEvent.SCREEN_SHARE_ADDED, function (event) {
            that.setState({status: 'Local screenshare has been added'});
            console.log('Local screenshare has been added');
            that.setMediaStream(that.refs.localScreenShare, event.stream);
        });
        call.on(CallsApiEvent.SCREEN_SHARE_REMOVED, function () {
            that.setState({status: 'Local screenshare has been removed'});
            console.log('Local screenshare has been removed');
            that.setMediaStream(that.refs.localScreenShare, null);
        });

        call.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_ADDED, function (event) {
            that.setState({status: 'Remote camera video has been added'});
            console.log('Remote camera video has been added');
            that.setMediaStream(that.refs.remoteCameraVideo, event.stream);
        });
        call.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_REMOVED, function () {
            that.setState({status: 'Remote camera video has been removed'});
            console.log('Remote camera video has been removed');
            that.setMediaStream(that.refs.remoteCameraVideo, null);
        });

        call.on(CallsApiEvent.REMOTE_SCREEN_SHARE_ADDED, function (event) {
            that.setState({status: 'Remote screenshare has been added'});
            console.log('Remote screenshare has been added');
            that.setMediaStream(that.refs.remoteScreenShare, event.stream);
        });
        call.on(CallsApiEvent.REMOTE_SCREEN_SHARE_REMOVED, function () {
            that.setState({status: 'Remote screenshare has been removed'});
            console.log('Remote screenshare has been removed');
            that.setMediaStream(that.refs.remoteScreenShare, null);
        });

        call.on(CallsApiEvent.REMOTE_MUTED, function () {
            that.setState({status: 'Remote participant has been muted'});
            console.log('RRemote participant has been muted');
        });
        call.on(CallsApiEvent.REMOTE_UNMUTED, function () {
            that.setState({status: 'Remote participant has been unmuted'});
            console.log('Remote participant has been unmuted');
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

    handleChange = (event) => {
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
            status: ''
        });
    }

    render = () => {
        return (
            <div>
                <h2><span>{this.state.title}</span></h2>
                <h4>Logged as: <span>{this.state.identity}</span></h4>

                <audio ref="remoteAudio" autoPlay/>

                <input type="text" value={this.state.destination} onChange={this.handleChange}
                       placeholder="Enter destination to call..."/>
                <br/> <br/>

                <button disabled={this.state.activeCall} onClick={() => this.call(false)}>Call</button>
                <button disabled={this.state.activeCall} onClick={() => this.call(true)}>Video Call</button>
                <br/><br/>

                <button disabled={!this.state.activeCall}
                        onClick={() => this.state.activeCall.cameraVideo(!this.state.activeCall.hasCameraVideo())}>
                    Toggle Camera Video</button>
                <button disabled={!this.state.activeCall}
                        onClick={() => this.state.activeCall.screenShare(!this.state.activeCall.hasScreenShare())}>
                        Toggle Screen Share</button>

                <h4><span>{this.state.status}</span></h4>

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

                {this.state.isIphoneOrIpad && (<button onClick={() => { this.refs.remoteVideo.muted = false }}>Tap to Unmute</button>)}

                <div hidden={this.hasRemoteVideos() ? '' : 'hidden'}>
                    <h3>Remote video/screenshare</h3>
                    <video ref="remoteCameraVideo" autoPlay
                           muted={this.state.isIphoneOrIpad}
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