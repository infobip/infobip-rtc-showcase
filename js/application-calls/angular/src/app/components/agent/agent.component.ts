import {Component, ViewChild} from '@angular/core';
import {
  ApplicationCall,
  ApplicationCallOptions,
  AudioQualityMode,
  CallsApiEvent,
  createInfobipRtc,
  IncomingApplicationCall,
  InfobipRTC,
  InfobipRTCEvent,
  NetworkQuality,
} from 'infobip-rtc';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-agent',
  templateUrl: './agent.component.html'
})
export class AgentComponent {
  @ViewChild('remoteAudio') remoteAudio: HTMLAudioElement;
  @ViewChild('localCameraVideo') localCameraVideo: HTMLVideoElement;
  @ViewChild('localScreenShare') localScreenShare: HTMLVideoElement;

  infobipRTC: InfobipRTC = null;
  activeCall: ApplicationCall = null;
  identity = '';
  status = '';

  isIncomingCall = false;
  isCallEstablished = false;

  participants = [];
  remoteVideos = [];

  audioInputDevices: MediaDeviceInfo[] = [];
  selectedAudioInputDevice: string;
  audioQualityModes: { [name: string]: AudioQualityMode } = {
    Low: AudioQualityMode.LOW_DATA,
    Auto: AudioQualityMode.AUTO,
    High: AudioQualityMode.HIGH_QUALITY
  }
  selectedAudioQualityMode = 'Auto';

  constructor(private httpClient: HttpClient) {
    this.connectInfobipRTC();
  }

