import React, {Component} from "react";
import {CallsApiEvent, createInfobipRtc, DataChannelEvent, InfobipRTCEvent, RoomCallOptions} from "infobip-rtc";
import httpClient from "axios";
import "./ChatRoom.css"
import ReceivedMessage from "./ReceivedMessage";
import SentMessage from "./SentMessage";
import {MESSAGE_TYPE} from "./MessageUtil";
import ReceivedBroadcast from "./ReceivedBroadcast";

class ChatRoom extends Component {

    constructor(props) {
        super(props);
        this.state = {
            title: 'Infobip RTC Datachannel Showcase',
            roomName: '',
            roomId: '',
            infobipRTC: null,
            activeRoomCall: null,
            endpoints: [],
            identity: '',
            status: '',
            messages: [],
            currentMessage: '',
            to: '',
        };

        this.connectInfobipRTC();
    }

    connectInfobipRTC = async () => {
        httpClient.post('http://localhost:8080/token')
            .then((response) => {
                const token = response.data.token

                this.setState((state) => {
                    state.infobipRTC = createInfobipRtc(token, {debug: true});
                    state.infobipRTC.on(InfobipRTCEvent.CONNECTED, (event) => {
                        this.setState({identity: event.identity});
                        console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    });
                    state.infobipRTC.on(InfobipRTCEvent.DISCONNECTED, function (event) {
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
                .setAudio(false)
                .setDataChannel(true)
                .build();

            const activeRoomCall = this.state.infobipRTC.joinRoom(this.state.roomName, roomCallOptions);
            this.setRoomCallEventHandlers(activeRoomCall);
            this.setDataChannelEventHandlers(activeRoomCall?.dataChannel())
            this.setState({activeRoomCall: activeRoomCall});
        }
    };

    setRoomCallEventHandlers = (roomCall) => {
        roomCall.on(CallsApiEvent.ROOM_JOINED, event => {
            this.setState({
                status: `Joined room: ${event.name}`,
                roomId: event.id
            });
            console.log('Joined room: ' + event.name);
            event.participants.forEach(participant => this.addEndpoint(participant.endpoint));
        });

        roomCall.on(CallsApiEvent.ROOM_LEFT, event => {
            this.setState({status: 'Left room: ' + event.errorCode.name, roomId: ''});
            console.log('Left room: ' + event.errorCode.name);
            this.setValuesAfterLeavingRoom();
        });

        roomCall.on(CallsApiEvent.PARTICIPANT_JOINING, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' is joining room'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' is joining room');
        });

        roomCall.on(CallsApiEvent.PARTICIPANT_JOINED, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' joined room'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' joined room');
            this.addEndpoint(event.participant.endpoint);
        });

        roomCall.on(CallsApiEvent.PARTICIPANT_LEFT, event => {
            this.setState({status: 'Participant ' + event.participant.endpoint.identifier + ' left room'});
            console.log('Participant ' + event.participant.endpoint.identifier + ' left room');
            this.removeEndpoint(event.participant.endpoint.identifier);
        });

        roomCall.on(CallsApiEvent.ERROR, event => {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        });
    };

    setDataChannelEventHandlers = (dataChannel) => {
        dataChannel.on(DataChannelEvent.TEXT_RECEIVED_EVENT, event => {
            console.log(`Received ${event?.isDirect ? 'direct ' : ''}text from ${event?.from?.identifier}`)
            this.appendMessage({
                'type': MESSAGE_TYPE.RECEIVED_MESSAGE,
                'date': event?.date,
                'from': event?.from?.identifier,
                'isDirect': event?.isDirect,
                'text': event?.text,
            });
        });

        dataChannel.on(DataChannelEvent.TEXT_DELIVERED_EVENT, event => {
            console.log(`Text message with id: ${event.id} was ${event?.delivered ? '' : 'not '}delivered.`);
            this.modifyMessageStatusById(event?.id, event?.delivered ? 'Delivered' : 'Failed');
        });

        dataChannel.on(DataChannelEvent.BROADCAST_TEXT_RECEIVED_EVENT, event => {
            console.log(`Received broadcast: ${event?.text}`);
            this.appendMessage({
                'type': MESSAGE_TYPE.RECEIVED_BROADCAST,
                'date': event?.date,
                'text': event?.text,
            })
        });
    }

    send = async () => {
        const {activeRoomCall, currentMessage, to} = this.state;
        const trimmedMessage = currentMessage?.trim();
        if (trimmedMessage?.length === 0) {
            return;
        }
        const toEndpoint = this.getEndpointByIdentifier(to);

        const message = {
            'type': MESSAGE_TYPE.SENT_MESSAGE,
            'messageId': null,
            'date': new Date(),
            'to': toEndpoint?.identifier,
            'text': trimmedMessage,
            'status': null
        }

        try {
            const messageId = await activeRoomCall?.dataChannel()?.send(trimmedMessage, toEndpoint);
            message.messageId = messageId;
            message.status = 'Sent'
        } catch (e) {
            console.error(e);
            message.status = 'Failed'
        }

        this.appendMessage(message);

        this.setState({currentMessage: ''});
    };

    appendMessage = (message) => {
        this.setState(({messages}) => ({messages: [...messages, message]}));
    }

    modifyMessageStatusById = (id, status) => {
        this.setState(({messages}) => {
            const nextMessages = messages.map(message => {
                if (message.messageId === id) {
                    console.log(`Updating status of a message with id ${id} to ${status}`);
                    message.status = status;
                }
                return message;
            })
            return {messages: nextMessages};
        })
    };

    getEndpointByIdentifier = (identifier) => {
        return this.state.endpoints.find(endpoint => endpoint?.identifier === identifier);
    };

    leave = () => {
        this.state.activeRoomCall.leave();
    };

    setValuesAfterLeavingRoom = () => {
        this.setState({
            status: null,
            activeRoomCall: null,
            endpoints: [],
            messages: []
        });
    }

    handleRoomNameChange = (event) => {
        const roomName = event.target.value;
        this.setState({roomName});
    };

    handleCurrentMessageChange = (event) => {
        const currentMessage = event.target.value;
        this.setState({currentMessage});
    };

    handleToChange = (event) => {
        const to = event.target.value;
        this.setState({to})
    }

    addEndpoint = (endpoint) =>
        this.setState(({endpoints}) => ({endpoints: [...endpoints, endpoint]}));

    removeEndpoint = (identifier) =>
        this.setState(({endpoints}) => ({endpoints: endpoints.filter(endpoint => endpoint.identifier !== identifier)}));

    render = () => {
        const {messages, roomId} = this.state;

        return (
            <div>
                <h2><span>{this.state.title}</span></h2>
                <h4>Logged as: <span>{this.state.identity}</span></h4>

                <input type='text' value={this.state.roomName} onChange={this.handleRoomNameChange}
                       placeholder='Enter room name'/>
                <br/><br/>

                <button disabled={this.state.activeRoomCall} onClick={() => this.join()}>Join</button>
                <button disabled={!this.state.activeRoomCall} onClick={() => this.leave()}>Leave</button>
                <br/>

                <h4><span>{this.state.status}</span></h4>

                <input type='text' value={this.state.currentMessage} onChange={this.handleCurrentMessageChange}
                       placeholder='Type a message...'/>
                <input type='text' value={this.state.to} onChange={this.handleToChange}
                       placeholder='To... (Optional)'/>
                <br/><br/>
                <button disabled={!this.state.activeRoomCall?.dataChannel()} onClick={() => this.send()}>Send</button>
                <br/><br/>

                <p>Sent and received messages will appear in the box below</p>
                <br/>
                {roomId && roomId.length > 0 && <p>{`Room id: ${roomId}`}</p>}
                <div className={'chat-room'}>
                    {messages.map((message, idx) => {
                        if (message.type === MESSAGE_TYPE.RECEIVED_MESSAGE) {
                            return (
                                <ReceivedMessage key={idx} message={message}/>
                            );
                        } else if (message.type === MESSAGE_TYPE.SENT_MESSAGE) {
                            return (
                                <SentMessage key={idx} message={message}/>
                            );
                        }
                        return (
                            <ReceivedBroadcast key={idx} message={message}/>
                        );
                    })}
                </div>
            </div>
        )
    }
}

export default ChatRoom;
