import React, {Component} from "react";
import {
    CallsApiEvent,
    createInfobipRtc,
    InfobipRTCEvent,
    RoomCallOptions,
    NetworkQuality,
    AudioQualityMode
} from "infobip-rtc";
import httpClient from "axios";

const audioQualityModes = {
    "Low": AudioQualityMode.LOW_DATA,
    "Auto": AudioQualityMode.AUTO,
    "High": AudioQualityMode.HIGH_QUALITY
}

class RoomCall extends Component {

    constructor(props) {
        super(props);
        this.state = {
            title: 'Infobip RTC Room Showcase',
            roomName: '',
            infobipRTC: null,
            activeRoomCall: null,
            participants: [],
            identity: '',
            status: '',
            hasLocalVideo: false,
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

    join = (video = false) => {
        if (this.state.roomName) {
            const roomCallOptions = RoomCallOptions.builder()
                .setVideo(video)
                .setAutoReconnect(true)
                .build();

            const activeRoomCall = this.state.infobipRTC.joinRoom(this.state.roomName, roomCallOptions);
            this.setRoomCallEventHandlers(activeRoomCall);
            this.setState({ activeRoomCall: activeRoomCall });
        }
    };

    setRoomCallEventHandlers = (roomCall) => {
        roomCall.on(CallsApiEvent.ROOM_JOINED, event => {
            this.setState({status: 'Joined room: ' + this.state.roomName});
            console.log('Joined room: ' + this.state.roomName);
            this.setMediaStream(this.refs.remoteAudio, event.stream);
            event.participants.forEach(participant => this.addParticipant(participant.endpoint.identifier));
        });
        roomCall.on(CallsApiEvent.ROOM_LEFT, event => {
            this.setState({status: 'Left room: ' + event.errorCode.name});
            console.log('Left room: ' + event.errorCode.name);
            this.setValuesAfterLeavingRoom();
        });

        roomCall.on(CallsApiEvent.RECONNECTING, () => {
            this.setState({status: 'Reconnecting...'});
            console.log('Reconnecting...');
        });
        roomCall.on(CallsApiEvent.RECONNECTED, () => {
            this.setState({status: 'Joined room: ' + this.state.roomName});
            console.log('Reconnected');
        });
        roomCall.on(CallsApiEvent.PARTICIPANT_DISCONNECTED, event => {
            console.log('Participant ' + event.participant.endpoint.identifier + ' disconnected');
        });
        roomCall.on(CallsApiEvent.PARTICIPANT_RECONNECTED, event => {
            console.log('Participant ' + event.participant.endpoint.identifier + ' reconnected');
        });

        roomCall.on(CallsApiEvent.PARTICIPANT_JOINING, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is joining room'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is joining room');
        });
        roomCall.on(CallsApiEvent.PARTICIPANT_JOINED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' joined room'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' joined room');
            this.addParticipant(event.participant.endpoint.identifier);

        });
        roomCall.on(CallsApiEvent.PARTICIPANT_LEFT, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' left room'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' left room');
            this.removeParticipant(event.participant.endpoint.identifier);
        });

        roomCall.on(CallsApiEvent.PARTICIPANT_MUTED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is now muted'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is now muted');
        });
        roomCall.on(CallsApiEvent.PARTICIPANT_UNMUTED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is now unmuted'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is now unmuted');
        });

        roomCall.on(CallsApiEvent.CAMERA_VIDEO_ADDED, event => {
            this.setState({status: 'Participant added local camera video'});
            console.log('Participant added local camera video');
            this.setMediaStream(this.refs.localCameraVideo, event.stream);
        });
        roomCall.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, event => {
            this.setState({status: 'Participant updated local camera video'});
            console.log('Participant updated local camera video');
            this.setMediaStream(this.refs.localCameraVideo, event.stream);
        });
        roomCall.on(CallsApiEvent.CAMERA_VIDEO_REMOVED, () => {
            this.setState({status: 'Participant removed local camera video'});
            console.log('Participant removed local camera video');
            this.setMediaStream(this.refs.localCameraVideo, null);
        });
        roomCall.on(CallsApiEvent.SCREEN_SHARE_ADDED, event => {
            this.setState({status: 'Participant added local screenshare'});
            console.log('Participant added local screenshare');
            this.setMediaStream(this.refs.localScreenShare, event.stream);
        });
        roomCall.on(CallsApiEvent.SCREEN_SHARE_REMOVED, () => {
            this.setState({status: 'Participant removed local screenshare'});
            console.log('Participant removed local screenshare');
            this.setMediaStream(this.refs.localScreenShare, null);
        });

        roomCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_ADDED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' added camera video'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' added camera video');
            this.updateParticipant(event.participant.endpoint.identifier, {camera: event.stream});
        });
        roomCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_REMOVED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' removed camera video'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' removed camera video');
            this.updateParticipant(event.participant.endpoint.identifier, {camera: null});
        });
        roomCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_ADDED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' added screenshare'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' added screenshare');
            this.updateParticipant(event.participant.endpoint.identifier, {screenShare: event.stream});
        });
        roomCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_REMOVED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' removed screenshare'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' removed screenshare');
            this.updateParticipant(event.participant.endpoint.identifier, {screenShare: null});
        });

        roomCall.on(CallsApiEvent.NETWORK_QUALITY_CHANGED, event => {
            console.log('Local network quality has changed: ' + NetworkQuality[event.networkQuality]);
        });
        roomCall.on(CallsApiEvent.PARTICIPANT_NETWORK_QUALITY_CHANGED, event => {
            console.log('Network quality of ' + event.participant.endpoint.identifier + ' has changed: ' + NetworkQuality[event.networkQuality]);
        });

        roomCall.on(CallsApiEvent.ERROR, event => {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        });
    };

    leave = () => {
        this.state.activeRoomCall.leave();
    };

    toggleScreenShare = () => {
        this.state.activeRoomCall.screenShare(!this.state.activeRoomCall.hasScreenShare())
            .catch(error => console.log('Error toggling screen share {}', error));
    }

    toggleCameraVideo = () => {
        this.state.activeRoomCall.cameraVideo(!this.state.activeRoomCall.hasCameraVideo())
            .catch(error => console.log('Error toggling camera video {}', error));
    }

    setMediaStream = (element, stream) => {
        element.srcObject = stream;

        this.setState({hasLocalVideo:
                (this.state.activeRoomCall && (this.state.activeRoomCall.hasCameraVideo() || this.state.activeRoomCall.hasScreenShare()))
        });
    }

    setValuesAfterLeavingRoom = () => {
        this.setState({
            status: null,
            activeRoomCall: null,
            participants: [],
            hasLocalVideo: false,
            selectedAudioQualityMode: "Auto"
        });
    }

    handleChange = (event) => {
        const roomName = event.target.value;
        this.setState({roomName: roomName});
    };

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

    onAudioInputDeviceChange = async (event) => {
        const deviceId = event.target.value;
        const {activeRoomCall} = this.state;
        if (!!activeRoomCall) {
            await activeRoomCall.setAudioInputDevice(deviceId)
        }
    }

    onAudioQualityChange = event => {
        const audioQuality = event.target.value;
        const {activeRoomCall} = this.state;
        this.setState({selectedAudioQualityMode: audioQuality});

        if (!!activeRoomCall) {
            activeRoomCall.setAudioQualityMode(audioQualityModes[audioQuality]);
        }
    }

    render = () => {
        const {
            title,
            status,
            identity,
            roomName,
            activeRoomCall,
            audioInputDevices,
            hasLocalVideo,
            participants,
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
                <h2><span>{title}</span></h2>
                <h4>Logged as: <span>{identity}</span></h4>

                <audio ref="remoteAudio" autoPlay/>

                <input type="text" value={roomName} onChange={this.handleChange}
                       placeholder="Enter room name"/>
                <br/><br/>

                <button disabled={activeRoomCall} onClick={() => this.join(false)}>Join</button>
                <button disabled={activeRoomCall} onClick={() => this.join(true)}>Join with Video</button>
                <button disabled={!activeRoomCall} onClick={() => this.leave()}>Leave</button>
                <br/><br/>

                <button disabled={!activeRoomCall} onClick={() => this.toggleCameraVideo()}>Toggle Camera Video</button>
                <button disabled={!activeRoomCall} onClick={() => this.toggleScreenShare()}>Toggle Screen Share</button>
                <br/><br/>

                {!!activeRoomCall &&
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

                <div hidden={activeRoomCall && remoteVideos.length > 0 ? '' : 'hidden'}>
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

                <div hidden={hasLocalVideo ? '' : 'hidden'}>
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

export default RoomCall;
