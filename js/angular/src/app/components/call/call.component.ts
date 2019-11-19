import {Component, OnInit, ViewChild} from '@angular/core';
import {Call, IncomingCall, InfobipRTC} from 'infobip-rtc';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html'
})
export class CallComponent implements OnInit {
  @ViewChild('remoteAudio') remoteAudio: HTMLAudioElement;

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
    this.infobipRTC.on('incoming-call', incomingCall => {
      console.log('Received incoming call from: ' + incomingCall.source().identity);

      that.activeCall = incomingCall;
      that.isIncomingCall = true;
      that.status = 'Incoming call from: ' + incomingCall.source().identity;

      incomingCall.on('established', () => {
        // @ts-ignore
        that.remoteAudio.nativeElement.srcObject = incomingCall.remoteStream;
        that.status = 'In a call with: ' + incomingCall.source().identity;
        that.isCallEstablished = true;
      });
      incomingCall.on('hangup', () => {
        that.setValuesAfterIncomingCall();
      });
      incomingCall.on('error', event => {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
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
        // @ts-ignore
        that.remoteAudio.nativeElement.srcObject = event.remoteStream;
      });
      this.activeCall.on('hangup', event => {
        that.setValuesAfterOutgoingCall();
      });
      this.activeCall.on('ringing', () => {
        that.status = 'Ringing...';
        console.log('Call is ringing...');
      });
      this.activeCall.on('error', event => {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        that.setValuesAfterOutgoingCall();
      });
    }
  };

  onChange = (event) => {
    this.destination = event.target.value;
  };

  call = () => {
    if (this.destination) {
      this.activeCall = this.infobipRTC.call(this.destination, {});
      this.isOutgoingCall = true;

      this.listenForCallEvents();
    }
  };

  callPhoneNumber = () => {
    if (this.destination) {
      this.activeCall = this.infobipRTC.callPhoneNumber(this.destination, {from: '33755531044'});

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
