import React, {Component} from "react";
import {
    ApplicationCallOptions,
    AudioQualityMode,
    CallsApiEvent,
    createInfobipRtc,
    InfobipRTCEvent,
    NetworkQuality
} from "infobip-rtc";
import httpClient from "axios";
import config from "./config.json";

const audioQualityModes = {
    'Low': AudioQualityMode.LOW_DATA,
    'Auto': AudioQualityMode.AUTO,
    'High': AudioQualityMode.HIGH_QUALITY
}

class Customer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            infobipRTC: null,
            activeCall: null,
            identity: '',
            status: '',
            participants: [],
            selectedAudioQualityMode: 'Auto'
        };

        this.connectInfobipRTC();
    }

    connectInfobipRTC = async () => {
        httpClient.post('http://localhost:8080/token')
            .then(response => {
                const token = response.data.token

                this.setState(state => {
                    state.infobipRTC = createInfobipRtc(token, { debug: true });
                    state.infobipRTC.on(InfobipRTCEvent.CONNECTED,  event => {
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
        this.state.infobipRTC.getAudioInputDevices().then(inputDevices => this.setState({audioInputDevices: inputDevices}))
    }

    listenForApplicationCallEvents = call => {
        call.on(CallsApiEvent.RINGING, () => {
            this.setState({status: 'Ringing...'});
            console.log('Call is ringing...');
        });
        call.on(CallsApiEvent.ESTABLISHED, event => {
            this.setState({status: 'Established...'});
            console.log('Call is established...');
            this.setMediaStream(this.refs.remoteAudio, event.stream);
        });
        call.on(CallsApiEvent.HANGUP, event => {
            this.setState({status: 'Call finished, errorCode: ' + event.errorCode.name});
            console.log('Call finished, errorCode: ' + event.errorCode.name);
            this.setValuesAfterCall();
        });
        call.on(CallsApiEvent.ERROR, event => {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        });

        call.on(CallsApiEvent.CONFERENCE_JOINED, event => {
            this.setState({status: 'Joined conference, conferenceId: ' + event.id});
            console.log('Joined conference, conferenceId: ' + event.id);
            event.participants.forEach(participant => this.addParticipant(participant.endpoint.identifier));
        });
        call.on(CallsApiEvent.CONFERENCE_LEFT, event => {
            this.setState({status: 'Left conference, errorCode: ' + event.errorCode.name});
            console.log('Left conference, errorCode: ' + event.errorCode.name);
            this.setValuesAfterLeavingConferenceOrDialog();
        });
        call.on(CallsApiEvent.DIALOG_JOINED, event => {
            this.setState({status: 'Joined dialog, dialogId: ' + event.id});
            console.log('Joined dialog, dialogId: ' + event.id);
            this.addParticipant(event.remote.endpoint.identifier);
        });
        call.on(CallsApiEvent.DIALOG_LEFT, event => {
            this.setState({status: 'Left dialog, errorCode: ' + event.errorCode.name});
            console.log('Left dialog, errorCode: ' + event.errorCode.name);
            this.setValuesAfterLeavingConferenceOrDialog();
        });

        call.on(CallsApiEvent.PARTICIPANT_JOINING, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is joining'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is joining');
        });
        call.on(CallsApiEvent.PARTICIPANT_JOINED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' joined'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' joined');
            this.addParticipant(event.participant.endpoint.identifier);
        });
        call.on(CallsApiEvent.PARTICIPANT_LEFT, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' left'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' left');
            this.removeParticipant(event.participant.endpoint.identifier);
        });

        call.on(CallsApiEvent.PARTICIPANT_MUTED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is now muted'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is now muted');
        });
        call.on(CallsApiEvent.PARTICIPANT_UNMUTED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is now unmuted'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is now unmuted');
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

        call.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_ADDED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' added camera video'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' added camera video');
            this.updateParticipant(event.participant.endpoint.identifier, {camera: event.stream});
        });
        call.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_REMOVED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' removed camera video'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' removed camera video');
            this.updateParticipant(event.participant.endpoint.identifier, {camera: null});
        });
        call.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_ADDED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' added screenshare'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' added screenshare');
            this.updateParticipant(event.participant.endpoint.identifier, {screenShare: event.stream});
        });
        call.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_REMOVED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' removed screenshare'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' removed screenshare');
            this.updateParticipant(event.participant.endpoint.identifier, {screenShare: null});
        });

        call.on(CallsApiEvent.NETWORK_QUALITY_CHANGED, event => {
            console.log('Local network quality has changed: ' + NetworkQuality[event.networkQuality]);
        });
        call.on(CallsApiEvent.PARTICIPANT_NETWORK_QUALITY_CHANGED, event => {
            console.log('Network quality of ' + event.participant.endpoint.identifier + ' has changed: ' + NetworkQuality[event.networkQuality]);
        });
    }

    videoCallWithAgent = () => {
        const applicationCallOptions = ApplicationCallOptions.builder()
            .setVideo(true)
            .setCustomData({scenario: 'conference'})
            .build();

        const activeCall = this.state.infobipRTC.callApplication(config.INFOBIP_CALLS_CONFIGURATION_ID, applicationCallOptions);

        this.listenForApplicationCallEvents(activeCall);
        this.setState({ activeCall: activeCall });
    };

    phoneCall = () => {
        const applicationCallOptions = ApplicationCallOptions.builder()
            .setVideo(false)
            .setCustomData({scenario: 'dialog'})
            .build();

        const activeCall = this.state.infobipRTC.callApplication(config.INFOBIP_CALLS_CONFIGURATION_ID, applicationCallOptions);

        this.listenForApplicationCallEvents(activeCall);
        this.setState({ activeCall: activeCall });
    };

    hangup = () => {
        this.state.activeCall.hangup();
    };

    setValuesAfterCall = () => {
        this.setState({
            activeCall: null,
            status: '',
            selectedAudioQualityMode: 'Auto'
        });
    }

    setValuesAfterLeavingConferenceOrDialog = () => {
        this.participants = [];
    }

    setMediaStream = (element, stream) => {
        element.srcObject = stream;
    }

    addParticipant = (identifier) =>
        this.setState(({participants}) => ({participants: [...participants, {identifier}]}));

    removeParticipant = identifier =>
        this.setState(({participants}) => ({participants: participants.filter(participant => participant.identifier !== identifier)}));

    updateParticipant = (identifier, fields) => {
        this.setState(({participants}) => {
            let participant = participants.find(participant => participant.identifier === identifier);
            if (participant) Object.assign(participant, fields);
            return {participants};
        });
    }

    setVideo = (element, stream) => {
        if (!element) return;
        if (stream && element.srcObject !== stream) {
            element.srcObject = stream;
        }
    }

    toggleScreenShare = () => {
        this.state.activeCall.screenShare(!this.state.activeCall.hasScreenShare())
            .catch(error => console.log('Error toggling screen share {}', error));
    }

    toggleCameraVideo = () => {
        this.state.activeCall.cameraVideo(!this.state.activeCall.hasCameraVideo())
            .catch(error => console.log('Error toggling camera video {}', error));
    }

    hasLocalVideos = () => {
        return this.state.activeCall && (this.state.activeCall.hasCameraVideo() || this.state.activeCall.hasScreenShare());
    }

    shouldShowVideoActions = () => {
        return this.state.activeCall && this.state.activeCall.customData().scenario === 'conference';
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
            participants,
            identity,
            activeCall,
            status,
            audioInputDevices,
            selectedAudioQualityMode
        } = this.state;


        let remoteVideos = participants.reduce((remoteVideos, participant) => [
            ...[
                {participant, video: participant.camera},
                {participant, video: participant.screenShare}
            ].filter(({video}) => video != null),
            ...remoteVideos
        ], []);

        return (
            <div>
                <h4>Logged-in as: <span>{identity}</span></h4>

                <audio ref="remoteAudio" autoPlay/>

                <div hidden={activeCall}>
                    <button onClick={() => this.videoCallWithAgent()}>Video call with agent</button>
                    <button onClick={() => this.phoneCall()}>Phone call</button>
                    <br/><br/>
                </div>

                <div hidden={!this.shouldShowVideoActions()}>
                    <button onClick={() => this.toggleCameraVideo()}>Toggle Camera Video</button>
                    <button onClick={() => this.toggleScreenShare()}>Toggle Screen Share</button>
                    <br/><br/>
                </div>

                <div hidden={!activeCall}>
                    <button onClick={() => this.hangup()}>Hangup</button>
                    <br/><br/>
                </div>

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

                <h4><span>{status}</span></h4>
                <br/><br/>

                <div hidden={activeCall && remoteVideos.length > 0 ? '' : 'hidden'}>
                    <h3>Remote videos/screenshares</h3>
                    {remoteVideos.map(({video}) => {
                        return (
                            <video
                                ref={element => this.setVideo(element, video)}
                                width="300" height="300"
                                style={{"objectFit": "cover"}}
                                autoPlay/>
                        )}
                    )}
                </div>

                <div hidden={this.hasLocalVideos() ? '' : 'hidden'}>
                    <h3>Local video/screenshare</h3>
                    <video width="300" height="300"
                           style={{"objectFit": "cover"}}
                           autoPlay
                           ref="localCameraVideo"/>
                    <video width="300" height="300"
                           style={{"objectFit": "cover"}}
                           autoPlay
                           ref="localScreenShare"/>
                    <br/><br/>
                </div>
            </div>
        )
    }
}

export default Customer;
