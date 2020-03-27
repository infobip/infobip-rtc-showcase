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

  destination = '';
  infobipRTC: InfobipRTC = null;
  activeCall: Call = null;
  identity = '';
  status = '';
  isCallEstablished = false;
  isOutgoingCall = false;
  isIncomingCall = false;

  constructor(private httpClient: HttpClient) {
    this.connectInfobipRTC();
  }

  ngOnInit(): void {
  }

  connectInfobipRTC = async () => {
    this.httpClient.post('http://localhost:8080/token', {})
      .toPromise()
      .then((response: Response) => {
        const that = this;
        // @ts-ignore
        this.infobipRTC = new InfobipRTC(response.token, {debug: true});
        this.infobipRTC.on('connected', event => {
          that.identity = event.identity;
          console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
        });
        this.infobipRTC.on('disconnected', event => {
          console.warn('Disconnected from Infobip RTC Cloud.');
        });
        this.infobipRTC.connect();
        this.listenForIncomingCall();
      });
  };

  listenForIncomingCall = () => {
    const that = this;
    this.infobipRTC.on('incoming-call', incomingCallEvent => {
      const incomingCall = incomingCallEvent.incomingCall;
      console.log('Received incoming call from: ' + incomingCall.source().identity);

      that.activeCall = incomingCall;
      that.isIncomingCall = true;
      that.status = 'Incoming ' + (incomingCall.options.video ? 'video' : 'audio') + ' call from: ' + incomingCall.source().identity;

      incomingCall.on('established', event => {
        that.setMediaStream(incomingCall, event);
        that.status = 'In a call with: ' + incomingCall.source().identity;
        that.isCallEstablished = true;
      });
      incomingCall.on('hangup', () => {
        that.removeMediaStream();
        that.setValuesAfterIncomingCall();
      });
      incomingCall.on('error', event => {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        that.removeMediaStream();
        that.setValuesAfterIncomingCall();
      });
    });
  };

  listenForCallEvents = () => {
    if (this.activeCall) {
      const that = this;
      this.activeCall.on('established', event => {
        that.status = 'Call established with: ' + that.destination;
        console.log('Call established with ' + that.destination);
        that.setMediaStream(this.activeCall, event);
      });
      this.activeCall.on('hangup', event => {
        that.removeMediaStream();
        that.setValuesAfterOutgoingCall();
      });
      this.activeCall.on('ringing', () => {
        that.status = 'Ringing...';
        console.log('Call is ringing...');
      });
      this.activeCall.on('error', event => {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        that.removeMediaStream();
        that.setValuesAfterOutgoingCall();
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
    if (call.options.video) {
      // @ts-ignore
      this.localVideo.nativeElement.srcObject = event.localStream;
      // @ts-ignore
      this.remoteVideo.nativeElement.srcObject = event.remoteStream;
    } else {
      // @ts-ignore
      this.remoteAudio.nativeElement.srcObject = event.remoteStream;
    }
  };

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
