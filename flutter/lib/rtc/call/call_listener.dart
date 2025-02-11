import 'call_event.dart';

abstract class CallEventListener {
  void onRinging();
  void onEarlyMedia();
  void onEstablished();
  void onHangup(CallHangupEvent callHangupEvent);
  void onError(ErrorEvent errorEvent);
  void onReconnecting();
  void onReconnected();
  void onCallRecordingStarted();
}

abstract class PhoneCallEventListener extends CallEventListener {
}

abstract class WebrtcCallEventListener extends CallEventListener {
  void onCameraVideoAdded();
  void onCameraVideoUpdated();
  void onCameraVideoRemoved();

  void onScreenShareAdded();
  void onScreenShareRemoved();

  void onRemoteCameraVideoAdded();
  void onRemoteCameraVideoRemoved();

  void onRemoteScreenShareAdded();
  void onRemoteScreenShareRemoved();

  void onRemoteMuted();
  void onRemoteUnmuted();

  void onRemoteDisconnected();
  void onRemoteReconnected();
}

abstract class IncomingCallEventListener {
  void onIncomingWebrtcCall(IncomingWebrtcCallEvent incomingWebrtcCallEvent);
}