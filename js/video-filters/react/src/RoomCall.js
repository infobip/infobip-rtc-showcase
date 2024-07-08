import React, {Component} from "react";
import {CallsApiEvent, createInfobipRtc, InfobipRTCEvent, RoomCallOptions, VideoOptions} from "infobip-rtc";
import {RTCVideoFilter, RTCVideoFilterMode} from "infobip-rtc-extensions";
import httpClient from "axios";
import {createImage, loadFile} from "./Utils";

class RoomCall extends Component {
    constructor(props) {
        super(props);
        this.state = {
            infobipRTC: null,
            activeRoomCall: null,
            participants: [],
            roomName: '',
            identity: '',
            cropPointX: 0,
            cropSizeX: 100,
            cropPointY: 0,
            cropSizeY: 100,
            videoFilterMode: 'none',
            blurRadius: 30
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
                    return state;
                });
            })
            .catch(err => {
                console.error(err);
            });
    };

    join = () => {
        if (this.state.roomName) {
            const roomCallOptions = RoomCallOptions.builder()
                .setVideo(true)
                .setVideoOptions(
                    VideoOptions.builder()
                        .setVideoFilter(new RTCVideoFilter({
                            fps: 20,
                            mode: RTCVideoFilterMode.NONE,
                            blurRadius: 30
                        }))
                        .build()
                )
                .build();

            const activeRoomCall = this.state.infobipRTC.joinRoom(this.state.roomName, roomCallOptions);
            this.setRoomCallEventHandlers(activeRoomCall);
            this.setState({ activeRoomCall: activeRoomCall });
        }
    };

    setRoomCallEventHandlers = (roomCall) => {
        roomCall.on(CallsApiEvent.ROOM_JOINED, event => {
            this.setAudioMediaStream(event.stream);
            event.participants.forEach(participant => this.addParticipant(participant.endpoint.identifier));
        });
        roomCall.on(CallsApiEvent.ROOM_LEFT, event => {
            this.setValuesAfterLeavingRoom();
        });

        roomCall.on(CallsApiEvent.PARTICIPANT_JOINED, event => {
            this.addParticipant(event.participant.endpoint.identifier);
        });
        roomCall.on(CallsApiEvent.PARTICIPANT_LEFT, event => {
            this.removeParticipant(event.participant.endpoint.identifier);
        });

        roomCall.on(CallsApiEvent.CAMERA_VIDEO_ADDED, event => {
            this.setSourceMediaStream();
            this.setMediaStream(this.refs.videoFilterOn, event.stream);
        });
        roomCall.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, event => {
            this.setMediaStream(this.refs.videoFilterOn, event.stream);
        });

        roomCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_ADDED, event => {
            this.updateParticipant(event.participant.endpoint.identifier, {camera: event.stream});
        });

        roomCall.on(CallsApiEvent.ERROR, event => {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        });
    };

    leave = () => {
        this.state.activeRoomCall.clearVideoFilter();
        this.state.activeRoomCall.leave();
    };

    setSourceMediaStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            this.refs.videoFilterOff.srcObject = stream;
            this.setState({ sourceStream: stream });
        } catch (error) {
            console.error('Error accessing media devices.', error);
        }
    }

    setMediaStream = (element, stream) => {
        element.srcObject = stream;
    }

    setAudioMediaStream = (stream) => {
        this.refs.remoteAudio.srcObject = stream;
    }

    setValuesAfterLeavingRoom = () => {
        const { sourceStream } = this.state;
        if (sourceStream) {
            sourceStream.getTracks().forEach(track => track.stop());
            this.setState({ sourceStream: null });
        }

        this.setState({
            status: null,
            activeRoomCall: null,
            participants: [],
            cropPointX: 0,
            cropSizeX: 100,
            cropPointY: 0,
            cropSizeY: 100,
            videoFilterMode: 'none',
            blurRadius: 30
        });

        this.refs.videoFilterOff.srcObject = null;
        this.refs.videoFilterOn.srcObject = null;
        this.refs.remoteAudio.srcObject = null;
    }

    handleRoomNameChange = (event) => {
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

    handleVideoFilterModeChange = (event) => {
        this.setState({ videoFilterMode: event.target.value });
        if (this.state.activeRoomCall) {
            const options = this.state.activeRoomCall.videoFilter().options;
            options.mode = event.target.value;
            options.cropPoint = { x: 0, y: 0 };
            options.cropSize = { x: 1, y: 1 };
            this.state.activeRoomCall.videoFilter().setOptions(options);
        }
    }

    handleCropChange = (cropSizeX, cropSizeY, cropPointX, cropPointY) => {
        this.setState({
            cropSizeX: cropSizeX,
            cropSizeY: cropSizeY,
            cropPointX: cropPointX,
            cropPointY: cropPointY
        });

        if (this.state.activeRoomCall) {
            const options = this.state.activeRoomCall.videoFilter().options;
            options.cropSize = {
                x: parseInt(cropSizeX) / 100.0,
                y: parseInt(cropSizeY) / 100.0
            };
            options.cropPoint = {
                x: parseInt(cropPointX) / 100.0,
                y: parseInt(cropPointY) / 100.0
            };
            this.state.activeRoomCall.videoFilter().setOptions(options);
        }
    }

    handleBackgroundImageChange = async (event) => {
        if (event.target.files && event.target.files.length > 0) {
            try {
                const blob = await loadFile(event.target.files[0]);
                const image = await createImage(blob);
                const options = this.state.activeRoomCall.videoFilter().options;
                options.image = image;
                await this.state.activeRoomCall.videoFilter().setOptions(options);
            } catch (err) {
                console.error("Failed to set custom virtual background.", err);
            }
        }
    }

    handleBlurRadiusChange = async (event) => {
        this.setState({ blurRadius: event.target.value });
        if (this.state.activeRoomCall) {
            const options = this.state.activeRoomCall.videoFilter().options;
            options.blurRadius = parseInt(event.target.value)
            this.state.activeRoomCall.videoFilter().setOptions(options);
        }
    }

    render = () => {
        const {
            identity,
            roomName,
            activeRoomCall,
            participants,
            cropPointX,
            cropSizeX,
            cropPointY,
            cropSizeY,
            videoFilterMode,
            blurRadius
        } = this.state;

        let remoteVideos = participants.reduce((remoteVideos, participant) => [
            ...[
                {participant, video: participant.camera},
            ].filter(({video}) => video != null),
            ...remoteVideos
        ], []);

        return (
            <div>
                <h4>Logged-in as: <span>{identity}</span></h4>

                <audio ref="remoteAudio" autoPlay/>

                <input type="text" value={roomName} onChange={this.handleRoomNameChange}
                       placeholder="Enter room name"/>
                <br/><br/>

                <button disabled={activeRoomCall} onClick={() => this.join()}>Join Video Room</button>
                <button disabled={!activeRoomCall} onClick={() => this.leave()}>Leave</button>
                <br/><br/>

                <div style={{ display: this.state.activeRoomCall ? 'flex' : 'none', flexDirection: 'row' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <label style={{ marginBottom: '10px' }}>Source Stream</label>
                        <video width="300" height="300"
                               style={{"objectFit": "cover"}}
                               autoPlay
                               ref="videoFilterOff"/>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <label style={{ marginBottom: '10px' }}>Video Filter Stream</label>
                        <video width="300" height="300"
                               style={{"objectFit": "cover"}}
                               autoPlay
                               ref="videoFilterOn"/>
                    </div>
                    <div>
                        <table>
                        <tbody>
                            <tr>
                                <td colSpan="2"><h2>Video Filter Settings</h2></td>
                            </tr>

                            <tr>
                                <td colSpan="2">Video Filter Mode</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td colSpan="2">
                                    <select value={videoFilterMode} onChange={this.handleVideoFilterModeChange}>
                                        <option value="none">None</option>
                                        <option value="background_blur">Background Blur</option>
                                        <option value="virtual_background">Virtual Background</option>
                                        <option value="face_track">Face Track</option>
                                    </select>
                                </td>
                            </tr>

                            <tr>
                                <td colSpan="2">Blur Radius</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        value={blurRadius}
                                        onChange={this.handleBlurRadiusChange}
                                        className="slider"
                                    />
                                </td>
                            </tr>

                            <tr>
                                <td colSpan="2">Image Crop</td>
                            </tr>

                            <tr>
                                <td></td>
                                <td>Crop Point (%)</td>
                                <td>Crop Scale (%)</td>
                            </tr>

                            <tr>
                                <td>X</td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={cropPointX}
                                        onChange={(e) => this.handleCropChange(cropSizeX, cropSizeY, e.target.value, cropPointY)}
                                        className="slider"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={cropSizeX}
                                        onChange={(e) => this.handleCropChange(e.target.value, cropSizeY, cropPointX, cropPointY)}
                                        className="slider"
                                    />
                                </td>
                            </tr>

                            <tr>
                                <td>Y</td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={cropPointY}
                                        onChange={(e) => this.handleCropChange(cropSizeX, cropSizeY, cropPointX, e.target.value)}
                                        className="slider"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={cropSizeY}
                                        onChange={(e) => this.handleCropChange(cropSizeX, e.target.value, cropPointX, cropPointY)}
                                        className="slider"
                                    />
                                </td>
                            </tr>

                            <tr>
                                <td colSpan="2">Virtual Background Image</td>
                            </tr>

                            <tr>
                                <td></td>
                                <td colSpan="2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={this.handleBackgroundImageChange}
                                    />
                                </td>
                            </tr>
                        </tbody>
                        </table>
                    </div>
                </div>

                <div hidden={activeRoomCall && remoteVideos.length > 0 ? '' : 'hidden'}>
                    <h3>Remote videos</h3>
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
            </div>
        )
    }
}

export default RoomCall;
