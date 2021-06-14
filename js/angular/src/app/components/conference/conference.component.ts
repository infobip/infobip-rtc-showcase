import {Component, ViewChild} from '@angular/core';
import {Conference, ConferenceOptions, InfobipRTC} from 'infobip-rtc';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-conference',
  templateUrl: './conference.component.html'
})
export class ConferenceComponent {
  @ViewChild('remoteAudio') remoteAudio: HTMLAudioElement;

  title = 'Infobip RTC Conference Showcase';

  infobipRTC: InfobipRTC = null;
  identity = '';
  conferenceId = '';
  activeConference: Conference = null;
  status = '';

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

        console.log('Event: ' + event);

        this.setMediaStream(this.activeConference, event);
      });
      this.activeConference.on('left', event => {
        this.status = 'Left conference with ID: ' + this.conferenceId;
        console.log('Left conference with ID: ' + this.conferenceId);
        this.removeMediaStream();
        this.setValuesAfterLeavingConference();
      });
      this.activeConference.on('user-joined', event => {
        this.status = 'User ' + event.user.identity + ' joined conference';
        console.log('User ' + event.user.identity + ' joined conference');
      });
      this.activeConference.on('user-left', event => {
        this.status = 'User ' + event.user.identity + ' left conference';
        console.log('User ' + event.user.identity + ' left conference');
      });
      this.activeConference.on('user-muted', event => {
        this.status = 'User ' + event.user.identity + ' is now muted';
        console.log('User ' + event.user.identity + ' is now muted');
      });
      this.activeConference.on('user-unmuted', event => {
        this.status = 'User ' + event.user.identity + ' is now unmuted';
        console.log('User ' + event.user.identity + ' is now unmuted');
      });
      this.activeConference.on('error', event => {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        this.removeMediaStream();
        this.setValuesAfterLeavingConference();
      });
    }
  };

  onChange = (event) => {
    this.conferenceId = event.target.value;
  };

  join = () => {
    if (this.conferenceId) {
      const conferenceOptions = ConferenceOptions.builder()
        .setVideo(false)
        .build();

      this.activeConference = this.infobipRTC.joinConference(this.conferenceId, conferenceOptions);

      this.listenForConferenceEvents();
    }
  };

  leave = () => {
    this.activeConference.leave();
  };

  shouldDisableLeaveButton = () => {
    return !this.activeConference;
  };

  private setValuesAfterLeavingConference() {
    this.status = null;
    this.activeConference = null;
  }

  setMediaStream = (call, event) => {
    // @ts-ignore
    this.remoteAudio.nativeElement.srcObject = event.stream;
  }

  removeMediaStream() {
    // @ts-ignore
    this.remoteAudio.nativeElement.srcObject = null;
  }
}
