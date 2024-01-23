import {Component, OnInit, ViewChild} from '@angular/core';
import {
  AudioQualityMode,
  CallsApiEvent,
  createInfobipRtc,
  InfobipRTC,
  InfobipRTCEvent,
  PhoneCall,
  PhoneCallOptions
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

  ngOnInit = () => {
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
        this.loadAudioDevices()
      })
  };

  loadAudioDevices = () => {
    this.infobipRTC.getAudioInputDevices().then(inputDevices => {
      this.audioInputDevices = inputDevices;
      this.selectedAudioInputDevice = inputDevices[0].deviceId
    });
  }

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

  private setValuesAfterCall = () => {
    this.status = null;
    this.activeCall = null;
    this.isCallEstablished = false;
    this.isOutgoingCall = false;
    this.selectedAudioQualityMode = 'Auto'
  }
}
