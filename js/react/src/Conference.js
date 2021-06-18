import React, {Component} from "react";
import {ConferenceOptions, InfobipRTC} from "infobip-rtc";
import httpClient from "axios";

class Conference extends Component {

    constructor(props) {
        super(props);
        this.state = {
            title: 'Infobip RTC Conference Showcase',
            conferenceId: '',
            infobipRTC: null,
            activeConference: null,
            users: [],
            identity: '',
            status: '',
            hasLocalVideo: false
        };

        this.connectInfobipRTC();
    }

    connectInfobipRTC = async () => {
        httpClient.post('http://localhost:8080/token')
            .then((response) => {
                const token = response.data.token

                this.setState((state) => {
                    state.infobipRTC = new InfobipRTC(token, {debug: true});
                    state.infobipRTC.on('connected',  (event) => {
                        this.setState({identity: event.identity});
                        console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    });
                    state.infobipRTC.on('disconnected', function (event) {
                        console.warn('Disconnected from Infobip RTC Cloud.');
                    });
                    state.infobipRTC.connect();
                    return state;
                });
            })
            .catch(err => {
                console.error(err);
            });
    };

    join = (video = false) => {
        if (this.state.conferenceId) {
            const conferenceOptions = ConferenceOptions.builder()
                .setVideo(video)
                .build();

            const activeConference = this.state.infobipRTC.joinConference(this.state.conferenceId, conferenceOptions);
            this.setConferenceEventHandlers(activeConference);
            this.setState({
                activeConference: activeConference,
                isOutgoingCall: true
            });
        }
    };

    setConferenceEventHandlers(conference) {
        let that = this;
        conference.on('joined', event => {
            that.status = 'Joined conference with ID: ' + that.conferenceId;
            console.log('Joined conference with ID: ' + that.conferenceId);
            event.users.forEach(user => this.addUser(user.identity));
            that.setMediaStream(this.refs.remoteAudio, event.stream);
        });
        conference.on('left', event => {
            that.status = 'Left conference with ID: ' + that.conferenceId;
            console.log('Left conference with ID: ' + that.conferenceId);
            that.setValuesAfterLeavingConference();
        });
        conference.on('user-joined', event => {
            that.status = 'User ' + event.user.identity + ' joined conference';
            console.log('User ' + event.user.identity + ' joined conference');
            this.addUser(event.user.identity);
        });
        conference.on('user-left', event => {
            that.status = 'User ' + event.user.identity + ' left conference';
            console.log('User ' + event.user.identity + ' left conference');
            this.removeUser(event.user.identity);
        });
        conference.on('user-muted', event => {
            that.status = 'User ' + event.user.identity + ' is now muted';
            console.log('User ' + event.user.identity + ' is now muted');
        });
        conference.on('user-unmuted', event => {
            that.status = 'User ' + event.user.identity + ' is now unmuted';
            console.log('User ' + event.user.identity + ' is now unmuted');
        });

        conference.on('local-camera-video-added', event => {
            that.status = 'User added local camera video';
            console.log('User added local camera video');
            that.setMediaStream(that.refs.localCameraVideo, event.stream);
        });
        conference.on('local-camera-video-removed', event => {
            that.status = 'User removed local camera video';
            console.log('User removed local camera video');
            that.setMediaStream(that.refs.localCameraVideo, null);
        });
        conference.on('local-screenshare-added', event => {
            that.status = 'User added local screenshare';
            console.log('User added local screenshare');
            that.setMediaStream(that.refs.localScreenShare, event.stream);
        });
        conference.on('local-screenshare-removed', event => {
            that.status = 'User removed local screenshare';
            console.log('User removed local screenshare');
            that.setMediaStream(that.refs.localScreenShare, null);
        });

        conference.on('user-camera-video-added', event => {
            that.status = 'User ' + event.user.identity + ' added camera video';
            console.log('User ' + event.user.identity + ' added camera video');
            this.updateUser(event.user.identity, {camera: event.stream});
        });
        conference.on('user-camera-video-removed', event => {
            that.status = 'User ' + event.user.identity + ' removed camera video';
            console.log('User ' + event.user.identity + ' removed camera video');
            this.updateUser(event.user.identity, {camera: null});
        });
        conference.on('user-screenshare-added', event => {
            that.status = 'User ' + event.user.identity + ' added screenshare';
            console.log('User ' + event.user.identity + ' added screenshare');
            this.updateUser(event.user.identity, {screenShare: event.stream});
        });
        conference.on('user-screenshare-removed', event => {
            that.status = 'User ' + event.user.identity + ' removed screenshare';
            console.log('User ' + event.user.identity + ' removed screenshare');
            this.updateUser(event.user.identity, {screenShare: null});
        });

        conference.on('error', event => {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        });
    };

