import {Component} from '@angular/core';
import {
  CallsApiEvent,
  createInfobipRtc,
  DataChannel,
  DataChannelEvent,
  Endpoint,
  InfobipRTC,
  InfobipRTCEvent,
  RoomCall,
  RoomCallOptions
} from "infobip-rtc";
import {HttpClient} from "@angular/common/http";
import {Message} from "../../types/message";
import {FormControl} from "@angular/forms";

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.css']
})
export class ChatroomComponent {
  infobipRTC: InfobipRTC = null;

  identity = '';
  activeRoomCall: RoomCall = null;
  endpoints: Endpoint[] = [];
  messages: Message[] = [];
  status = '';
  roomName = new FormControl('');
  roomId = '';
  currentMessage = new FormControl('', (form) => {
    if (form.value.trim().length === 0) {
      return {
        badMessage: "Message cannot be empty!"
      };
    }
  });
  to = new FormControl('');

  constructor(private httpClient: HttpClient) {
    this.connectInfobipRTC();
  }

  connectInfobipRTC() {
    this.httpClient.post('http://localhost:8080/token', {})
      .toPromise()
      .then((response: Response) => {
        // @ts-ignore
        this.infobipRTC = createInfobipRtc(response.token, {debug: true});
        this.infobipRTC.on(InfobipRTCEvent.CONNECTED, event => {
          this.identity = event.identity;
          console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
        });
        this.infobipRTC.on(InfobipRTCEvent.DISCONNECTED, event => {
          console.warn('Disconnected from Infobip RTC Cloud.');
        });
        this.infobipRTC.connect();
      })
  };

  setUpRoomCallEventListeners() {
    this.activeRoomCall.on(CallsApiEvent.ERROR, event => {
      console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });

    this.activeRoomCall.on(CallsApiEvent.ROOM_JOINED, event => {
      this.status = 'Joined room: ' + event.name;
      this.roomId = event.id;
      console.log('Joined room, roomId: ' + event.id);
      event.participants.forEach((participant) => this.addEndpoint(participant.endpoint));
    });

    this.activeRoomCall.on(CallsApiEvent.ROOM_LEFT, event => {
      this.status = 'Left room, errorCode: ' + event.errorCode.name;
      console.log('Left room, errorCode: ' + event.errorCode.name);
      this.setValuesAfterLeavingRoom();
    });

    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_JOINING, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' is joining';
      console.log('Participant ' + event.participant.endpoint.identifier + ' is joining');
    });

    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_JOINED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' joined';
      console.log('Participant ' + event.participant.endpoint.identifier + ' joined');
      this.addEndpoint(event.participant.endpoint);
    });

    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_LEFT, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' left';
      console.log('Participant ' + event.participant.endpoint.identifier + ' left');
      this.removeEndpoint(event.participant.endpoint.identifier);
    });

    this.activeRoomCall.on(CallsApiEvent.ERROR, event => {
      console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });
  };

  setUpDataChannelEventListeners(dataChannel: DataChannel) {
    dataChannel.on(DataChannelEvent.TEXT_DELIVERED_EVENT, event => {
      console.log(`Text message with id: ${event?.id} was ${event?.delivered ? '' : 'not '}delivered.`);
      this.modifyMessageStatusById(event?.id, event?.delivered ? 'Delivered' : 'Failed');
    });

    dataChannel.on(DataChannelEvent.TEXT_RECEIVED_EVENT, event => {
      console.log(`Received ${event?.isDirect ? 'direct ' : ''}text from ${event?.from?.identifier}`);
      this.messages.push({
        type: 'received_message',
        date: event?.date,
        from: event?.from?.identifier,
        isDirect: event?.isDirect,
        text: event?.text,
      });
    });

    dataChannel.on(DataChannelEvent.BROADCAST_TEXT_RECEIVED_EVENT, event => {
      this.messages.push({
        type: 'received_broadcast',
        date: event?.date,
        text: event?.text
      });
    });
  };

  join() {
    const roomCallOptions = RoomCallOptions.builder()
      .setAudio(false)
      .setDataChannel(true)
      .build();

    this.activeRoomCall = this.infobipRTC.joinRoom(this.roomName.value, roomCallOptions);
    this.setUpRoomCallEventListeners();
    this.setUpDataChannelEventListeners(this.activeRoomCall.dataChannel());
  };

  leave() {
    this.activeRoomCall.leave();
  };

  async send() {
    const trimmedMessage = this.currentMessage.value.trim();
    if (trimmedMessage?.length === 0) {
      return;
    }
    const toEndpoint = this.getEndpointByIdentifier(this.to.value);

    const message: Message = {
      type: 'sent_message',
      messageId: null,
      date: new Date(),
      to: toEndpoint?.identifier,
      text: trimmedMessage,
      status: null
    }

    try {
      const messageId = await this.activeRoomCall?.dataChannel()?.send(trimmedMessage, toEndpoint);
      message.messageId = messageId;
      message.status = 'Sent'
    } catch (e) {
      console.error(e);
      message.status = 'Failed'
    }

    this.messages.push(message);
    this.currentMessage.setValue('');
  };

  getEndpointByIdentifier(identifier: string): Endpoint {
    return this.endpoints.find(endpoint => endpoint.identifier === identifier);
  }

  modifyMessageStatusById(id: string, status: string) {
    this.messages = this.messages.map(message => {
      if (message.messageId === id) {
        message.status = status;
      }
      return message;
    })
  }

  setValuesAfterLeavingRoom() {
    this.endpoints = [];
    this.status = null;
    this.activeRoomCall = null;
    this.messages = [];
    this.roomId = '';
  }

  addEndpoint(endpoint: Endpoint) {
    this.endpoints.push(endpoint);
  }

  removeEndpoint(identifier: string) {
    this.endpoints = this.endpoints.filter(endpoint => endpoint.identifier !== identifier);
  }
}
