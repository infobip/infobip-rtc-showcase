import React, {Component} from "react";
import {ApplicationCallOptions, CallsApiEvent, createInfobipRtc, InfobipRTCEvent, NetworkQuality} from "infobip-rtc";
import httpClient from "axios";

class Agent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            infobipRTC: null,
            activeCall: null,
            identity: '',
            status: '',
            isIncomingCall: false,
            isCallEstablished: false,
            participants: []
        };

        this.connectInfobipRTC();
    }

    connectInfobipRTC = async () => {
        httpClient.post('http://localhost:8080/token/agent')
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
                    this.listenForIncomingApplicationCall();
                    return state;
                });
            })
            .catch(err => {
                console.error(err);
            });
    };

    listenForIncomingApplicationCall = () => {
        let that = this;
        this.state.infobipRTC.on(InfobipRTCEvent.INCOMING_APPLICATION_CALL, function (incomingApplicationCallEvent) {
            const incomingCall = incomingApplicationCallEvent.incomingCall;
            console.log('Received incoming call from: ' + incomingCall.from());

            that.setState({
                activeCall: incomingCall,
                isIncomingCall: true,
                status: 'Incoming ' + (incomingCall.options.video ? 'video' : 'audio') + ' call from: ' + incomingCall.from()
            });

            that.setApplicationCallEventHandlers(incomingCall);
        });
    }

    setApplicationCallEventHandlers = (call) => {
        let that = this;
        call.on(CallsApiEvent.RINGING, function () {
            that.setState({status: 'Ringing...'});
            console.log('Call is ringing...');
        });
        call.on(CallsApiEvent.ESTABLISHED, function (event) {
            that.setState({status: 'Established...'});
            console.log('Call is established...');
            that.setMediaStream(that.refs.remoteAudio, event.stream);
            that.setState({isCallEstablished: true});
        });
        call.on(CallsApiEvent.HANGUP, function (event) {
            that.setState({status: 'Call finished, errorCode: ' + event.errorCode.name});
            console.log('Call finished, errorCode: ' + event.errorCode.name);
            that.setValuesAfterCall();
        });
        call.on(CallsApiEvent.ERROR, function (event) {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        });

        call.on(CallsApiEvent.CONFERENCE_JOINED, function (event) {
            that.setState({status: 'Joined conference, conferenceId: ' + event.id});
            console.log('Joined conference, conferenceId: ' + event.id);
            event.participants.forEach(participant => that.addParticipant(participant.endpoint.identifier));
        });
        call.on(CallsApiEvent.CONFERENCE_LEFT, function (event) {
            that.setState({status: 'Left conference, errorCode: ' + event.errorCode.name});
            console.log('Left conference, errorCode: ' + event.errorCode.name);
            that.setValuesAfterLeavingConferenceOrDialog();
        });
        call.on(CallsApiEvent.DIALOG_JOINED, function (event) {
            that.setState({status: 'Joined dialog, dialogId: ' + event.id});
            console.log('Joined dialog, dialogId: ' + event.id);
            that.addParticipant(event.remote.endpoint.identifier);
        });
        call.on(CallsApiEvent.DIALOG_LEFT, function (event) {
            that.setState({status: 'Left dialog, errorCode: ' + event.errorCode.name});
            console.log('Left dialog, errorCode: ' + event.errorCode.name);
            that.setValuesAfterLeavingConferenceOrDialog();
        });

        call.on(CallsApiEvent.PARTICIPANT_JOINING, function (event) {
            that.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is joining'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is joining');
        });
        call.on(CallsApiEvent.PARTICIPANT_JOINED, function (event) {
            that.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' joined'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' joined');
            that.addParticipant(event.participant.endpoint.identifier);
        });
        call.on(CallsApiEvent.PARTICIPANT_LEFT, function (event) {
            that.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' left'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' left');
            that.removeParticipant(event.participant.endpoint.identifier);
        });

        call.on(CallsApiEvent.PARTICIPANT_MUTED, function (event) {
            that.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is now muted'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is now muted');
        });
        call.on(CallsApiEvent.PARTICIPANT_UNMUTED, function (event) {
            that.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is now unmuted'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is now unmuted');
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

        call.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_ADDED, event => {
            that.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' added camera video'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' added camera video');
            that.updateParticipant(event.participant.endpoint.identifier, {camera: event.stream});
        });
        call.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_REMOVED, event => {
            that.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' removed camera video'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' removed camera video');
            that.updateParticipant(event.participant.endpoint.identifier, {camera: null});
        });
        call.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_ADDED, event => {
            that.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' added screenshare'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' added screenshare');
            that.updateParticipant(event.participant.endpoint.identifier, {screenShare: event.stream});
        });
        call.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_REMOVED, event => {
            that.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' removed screenshare'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' removed screenshare');
            that.updateParticipant(event.participant.endpoint.identifier, {screenShare: null});
        });

        call.on(CallsApiEvent.NETWORK_QUALITY_CHANGED, event => {
            console.log('Local network quality has changed: ' + NetworkQuality[event.networkQuality]);
        });
        call.on(CallsApiEvent.PARTICIPANT_NETWORK_QUALITY_CHANGED, event => {
            console.log('Network quality of ' + event.participant.endpoint.identifier + ' has changed: ' + NetworkQuality[event.networkQuality]);
        });
    }

    accept = () => {
        this.state.activeCall.accept(
            ApplicationCallOptions.builder().setVideo(true).build()
        );
    };

    decline = () => {
        this.state.activeCall.decline();
    };

    hangup = () => {
        this.state.activeCall.hangup();
    };

    setValuesAfterCall = () => {
        this.setState({
            activeCall: null,
            status: '',
            isIncomingCall: false,
            isCallEstablished: false
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

    shouldShowButtonsOnIncomingCall = () => {
        return !this.state.isCallEstablished && this.state.isIncomingCall;
    };

    shouldShowCallActions = () => {
        return this.state.isCallEstablished;
    }

    render = () => {
        let remoteVideos = this.state.participants.reduce((remoteVideos, participant) => [
            ...[
                {participant, video: participant.camera},
                {participant, video: participant.screenShare}
            ].filter(({video}) => video != null),
            ...remoteVideos
        ], []);

        return (
            <div>
                <h4>Logged-in as: <span>{this.state.identity}</span></h4>

                <audio ref="remoteAudio" autoPlay/>

                <div hidden={!this.shouldShowButtonsOnIncomingCall()}>
                    <button onClick={() => this.accept()}>Accept</button>
                    <button onClick={() => this.decline()}>Decline</button>
                    <br/><br/>
                </div>

                <div hidden={!this.shouldShowCallActions()}>
                    <button onClick={() => this.toggleCameraVideo()}>Toggle Camera Video</button>
                    <button onClick={() => this.toggleScreenShare()}>Toggle Screen Share</button>
                    <br/><br/>

                    <button hidden={!this.shouldShowCallActions()} onClick={() => this.hangup()}>Hangup</button>
                    <br/><br/>
                </div>

                <h4><span>{this.state.status}</span></h4>
                <br/><br/>

                <div hidden={this.state.activeCall && remoteVideos.length > 0 ? '' : 'hidden'}>
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

export default Agent;
