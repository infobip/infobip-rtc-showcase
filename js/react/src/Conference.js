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
            identity: '',
            status: ''
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

    setConferenceEventHandlers(conference) {
        let that = this;
        conference.on('joined', event => {
            that.status = 'Joined conference with ID: ' + that.conferenceId;
            console.log('Joined conference with ID: ' + that.conferenceId);
            that.setMediaStream(this.activeConference, event);
        });
        conference.on('left', event => {
            that.status = 'Left conference with ID: ' + that.conferenceId;
            console.log('Left conference with ID: ' + that.conferenceId);
            that.removeMediaStream();
            that.setValuesAfterLeavingConference();
        });
        conference.on('user-joined', event => {
            that.status = 'User ' + event.user.identity + ' joined conference';
            console.log('User ' + event.user.identity + ' joined conference');
        });
        conference.on('user-left', event => {
            that.status = 'User ' + event.user.identity + ' left conference';
            console.log('User ' + event.user.identity + ' left conference');
        });
        conference.on('user-muted', event => {
            that.status = 'User ' + event.user.identity + ' is now muted';
            console.log('User ' + event.user.identity + ' is now muted');
        });
        conference.on('user-unmuted', event => {
            that.status = 'User ' + event.user.identity + ' is now unmuted';
            console.log('User ' + event.user.identity + ' is now unmuted');
        });
        conference.on('error', event => {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
            that.removeMediaStream();
            that.setValuesAfterLeavingConference();
        });
    };

    join = () => {
        if (this.state.conferenceId) {
            const conferenceOptions = ConferenceOptions.builder()
                .setVideo(false)
                .build();

            const activeConference = this.state.infobipRTC.joinConference(this.state.conferenceId, conferenceOptions);
            this.setConferenceEventHandlers(activeConference);
            this.setState({
                activeConference: activeConference,
                isOutgoingCall: true
            });
        }
    };

    leave = () => {
        this.state.activeConference.leave();
    };

    setValuesAfterLeavingConference() {
        this.setState({
            status: null,
            activeConference: null
        });
    }

    setMediaStream(call, event) {
        this.refs.remoteAudio.srcObject = event.stream;
    }

    removeMediaStream() {
        this.refs.remoteAudio.srcObject = null;
    }

    shouldDisableLeaveButton = () => {
        return !this.state.activeConference;
    };


    handleChange = (event) => {
        const confId = event.target.value;
        this.setState({conferenceId: confId});
    };

    render() {
        return (
            <div>
                <h2><span>{this.state.title}</span></h2>
                <h4>Logged as: <span>{this.state.identity}</span></h4>
                <audio ref="remoteAudio" autoPlay/>
                <input type="text" value={this.state.conferenceId} onChange={this.handleChange}
                       placeholder="Enter conference ID"/>
                <br/><br/>
                <button disabled={this.state.activeConference} onClick={() => this.join()}>Join</button>
                <button disabled={this.shouldDisableLeaveButton()} onClick={() => this.leave()}>Leave</button>
            </div>
        )
    }
}

export default Conference;