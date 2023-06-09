import {Component, OnInit, ViewChild} from '@angular/core';
import {
  CallsApiEvent,
  createInfobipRtc,
  IncomingWebrtcCall,
  InfobipRTC,
  InfobipRTCEvent,
  WebrtcCall,
  WebrtcCallOptions
} from 'infobip-rtc';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-call',
  templateUrl: './webrtc-call.component.html'
})
export class WebrtcCallComponent implements OnInit {
  @ViewChild('remoteAudio') remoteAudio: HTMLAudioElement;
  @ViewChild('localCameraVideo') localCameraVideo: HTMLVideoElement;
  @ViewChild('localScreenShare') localScreenShare: HTMLVideoElement;
  @ViewChild('remoteCameraVideo') remoteCameraVideo: HTMLVideoElement;
  @ViewChild('remoteScreenShare') remoteScreenShare: HTMLVideoElement;

  title = 'Infobip RTC Call Showcase';

  destination = '';
  infobipRTC: InfobipRTC = null;
  activeCall: WebrtcCall = null;
  identity = '';
  status = '';
  isCallEstablished = false;
  isIncomingCall = false;
  iPhoneOrIpad = false;

  constructor(private httpClient: HttpClient) {
    this.connectInfobipRTC();
  }

  ngOnInit = () => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
      this.iPhoneOrIpad = true;
      // @ts-ignore
      this.remoteCameraVideo.nativeElement.muted = true;
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
        this.infobipRTC = createInfobipRtc(response.token, { debug: true });
        this.infobipRTC.on(InfobipRTCEvent.CONNECTED, event => {
          this.identity = event.identity;
          console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
        });
        this.infobipRTC.on(InfobipRTCEvent.DISCONNECTED, event => {
          console.warn('Disconnected from Infobip RTC Cloud.');
        });
        this.infobipRTC.connect();
        this.listenForIncomingWebrtcCall();
      })
  };

  listenForIncomingWebrtcCall = () => {
    this.infobipRTC.on(InfobipRTCEvent.INCOMING_WEBRTC_CALL, incomingCallEvent => {
      const incomingWebrtcCall = incomingCallEvent.incomingCall;
      console.log('Received incoming call from: ' + incomingWebrtcCall.source().identifier);

      this.activeCall = incomingWebrtcCall;
      this.isIncomingCall = true;
      this.status = 'Incoming ' + (incomingWebrtcCall.options().video ? 'video' : 'audio') +
        ' call from: ' + incomingWebrtcCall.source().identifier;

      this.listenForWebrtcCallEvents();
    });
  };

  listenForWebrtcCallEvents = () => {
    this.activeCall.on(CallsApiEvent.RINGING, () => {
      this.status = 'Ringing...';
      console.log('Call is ringing...');
    });
    this.activeCall.on(CallsApiEvent.ESTABLISHED, event => {
      this.status = 'Call established with: ' + this.activeCall.counterpart().identifier;
      console.log('Call established with ' + this.activeCall.counterpart().identifier);
      this.isCallEstablished = true;
      this.setMediaStream(this.remoteAudio, event.stream);
    });
    this.activeCall.on(CallsApiEvent.HANGUP, event => {
      this.status = 'Call finished' + event.errorCode.name;
      console.log('Call finished' + event.errorCode.name);
      this.removeAllMediaStreams();
      this.setValuesAfterCall();
    });
    this.activeCall.on(CallsApiEvent.ERROR, event => {
      console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });

    this.activeCall.on(CallsApiEvent.CAMERA_VIDEO_ADDED, event => {
      this.status = 'Local camera video has been added';
      console.log('Local camera video has been added');
      this.setMediaStream(this.localCameraVideo, event.stream);
    });
    this.activeCall.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, event => {
      this.status = 'Local camera video has been updated';
      console.log('Local camera video has been updated');
      this.setMediaStream(this.localCameraVideo, event.stream);
    });
    this.activeCall.on(CallsApiEvent.CAMERA_VIDEO_REMOVED, () => {
      this.status = 'Local camera video has been removed';
      console.log('Local camera video has been removed');
      this.setMediaStream(this.localCameraVideo, null);
    });

    this.activeCall.on(CallsApiEvent.SCREEN_SHARE_ADDED, event => {
      this.status = 'Local screenshare has been added';
      console.log('Local screenshare has been added');
      this.setMediaStream(this.localScreenShare, event.stream);
    });
    this.activeCall.on(CallsApiEvent.SCREEN_SHARE_REMOVED, () => {
      this.status = 'Local screenshare has been removed';
      console.log('Local screenshare has been removed');
      this.setMediaStream(this.localScreenShare, null);
    });

    this.activeCall.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_ADDED, event => {
      this.status = 'Remote camera video has been added';
      console.log('Remote camera video has been added');
      this.setMediaStream(this.remoteCameraVideo, event.stream);
    });
    this.activeCall.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_REMOVED, () => {
      this.status = 'Remote camera video has been removed';
      console.log('Remote camera video has been added');
      this.setMediaStream(this.remoteCameraVideo, null);
    });

    this.activeCall.on(CallsApiEvent.REMOTE_SCREEN_SHARE_ADDED, event => {
      this.status = 'Remote screenshare has been added';
      console.log('Remote screenshare has been added');
      this.setMediaStream(this.remoteScreenShare, event.stream);
    });
    this.activeCall.on(CallsApiEvent.REMOTE_SCREEN_SHARE_REMOVED, () => {
      this.status = 'Remote screenshare has been removed';
      console.log('Remote screenshare has been removed');
      this.setMediaStream(this.remoteScreenShare, null);
    });

    this.activeCall.on(CallsApiEvent.REMOTE_MUTED, () => {
      this.status = 'Remote participant has been muted';
      console.log('Remote participant has been muted');
    });
    this.activeCall.on(CallsApiEvent.REMOTE_UNMUTED, () => {
      this.status = 'Remote participant has been unmuted';
      console.log('Remote participant has been unmuted');
    });
  };

  removeAllMediaStreams = () => {
    // @ts-ignore
    this.remoteAudio.nativeElement.srcObject = null;
    // @ts-ignore
    this.localCameraVideo.nativeElement.srcObject = null;
    // @ts-ignore
    this.localScreenShare.nativeElement.srcObject = null;
    // @ts-ignore
    this.remoteCameraVideo.nativeElement.srcObject = null;
    // @ts-ignore
    this.remoteScreenShare.nativeElement.srcObject = null;
  }

  setMediaStream(element, stream) {
    element.nativeElement.srcObject = stream;
  }

  onChange = (event) => {
    this.destination = event.target.value;
  };

  call = (video = false) => {
    if (this.destination) {
      const webrtcCallOptions = WebrtcCallOptions.builder()
        .setVideo(video)
        .build();

      this.activeCall = this.infobipRTC.callWebrtc(this.destination, webrtcCallOptions);

      this.listenForWebrtcCallEvents();
    }
  };

  hangup = () => {
    this.activeCall.hangup();
  };

  accept = () => {
    (this.activeCall as IncomingWebrtcCall).accept();
  };

  decline = () => {
    (this.activeCall as IncomingWebrtcCall).decline();
  };

  shouldShowButtonsOnIncomingCall = () => {
    return !this.isCallEstablished && this.isIncomingCall;
  };

  shouldDisableHangupButton = () => {
    return !this.activeCall || (!this.isCallEstablished && this.isIncomingCall);
  };

  toggleCameraVideo = () => {
    this.activeCall.cameraVideo(!this.activeCall.hasCameraVideo());
  }

  toggleShareScreen = () => {
    this.activeCall.screenShare(!this.activeCall.hasScreenShare());
  }

  private setValuesAfterCall = () => {
    this.status = null;
    this.activeCall = null;
    this.isCallEstablished = false;
    this.isIncomingCall = false;
  }

  shouldShowLocalVideos = () => {
    return this.activeCall && (this.activeCall.hasCameraVideo() || this.activeCall.hasScreenShare());
  }

  shouldShowRemoteVideos = () => {
    return this.activeCall && (this.activeCall.hasRemoteCameraVideo() || this.activeCall.hasRemoteScreenShare());
  }
}