    leave = () => {
        this.state.activeConference.leave();
    };

    toggleShareScreen = () => {
        this.state.activeConference.screenShare(!this.state.activeConference.hasScreenShare())
            .catch(error => console.log('Error toggling screen share {}', error));
    }

    toggleCameraVideo = () => {
        this.state.activeConference.cameraVideo(!this.state.activeConference.hasCameraVideo())
            .catch(error => console.log('Error toggling camera video {}', error));
    }

    setMediaStream(element, stream) {
        element.srcObject = stream;

        this.setState({hasLocalVideo:
                (this.state.activeConference && (this.state.activeConference.hasCameraVideo() || this.state.activeConference.hasScreenShare()))
        });
    }

    setValuesAfterLeavingConference() {
        this.setState({
            status: null,
            activeConference: null,
            users: [],
            hasLocalVideo: false,
            hasRemoteVideo: false
        });
    }

    handleChange = (event) => {
        const confId = event.target.value;
        this.setState({conferenceId: confId});
    };

    addUser = (identity) =>
        this.setState(({users}) => ({users: [...users, {identity}]}));

    removeUser = identity =>
        this.setState(({users}) => ({users: users.filter(user => user.identity !== identity)}));

    updateUser = (identity, fields) => {
        this.setState(({users}) => {
            let user = users.find(user => user.identity === identity);
            if (user) Object.assign(user, fields);
            return {users};
        });
    }

    setVideo(element, stream) {
        if (!element) return;
        if (stream && element.srcObject !== stream) {
            element.srcObject = stream;
        }
    }

    render() {
        let remoteVideos = this.state.users.reduce((remoteVideos, user) => [
            ...[
                {user, video: user.camera},
                {user, video: user.screenShare}
            ].filter(({video}) => video != null),
            ...remoteVideos
        ], []);

        return (
            <div>
                <h2><span>{this.state.title}</span></h2>
                <h4>Logged as: <span>{this.state.identity}</span></h4>
                <audio ref="remoteAudio" autoPlay/>
                <input type="text" value={this.state.conferenceId} onChange={this.handleChange}
                       placeholder="Enter conference ID"/>
                <br/><br/>
                <button disabled={this.state.activeConference} onClick={() => this.join(false)}>Join</button>
                <button disabled={this.state.activeConference} onClick={() => this.join(true)}>Join with Video</button>
                <button disabled={!this.state.activeConference} onClick={() => this.leave()}>Leave</button>
                <br/><br/>
                <button disabled={!this.state.activeConference} onClick={() => this.toggleCameraVideo()}>Toggle Camera Video</button>
                <button disabled={!this.state.activeConference} onClick={() => this.toggleShareScreen()}>Toggle Share Screen</button>
                <div hidden={this.state.hasLocalVideo ? '' : 'hidden'}>
                    <br/><br/>
                    <h3>Local video/screenshare</h3>
                    <video width="300" height="300"
                           style={{"object-fit": "cover"}}
                           autoPlay
                           ref="localCameraVideo"/>
                    <video width="300" height="300"
                           style={{"object-fit": "cover"}}
                           autoPlay
                           ref="localScreenShare"/>
                    <br/><br/>
                </div>
                <div hidden={this.state.activeConference && remoteVideos.length > 0 ? '' : 'hidden'}>
                    <br/><br/>
                    <h3>Remote videos/screenshares</h3>
                    {remoteVideos.map(({video}) => {
                        return (
                            <video
                                ref={element => this.setVideo(element, video)}
                                width="300" height="300"
                                style={{"object-fit": "cover"}}
                                autoPlay/>
                        )}
                    )}
                </div>
            </div>
        )
    }
}

export default Conference;