  connectInfobipRTC() {
    this.httpClient.post('http://localhost:8080/token/agent', {})
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
        this.listenForIncomingApplicationCall();
        this.loadAudioDevices()
      })
  };

  listenForIncomingApplicationCall() {
    this.infobipRTC.on(InfobipRTCEvent.INCOMING_APPLICATION_CALL, incomingCallEvent => {
      const incomingApplicationCall = incomingCallEvent.incomingCall;
      console.log('Received incoming call from: ' + incomingApplicationCall.from());

      this.activeCall = incomingApplicationCall;
      this.listenForApplicationCallEvents();

      this.isIncomingCall = true;
      this.status = 'Incoming ' + (incomingApplicationCall.options().video ? 'video' : 'audio') +
        ' call from: ' + incomingApplicationCall.from();
    });
  };

  loadAudioDevices = () => {
    this.infobipRTC.getAudioInputDevices().then(inputDevices => {
      this.audioInputDevices = inputDevices;
      this.selectedAudioInputDevice = inputDevices[0].deviceId
    });
  }

  listenForApplicationCallEvents() {
    this.activeCall.on(CallsApiEvent.RINGING, () => {
      this.status = 'Ringing...';
      console.log('Call is ringing...');
    });
    this.activeCall.on(CallsApiEvent.ESTABLISHED, event => {
      this.status = 'Established';
      console.log('Call is established');
      this.setMediaStream(this.remoteAudio, event.stream);
      this.isCallEstablished = true;
    });
    this.activeCall.on(CallsApiEvent.HANGUP, event => {
      this.status = 'Call finished, errorCode: ' + event.errorCode.name;
      console.log('Call finished, errorCode: ' + event.errorCode.name);
      this.removeAllMediaStreams();
      this.setValuesAfterCall();
    });
    this.activeCall.on(CallsApiEvent.ERROR, event => {
      console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });

    this.activeCall.on(CallsApiEvent.CONFERENCE_JOINED, event => {
      this.status = 'Joined conference, conferenceId: ' + event.id;
      console.log('Joined conference, conferenceId: ' + event.id);

      event.participants.forEach((participant) => this.addParticipant(participant.endpoint.identifier));
    });
    this.activeCall.on(CallsApiEvent.CONFERENCE_LEFT, event => {
      this.status = 'Left conference, errorCode: ' + event.errorCode.name;
      console.log('Left conference, errorCode: ' + event.errorCode.name);
      this.setValuesAfterLeavingConferenceOrDialog();
    });
    this.activeCall.on(CallsApiEvent.DIALOG_JOINED, event => {
      this.status = 'Joined dialog, dialogId: ' + event.id;
      console.log('Joined dialog, dialogId: ' + event.id);
      this.addParticipant(event.remote.endpoint.identifier);
    });
    this.activeCall.on(CallsApiEvent.DIALOG_LEFT, event => {
      this.status = 'Left dialog, errorCode: ' + event.errorCode.name;
      console.log('Left dialog, errorCode: ' + event.errorCode.name);
      this.setValuesAfterLeavingConferenceOrDialog();
    });

    this.activeCall.on(CallsApiEvent.PARTICIPANT_JOINING, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' is joining';
      console.log('Participant ' + event.participant.endpoint.identifier + ' is joining');
    });
    this.activeCall.on(CallsApiEvent.PARTICIPANT_JOINED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' joined';
      console.log('Participant ' + event.participant.endpoint.identifier + ' joined');
      this.addParticipant(event.participant.endpoint.identifier);
    });
    this.activeCall.on(CallsApiEvent.PARTICIPANT_LEFT, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' left';
      console.log('Participant ' + event.participant.endpoint.identifier + ' left');
      this.removeParticipant(event.participant.endpoint.identifier);
    });

    this.activeCall.on(CallsApiEvent.PARTICIPANT_MUTED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' is now muted';
      console.log('Participant ' + event.participant.endpoint.identifier + ' is now muted');
    });
    this.activeCall.on(CallsApiEvent.PARTICIPANT_UNMUTED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' is now unmuted';
      console.log('Participant ' + event.participant.endpoint.identifier + ' is now unmuted');
    });

    this.activeCall.on(CallsApiEvent.CAMERA_VIDEO_ADDED, event => {
      this.status = 'Participant added local camera video';
      console.log('Participant added local camera video');
      this.setMediaStream(this.localCameraVideo, event.stream);
    });
    this.activeCall.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, event => {
      this.status = 'Participant updated local camera video';
      console.log('Participant updated local camera video');
      this.setMediaStream(this.localCameraVideo, event.stream);
    });
    this.activeCall.on(CallsApiEvent.CAMERA_VIDEO_REMOVED, () => {
      this.status = 'Participant removed local camera video';
      console.log('Participant removed local camera video');
      this.setMediaStream(this.localCameraVideo, null);
    });

    this.activeCall.on(CallsApiEvent.SCREEN_SHARE_ADDED, event => {
      this.status = 'Participant added local screenshare';
      console.log('Participant added local screenshare');
      this.setMediaStream(this.localScreenShare, event.stream);
    });
    this.activeCall.on(CallsApiEvent.SCREEN_SHARE_REMOVED, () => {
      this.status = 'Participant removed local screenshare';
      console.log('Participant removed local screenshare');
      this.setMediaStream(this.localScreenShare, null);
    });

    this.activeCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_ADDED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' added camera video';
      console.log('Participant ' + event.participant.endpoint.identifier + ' added camera video');
      this.updateParticipant(event.participant.endpoint.identifier, {camera: event.stream});
    });
    this.activeCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_REMOVED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' removed camera video';
      console.log('Participant ' + event.participant.endpoint.identifier + ' removed camera video');
      this.updateParticipant(event.participant.endpoint.identifier, {camera: null});
    });

    this.activeCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_ADDED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' added screenshare';
      console.log('Participant ' + event.participant.endpoint.identifier + ' added screenshare');
      this.updateParticipant(event.participant.endpoint.identifier, {screenShare: event.stream});
    });
    this.activeCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_REMOVED, event => {
      this.status = 'Participant ' + event.participant.endpoint.identifier + ' removed screenshare';
      console.log('Participant ' + event.participant.endpoint.identifier + ' removed screenshare');
      this.updateParticipant(event.participant.endpoint.identifier, {screenShare: null});
    });

    this.activeCall.on(CallsApiEvent.NETWORK_QUALITY_CHANGED, event => {
      console.log('Local network quality has changed: ' + NetworkQuality[event.networkQuality]);
    });
    this.activeCall.on(CallsApiEvent.PARTICIPANT_NETWORK_QUALITY_CHANGED, event => {
      console.log('Network quality of ' + event.participant.endpoint.identifier + ' has changed: ' + NetworkQuality[event.networkQuality]);
    });

    this.activeCall.on(CallsApiEvent.RECONNECTING, () => {
      this.status = 'Reconnecting...';
      console.log('Reconnecting...');
    });
    this.activeCall.on(CallsApiEvent.RECONNECTED, () => {
      this.status = 'Established';
      console.log('Reconnected');
    });
    this.activeCall.on(CallsApiEvent.PARTICIPANT_DISCONNECTED, event => {
      console.log('Participant ' + event.participant.endpoint.identifier + ' disconnected');
    });
    this.activeCall.on(CallsApiEvent.PARTICIPANT_RECONNECTED, event => {
      console.log('Participant ' + event.participant.endpoint.identifier + ' reconnected');
    });
  };

  hangup() {
    this.activeCall.hangup();
  };

  setValuesAfterCall() {
    this.status = null;
    this.activeCall = null;
    this.isCallEstablished = false;
    this.isIncomingCall = false;
    this.selectedAudioQualityMode = 'Auto';
  }

  setValuesAfterLeavingConferenceOrDialog() {
    this.participants = [];
    this.remoteVideos = [];
  }

  removeAllMediaStreams() {
    // @ts-ignore
    this.remoteAudio.nativeElement.srcObject = null;
    // @ts-ignore
    this.localCameraVideo.nativeElement.srcObject = null;
    // @ts-ignore
    this.localScreenShare.nativeElement.srcObject = null;
  }

  setMediaStream(element, stream) {
    element.nativeElement.srcObject = stream;
  }

  toggleScreenShare() {
    this.activeCall.screenShare(!this.activeCall.hasScreenShare())
      .catch(error => console.log('Error toggling screen share {}', error));
  }

  toggleCameraVideo() {
    this.activeCall.cameraVideo(!this.activeCall.hasCameraVideo())
      .catch(error => console.log('Error toggling camera video {}', error));
  }

  addParticipant(identifier) {
    this.participants.push({identifier});
  }

  removeParticipant(identifier) {
    this.participants = this.participants.filter(participant => participant.identifier !== identifier);
  }

  updateParticipant(identifier, fields) {
    const participantToUpdate = this.participants.find(participant => participant.identifier === identifier);
    if (participantToUpdate) Object.assign(participantToUpdate, fields);
    this.updateRemoteVideos();
  }

  updateRemoteVideos() {
    this.remoteVideos = this.participants.reduce((remoteVideos, participant) => [
      ...[
        {participant, video: participant.camera},
        {participant, video: participant.screenShare}
      ].filter(({video}) => video != null),
      ...remoteVideos
    ], []);
  }

  shouldShowLocalVideos() {
    return this.activeCall && (this.activeCall.hasCameraVideo() || this.activeCall.hasScreenShare());
  }

  shouldShowRemoteVideos() {
    return this.activeCall && this.remoteVideos.length > 0
  }

  accept() {
    (this.activeCall as IncomingApplicationCall).accept(
      ApplicationCallOptions.builder().setVideo(true).setAutoReconnect(true).build()
    );
  };

  decline() {
    (this.activeCall as IncomingApplicationCall).decline();
  };

  shouldShowButtonsOnIncomingCall() {
    return !this.isCallEstablished && this.isIncomingCall;
  };

  shouldShowCallActions() {
    return this.isCallEstablished;
  }

  onAudioInputDeviceChange = async () => {
    if (this.activeCall != null) {
      await this.activeCall.setAudioInputDevice(this.selectedAudioInputDevice)
    }
  }

  onAudioQualityChange = () => {
    if (this.activeCall != null) {
      this.activeCall.setAudioQualityMode(this.audioQualityModes[this.selectedAudioQualityMode])
    }
  }
}
