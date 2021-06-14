import {Component, OnInit, ViewChild} from '@angular/core';
import {Call, CallOptions, CallPhoneNumberOptions, IncomingCall, InfobipRTC} from 'infobip-rtc';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html'
})
export class CallComponent implements OnInit {
  @ViewChild('remoteAudio') remoteAudio: HTMLAudioElement;
  @ViewChild('remoteVideo') remoteVideo: HTMLVideoElement;
  @ViewChild('localVideo') localVideo: HTMLVideoElement;

  title = 'Infobip RTC Call Showcase';

  destination = '';
  infobipRTC: InfobipRTC = null;
  activeCall: Call = null;
  identity = '';
  status = '';
  isCallEstablished = false;
  isOutgoingCall = false;
  isIncomingCall = false;
  iPhoneOrIpad = false;

  constructor(private httpClient: HttpClient) {
    this.connectInfobipRTC();
  }

  ngOnInit(): void {
    const userAgent = window.navigator.userAgent;
    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
      this.iPhoneOrIpad = true;
      // @ts-ignore
      this.remoteVideo.nativeElement.muted = true;
    }
  }

  unmuteVideo = () => {
    // @ts-ignore
    this.remoteVideo.nativeElement.muted = false;
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
        this.listenForIncomingCall();
      })
  };

  listenForIncomingCall = () => {
    this.infobipRTC.on('incoming-call', incomingCallEvent => {
      const incomingCall = incomingCallEvent.incomingCall;
      console.log('Received incoming call from: ' + incomingCall.source().identity);

      this.activeCall = incomingCall;
      this.isIncomingCall = true;
      this.status = 'Incoming ' + (incomingCall.options.video ? 'video' : 'audio') + ' call from: ' + incomingCall.source().identity;

      incomingCall.on('established', event => {
        this.setMediaStream(incomingCall, event);
        this.status = 'In a call with: ' + incomingCall.source().identity;
        this.isCallEstablished = true;
      });
      incomingCall.on('hangup', () => {
        this.removeMediaStream();
        this.setValuesAfterIncomingCall();
      });
      incomingCall.on('updated', event => {
        this.setMediaStream(incomingCall, event);
      });
      incomingCall.on('error', event => {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        this.removeMediaStream();
        this.setValuesAfterIncomingCall();
      });
    });
  };

  listenForCallEvents = () => {
    if (this.activeCall) {
      this.activeCall.on('established', event => {
        this.status = 'Call established with: ' + this.destination;
        console.log('Call established with ' + this.destination);

        // @ts-ignore
        that.setMediaStream(this.activeCall, event);
      });
      this.activeCall.on('hangup', event => {
        this.removeMediaStream();
        this.setValuesAfterOutgoingCall();
      });
      this.activeCall.on('ringing', () => {
        this.status = 'Ringing...';
        console.log('Call is ringing...');
      });
      this.activeCall.on('updated', event => {
        this.setMediaStream(this.activeCall, event);
      });
      this.activeCall.on('error', event => {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        this.removeMediaStream();
        this.setValuesAfterOutgoingCall();
      });
    }
  };

  removeMediaStream() {
    // @ts-ignore
    this.localVideo.nativeElement.srcObject = null;
    // @ts-ignore
    this.remoteVideo.nativeElement.srcObject = null;
    // @ts-ignore
    this.remoteAudio.nativeElement.srcObject = null;
  }

  setMediaStream = (call, event) => {
    if (call.hasLocalVideo()) {
      // @ts-ignore
      this.localVideo.nativeElement.srcObject = event.localStream;
    } else {
      // @ts-ignore
      this.localVideo.nativeElement.srcObject = null;
    }

    if(call.hasRemoteVideo()) {
      // @ts-ignore
      this.remoteVideo.nativeElement.srcObject = event.remoteStream;
      // @ts-ignore
      this.remoteAudio.nativeElement.srcObject = null;
    } else {
      // @ts-ignore
      this.remoteVideo.nativeElement.srcObject = null;
      // @ts-ignore
      this.remoteAudio.nativeElement.srcObject = event.remoteStream;
    }
  }

  onChange = (event) => {
    this.destination = event.target.value;
  };

  call = (video = false) => {
    if (this.destination) {
      const callOptions = CallOptions.builder()
        .setVideo(video)
        .build();

      this.activeCall = this.infobipRTC.call(this.destination, callOptions);
      this.isOutgoingCall = true;

      this.listenForCallEvents();
    }
  };

  callPhoneNumber = () => {
    if (this.destination) {
      const callPhoneNumberOptions = CallPhoneNumberOptions.builder()
        .setFrom('33712345678')
        .build();
      this.activeCall = this.infobipRTC.callPhoneNumber(this.destination, callPhoneNumberOptions);

      this.listenForCallEvents();
    }
  };

  hangup = () => {
    this.activeCall.hangup();
  };

  accept = () => {
    (this.activeCall as IncomingCall).accept();
  };

  decline = () => {
    (this.activeCall as IncomingCall).decline();
  };

  shouldDisableButtonsOnIncomingCall = () => {
    return this.isCallEstablished || this.isOutgoingCall || !this.isIncomingCall;
  };

  shouldDisableHangupButton = () => {
    return !this.activeCall || (!this.isCallEstablished && this.isIncomingCall);
  };

  toggleShareScreen = () => {
    this.activeCall.screenShare(!this.activeCall.hasScreenShare());
  }

  private setValuesAfterIncomingCall() {
    this.status = null;
    this.activeCall = null;
    this.isCallEstablished = false;
    this.isIncomingCall = false;
  }

  private setValuesAfterOutgoingCall() {
    this.status = null;
    this.activeCall = null;
    this.isOutgoingCall = false;
  }
}
