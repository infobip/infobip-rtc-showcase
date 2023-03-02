import {Component, OnInit, ViewChild} from '@angular/core';
import {
  createInfobipRtc,
  InfobipRTC,
  PhoneCallOptions,
  CallsApiEvent,
  PhoneCall
} from 'infobip-rtc';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-call',
  templateUrl: './phone-call.component.html'
})
export class PhoneCallComponent implements OnInit {
  @ViewChild('remoteAudio') remoteAudio: HTMLAudioElement;

  title = 'Infobip RTC Call Showcase';

  destination = '';
  infobipRTC: InfobipRTC = null;
  activeCall: PhoneCall = null;
  identity = '';
  status = '';
  isCallEstablished = false;
  isOutgoingCall = false;

  constructor(private httpClient: HttpClient) {
    this.connectInfobipRTC();
  }

  ngOnInit = () => {
  }

  connectInfobipRTC = () => {
    this.httpClient.post('http://localhost:8080/token', {})
      .toPromise()
      .then((response: Response) => {
        // @ts-ignore
        this.infobipRTC = createInfobipRtc(response.token, { debug: true });
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

  listenForPhoneCallEvents = () => {
    this.activeCall.on(CallsApiEvent.RINGING, () => {
      this.status = 'Ringing...';
      console.log('Call is ringing...');
    });
    this.activeCall.on(CallsApiEvent.ESTABLISHED, event => {
      this.status = 'Call established with: ' + this.destination;
      console.log('Call established with ' + this.destination);
      this.isCallEstablished = true;
      this.setMediaStream(this.remoteAudio, event.stream);
    });
    this.activeCall.on(CallsApiEvent.HANGUP, event => {
      this.status = 'Call finished: ' + event.errorCode.name;
      console.log('Call finished: ' + event.errorCode.name);
      this.removeMediaStream();
      this.setValuesAfterCall();
    });
    this.activeCall.on(CallsApiEvent.ERROR, event => {
      console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });
  };

  setMediaStream = (element, stream) => {
    element.nativeElement.srcObject = stream;
  }

  removeMediaStream = () => {
    // @ts-ignore
    this.remoteAudio.nativeElement.srcObject = null;
  }

  onChange = (event) => {
    this.destination = event.target.value;
  };

  callPhoneNumber = () => {
    if (this.destination) {
      const phoneCallOptions = PhoneCallOptions.builder()
        .setFrom('33712345678')
        .build();

      this.activeCall = this.infobipRTC.callPhone(this.destination, phoneCallOptions);

      this.listenForPhoneCallEvents();
    }
  };

  hangup = () => {
    this.activeCall.hangup();
  };

  shouldDisableHangupButton = () => {
    return !this.activeCall || !this.isCallEstablished;
  };

  private setValuesAfterCall = () => {
    this.status = null;
    this.activeCall = null;
    this.isCallEstablished = false;
    this.isOutgoingCall = false;
  }
}
