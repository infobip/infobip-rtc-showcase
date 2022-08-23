import {Component, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {Conference, ConferenceOptions, InfobipRTC} from 'infobip-rtc';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-conference',
  templateUrl: './conference.component.html'
})
export class ConferenceComponent {
  @ViewChild('remoteAudio') remoteAudio: HTMLAudioElement;
  @ViewChild('localCameraVideo') localCameraVideo: HTMLVideoElement;
  @ViewChild('localScreenShare') localScreenShare: HTMLVideoElement;

  title = 'Infobip RTC Conference Showcase';

  infobipRTC: InfobipRTC = null;
  identity = '';
  conferenceId = '';
  activeConference: Conference = null;
  users = [];
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
        this.infobipRTC = new InfobipRTC(response.token, {debug: true});
        this.infobipRTC.on('connected', event => {
          this.identity = event.identity;
          console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
        });
        this.infobipRTC.on('disconnected', event => {
          console.warn('Disconnected from Infobip RTC Cloud.');
        });
        this.infobipRTC.connect();
      })
  };

  listenForConferenceEvents = () => {
    if (this.activeConference) {
      this.activeConference.on('joined', event => {
        this.status = 'Joined conference with ID: ' + this.conferenceId;
        console.log('Joined conference with ID: ' + this.conferenceId);
        event.users.forEach(user => this.addUser(user.identity));
        this.setMediaStream(this.remoteAudio, event.stream);
      });
      this.activeConference.on('left', event => {
        this.status = 'Left conference with ID: ' + this.conferenceId;
        console.log('Left conference with ID: ' + this.conferenceId);
        this.setValuesAfterLeavingConference();
      });
      this.activeConference.on('user-joined', event => {
        this.status = 'User ' + event.user.identity + ' joined conference';
        console.log('User ' + event.user.identity + ' joined conference');
        this.addUser(event.user.identity);
      });
      this.activeConference.on('user-left', event => {
        this.status = 'User ' + event.user.identity + ' left conference';
        console.log('User ' + event.user.identity + ' left conference');
        this.removeUser(event.user.identity);
      });
      this.activeConference.on('user-muted', event => {
        this.status = 'User ' + event.user.identity + ' is now muted';
        console.log('User ' + event.user.identity + ' is now muted');
      });
      this.activeConference.on('user-unmuted', event => {
        this.status = 'User ' + event.user.identity + ' is now unmuted';
        console.log('User ' + event.user.identity + ' is now unmuted');
      });

      this.activeConference.on('local-camera-video-added', event => {
        this.status = 'User added local camera video';
        console.log('User added local camera video');
        this.setMediaStream(this.localCameraVideo, event.stream);
      });
      // @ts-ignore
      this.activeConference.on('local-camera-video-removed', event => {
        this.status = 'User removed local camera video';
        console.log('User removed local camera video');
        this.setMediaStream(this.localCameraVideo, null);
      });
      this.activeConference.on('local-screenshare-added', event => {
        this.status = 'User added local screenshare';
        console.log('User added local screenshare');
        this.setMediaStream(this.localScreenShare, event.stream);
      });
      // @ts-ignore
      this.activeConference.on('local-screenshare-removed', event => {
        this.status = 'User removed local screenshare';
        console.log('User removed local screenshare');
        this.setMediaStream(this.localScreenShare, null);
      });

      this.activeConference.on('user-camera-video-added', event => {
        this.status = 'User ' + event.user.identity + ' added camera video';
        console.log('User ' + event.user.identity + ' added camera video');
        this.updateUser(event.user.identity, {camera: event.stream});
      });
      this.activeConference.on('user-camera-video-removed', event => {
        this.status = 'User ' + event.user.identity + ' removed camera video';
        console.log('User ' + event.user.identity + ' removed camera video');
        this.updateUser(event.user.identity, {camera: null});
      });
      this.activeConference.on('user-screenshare-added', event => {
        this.status = 'User ' + event.user.identity + ' added screenshare';
        console.log('User ' + event.user.identity + ' added screenshare');
        this.updateUser(event.user.identity, {screenShare: event.stream});
      });
      this.activeConference.on('user-screenshare-removed', event => {
        this.status = 'User ' + event.user.identity + ' removed screenshare';
        console.log('User ' + event.user.identity + ' removed screenshare');
        this.updateUser(event.user.identity, {screenShare: null});
      });

      this.activeConference.on('error', event => {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
      });
      this.activeConference.on('reconnecting', () => {
        this.status = 'You are being disconnected from conference with ID: ' + this.conferenceId + '. We will try to get you back...';
        console.log('You are being disconnected from conference with ID: ' + this.conferenceId + '. We will try to get you back...');
        this.users = [];
      });
      this.activeConference.on('reconnected', event => {
        this.status = 'Reconnected to conference with ID: ' + this.conferenceId;
        console.log('Reconnected to conference with ID: ' + this.conferenceId);
        event.users?.forEach(user => this.addUser(user.identity));
        this.setMediaStream(this.remoteAudio, event.stream);
      });
    }
  };

  onChange = (event) => {
    this.conferenceId = event.target.value;
  };

  join = (video = false) => {
    if (this.conferenceId) {
      const conferenceOptions = ConferenceOptions.builder()
        .setVideo(video)
        .setAutoReconnect(true)
        .build();

      this.activeConference = this.infobipRTC.joinConference(this.conferenceId, conferenceOptions);

      this.listenForConferenceEvents();
    }
  };

  leave = () => {
    this.activeConference.leave();
  };

  setValuesAfterLeavingConference() {
    this.status = null;
    this.activeConference = null;
    this.users = [];
    this.remoteVideos = [];
  }

  setMediaStream(element, stream) {
    element.nativeElement.srcObject = stream;
  }

  toggleShareScreen() {
    this.activeConference.screenShare(!this.activeConference.hasScreenShare())
      .catch(error => console.log('Error toggling screen share {}', error));
  }

  toggleCameraVideo() {
    this.activeConference.cameraVideo(!this.activeConference.hasCameraVideo())
      .catch(error => console.log('Error toggling camera video {}', error));
  }

  addUser(identity) {
    this.users.push({identity});
  }

  removeUser(identity) {
    this.users = this.users.filter(user => user.identity !== identity);
  }

  updateUser(identity, fields) {
    const userToUpdate = this.users.find(user => user.identity === identity);
    if (userToUpdate) Object.assign(userToUpdate, fields);
    this.updateRemoteVideos();
  }

  updateRemoteVideos() {
    this.remoteVideos = this.users.reduce((remoteVideos, user) => [
      ...[
        {user, video: user.camera},
        {user, video: user.screenShare}
      ].filter(({video}) => video != null),
      ...remoteVideos
    ], []);
  }

  shouldShowLocalVideos() {
    return this.activeConference && (this.activeConference.hasCameraVideo() || this.activeConference.hasScreenShare());
  }

  shouldShowRemoteVideos() {
    return this.activeConference && this.remoteVideos.length > 0
  }
}
