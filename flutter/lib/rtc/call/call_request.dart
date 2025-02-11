import 'call_listener.dart';

class PhoneCallRequest {
  final String token;
  final String destination;
  final PhoneCallEventListener eventListener;

  PhoneCallRequest(this.token, this.destination, this.eventListener);
}

class WebrtcCallRequest {
  final String token;
  final String destination;
  final WebrtcCallEventListener eventListener;

  const WebrtcCallRequest(this.token, this.destination, this.eventListener);
}