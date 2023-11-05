import {Component, ViewChild} from '@angular/core';
import {
  CallsApiEvent,
  createInfobipRtc,
  InfobipRTC,
  InfobipRTCEvent,
  RoomCall,
  RoomCallOptions
} from 'infobip-rtc';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-conference',
  templateUrl: './room-call.component.html'
})
export class RoomCallComponent {
  @ViewChild('remoteAudio') remoteAudio: HTMLAudioElement;
  @ViewChild('localCameraVideo') localCameraVideo: HTMLVideoElement;
  @ViewChild('localScreenShare') localScreenShare: HTMLVideoElement;

  title = 'Infobip RTC Room Showcase';

  infobipRTC: InfobipRTC = null;
  identity = '';
  roomName = '';
  activeRoomCall: RoomCall = null;
  participants = [];
  status = '';
  remoteVideos = [];

  constructor(private httpClient: HttpClient) {
    this.connectInfobipRTC();
  }

  connectInfobipRTC = () => {
    this.httpClient.post('http://localhost:8080/token', {})
      .toPromise()
      .then((response: Response) => {
        // @ts-ignore
        this.infobipRTC = createInfobipRtc(response.token, { debug: true });
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

  listenForRoomCallEvents = () => {
    this.activeRoomCall.on(CallsApiEvent.ROOM_JOINED, event => {
      this.status = 'Joined room: ' + this.roomName;
      console.log('Joined room: ' + this.roomName);
      this.setMediaStream(this.remoteAudio, event.stream);
      event.participants.forEach(participant => this.addParticipant(participant.endpoint.identifier));
    });
    this.activeRoomCall.on(CallsApiEvent.ROOM_LEFT, event => {
      this.status = 'Left room: ' + event.errorCode.name;
      console.log('Left room: ' + event.errorCode.name);
      this.setValuesAfterLeavingRoom();
    });

    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_JOINING, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' is joining room';
      console.log('Participant ' + event.participant.endpoint.identifier + ' is joining room');
    });
    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_JOINED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' joined room';
      console.log('Participant ' + event.participant.endpoint.identifier + ' joined room');
      this.addParticipant(event.participant.endpoint.identifier);
    });
    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_LEFT, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' left room';
      console.log('Participant ' + event.participant.endpoint.identifier + ' left room');
      this.removeParticipant(event.participant.endpoint.identifier);
    });

    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_MUTED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' is now muted';
      console.log('Participant ' + event.participant.endpoint.identifier + ' is now muted');
    });
    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_UNMUTED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' is now unmuted';
      console.log('Participant ' + event.participant.endpoint.identifier + ' is now unmuted');
    });

    this.activeRoomCall.on(CallsApiEvent.CAMERA_VIDEO_ADDED, event => {
      this.status = 'Participant added local camera video';
      console.log('Participant added local camera video');
      this.setMediaStream(this.localCameraVideo, event.stream);
    });
    this.activeRoomCall.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, event => {
      this.status = 'Participant updated local camera video';
      console.log('Participant updated local camera video');
      this.setMediaStream(this.localCameraVideo, event.stream);
    });
    this.activeRoomCall.on(CallsApiEvent.CAMERA_VIDEO_REMOVED, () => {
      this.status = 'Participant removed local camera video';
      console.log('Participant removed local camera video');
      this.setMediaStream(this.localCameraVideo, null);
    });

    this.activeRoomCall.on(CallsApiEvent.SCREEN_SHARE_ADDED, event => {
      this.status = 'Participant added local screenshare';
      console.log('Participant added local screenshare');
      this.setMediaStream(this.localScreenShare, event.stream);
    });
    this.activeRoomCall.on(CallsApiEvent.SCREEN_SHARE_REMOVED, () => {
      this.status = 'Participant removed local screenshare';
      console.log('Participant removed local screenshare');
      this.setMediaStream(this.localScreenShare, null);
    });

    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_ADDED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' added camera video';
      console.log('Participant ' + event.participant.endpoint.identifier + ' added camera video');
      this.updateParticipant(event.participant.endpoint.identifier, {camera: event.stream});
    });
    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_REMOVED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' removed camera video';
      console.log('Participant ' + event.participant.endpoint.identifier + ' removed camera video');
      this.updateParticipant(event.participant.endpoint.identifier, {camera: null});
    });

    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_ADDED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' added screenshare';
      console.log('Participant ' + event.participant.endpoint.identifier + ' added screenshare');
      this.updateParticipant(event.participant.endpoint.identifier, {screenShare: event.stream});
    });
    this.activeRoomCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_REMOVED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' removed screenshare';
      console.log('Participant ' + event.participant.endpoint.identifier + ' removed screenshare');
      this.updateParticipant(event.participant.endpoint.identifier, {screenShare: null});
    });

    this.activeRoomCall.on(CallsApiEvent.ERROR, event => {
      console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });
  };

  onChange = (event) => {
    this.roomName = event.target.value;
  };

  join = (video = false) => {
    if (this.roomName) {
      const roomCallOptions = RoomCallOptions.builder()
        .setVideo(video)
        .build();

      this.activeRoomCall = this.infobipRTC.joinRoom(this.roomName, roomCallOptions);
      this.listenForRoomCallEvents();
    }
  };

  leave = () => {
    this.activeRoomCall.leave();
  };

  setValuesAfterLeavingRoom = () => {
    this.status = null;
    this.activeRoomCall = null;
    this.participants = [];
    this.remoteVideos = [];
  }

  setMediaStream = (element, stream) => {
    element.nativeElement.srcObject = stream;
  }

  toggleScreenShare = () => {
    this.activeRoomCall.screenShare(!this.activeRoomCall.hasScreenShare())
      .catch(error => console.log('Error toggling screen share {}', error));
  }

  toggleCameraVideo = () => {
    this.activeRoomCall.cameraVideo(!this.activeRoomCall.hasCameraVideo())
      .catch(error => console.log('Error toggling camera video {}', error));
  }

  addParticipant = (identifier) => {
    this.participants.push({identifier});
  }

  removeParticipant = (identifier) => {
    this.participants = this.participants.filter(participant => participant.identifier !== identifier);
  }

  updateParticipant = (identifier, fields) => {
    const participantToUpdate = this.participants.find(participant => participant.identifier === identifier);
    if (participantToUpdate) Object.assign(participantToUpdate, fields);
    this.updateRemoteVideos();
  }

  updateRemoteVideos = () => {
    this.remoteVideos = this.participants.reduce((remoteVideos, participant) => [
      ...[
        {participant, video: participant.camera},
        {participant, video: participant.screenShare}
      ].filter(({video}) => video != null),
      ...remoteVideos
    ], []);
  }

  shouldShowLocalVideos = () => {
    return this.activeRoomCall && (this.activeRoomCall.hasCameraVideo() || this.activeRoomCall.hasScreenShare());
  }

  shouldShowRemoteVideos = () => {
    return this.activeRoomCall && this.remoteVideos.length > 0
  }
}
