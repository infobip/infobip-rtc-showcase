import 'dart:convert';
import 'dart:developer' as developer;

import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:infobip_rtc_flutter_showcase/rtc/call/call_options.dart';
import 'package:json_annotation/json_annotation.dart';

import 'call_listener.dart';
import 'call_event.dart';

part 'call.g.dart';

@JsonSerializable()
class PhoneEndpoint {
  final String phoneNumber;

  const PhoneEndpoint(this.phoneNumber);

  factory PhoneEndpoint.fromJson(Map<String, dynamic> json) => _$PhoneEndpointFromJson(json);

  Map<String, dynamic> toJson() => _$PhoneEndpointToJson(this);
}

@JsonSerializable()
class WebrtcEndpoint {
  final String identity;
  final String? displayName;

  const WebrtcEndpoint(this.identity, this.displayName);

  factory WebrtcEndpoint.fromJson(Map<String, dynamic> json) => _$WebrtcEndpointFromJson(json);

  Map<String, dynamic> toJson() => _$WebrtcEndpointToJson(this);
}

@JsonSerializable()
class Call with ChangeNotifier {
  static const MethodChannel _callChannel =
  MethodChannel('infobip-rtc-call');
  static const MethodChannel _callEventListenerChannel =
  MethodChannel('infobip-rtc-call-event-listener');

  final String id;
  bool muted;

  @JsonKey(includeFromJson: false, includeToJson: false)
  bool remoteMuted = false;
  @JsonKey(includeFromJson: false, includeToJson: false)
  bool established = false;

  final WebrtcEndpoint source;

  @JsonKey(includeFromJson: false, includeToJson: false)
  CallEventListener? eventListener;

  Call(this.id,
      this.muted,
      this.source);

  Future<void> _onMethodCall(MethodCall call) async { }

  Future<void> mute(bool mute) async {
    muted = mute;
    notifyListeners();
    await _callChannel.invokeMethod('mute', {'mute': mute});
  }

  Future<void> hangup() async {
    return _callChannel.invokeMethod('hangup', {});
  }

  factory Call.fromJson(Map<String, dynamic> json) => _$CallFromJson(json);

  Map<String, dynamic> toJson() => _$CallToJson(this);
}

@JsonSerializable()
class PhoneCall extends Call {
  final PhoneEndpoint destination;
  final PhoneEndpoint counterpart;

  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  PhoneCallEventListener? get eventListener => super.eventListener as PhoneCallEventListener?;

  @override
  set eventListener(CallEventListener? listener) {
    super.eventListener = listener;
  }

  PhoneCall(
      super.id,
      super.muted,
      super.source,
      this.destination,
      this.counterpart) {
    Call._callEventListenerChannel.setMethodCallHandler(_onMethodCall);
  }

  @override
  Future<void> _onMethodCall(MethodCall call) async {
    if (call.method == 'onEvent') {
      _onEvent(call);
    }
  }

  Future<void> _onEvent(MethodCall call) async {
    var map = call.arguments as Map<Object?, Object?>;
    var event = map['event'] as String;
    var data = map['data'] as String?;

    try {
      switch (event) {
        case 'onRinging':
          eventListener?.onRinging();
          break;
        case 'onEarlyMedia':
          eventListener?.onEarlyMedia();
          break;
        case 'onEstablished':
          eventListener?.onEstablished();
          established = true;
          notifyListeners();
          break;
        case 'onHangup':
          eventListener?.onHangup(CallHangupEvent.fromJson(jsonDecode(data!)));
          break;
        case 'onError':
          eventListener?.onError(ErrorEvent.fromJson(jsonDecode(data!)));
          break;
        case 'onCallRecordingStarted':
          eventListener?.onCallRecordingStarted();
          break;
        case 'onReconnecting':
          eventListener?.onReconnecting();
          break;
        case 'onReconnected':
          eventListener?.onReconnected();
          break;
        default:
          throw Exception('Unknown call event! $event');
      }
    } catch (ex) {
      developer.log('Failed to emit call event!', error: ex);
      rethrow;
    }
  }

  factory PhoneCall.fromJson(Map<String, dynamic> json) => _$PhoneCallFromJson(json);

  @override
  Map<String, dynamic> toJson() => _$PhoneCallToJson(this);
}

@JsonSerializable()
class WebrtcCall extends Call {
  final WebrtcEndpoint destination;
  final WebrtcEndpoint counterpart;

  bool hasCameraVideo;
  bool hasRemoteCameraVideo;

  bool hasScreenShare;
  bool hasRemoteScreenShare;

  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  WebrtcCallEventListener? get eventListener => super.eventListener as WebrtcCallEventListener?;

  @override
  set eventListener(CallEventListener? listener) {
    super.eventListener = listener;
  }

  WebrtcCall(
      super.id,
      super.muted,
      super.source,
      this.destination,
      this.counterpart,
      this.hasCameraVideo,
      this.hasRemoteCameraVideo,
      this.hasScreenShare,
      this.hasRemoteScreenShare) {
    Call._callEventListenerChannel.setMethodCallHandler(_onMethodCall);
  }

  @override
  Future<void> _onMethodCall(MethodCall call) async {
    super._onMethodCall(call);
    if (call.method == 'onEvent') {
      _onEvent(call);
    }
  }

  Future<void> _onEvent(MethodCall call) async {
    var map = call.arguments as Map<Object?, Object?>;
    var event = map['event'] as String;
    var data = map['data'] as String?;

    try {
      switch (event) {
        case 'onRinging':
          eventListener?.onRinging();
          break;
        case 'onEarlyMedia':
          eventListener?.onEarlyMedia();
          break;
        case 'onEstablished':
          eventListener?.onEstablished();
          established = true;
          notifyListeners();
          break;
        case 'onHangup':
          eventListener?.onHangup(CallHangupEvent.fromJson(jsonDecode(data!)));
          break;
        case 'onError':
          eventListener?.onError(ErrorEvent.fromJson(jsonDecode(data!)));
          break;
        case 'onCameraVideoAdded':
          eventListener?.onCameraVideoAdded();
          hasCameraVideo = true;
          notifyListeners();
          break;
        case 'onCameraVideoRemoved':
          eventListener?.onCameraVideoRemoved();
          hasCameraVideo = false;
          notifyListeners();
          break;
        case 'onCameraVideoUpdated':
          eventListener?.onCameraVideoUpdated();
          break;
        case 'onScreenShareAdded':
          eventListener?.onScreenShareAdded;
          hasScreenShare = true;
          notifyListeners();
          break;
        case 'onScreenShareRemoved':
          eventListener?.onScreenShareRemoved();
          hasScreenShare = false;
          notifyListeners();
          break;
        case 'onRemoteCameraVideoAdded':
          eventListener?.onRemoteCameraVideoAdded;
          hasRemoteCameraVideo = true;
          notifyListeners();
          break;
        case 'onRemoteCameraVideoRemoved':
          eventListener?.onRemoteCameraVideoRemoved();
          hasRemoteCameraVideo = false;
          notifyListeners();
          break;
        case 'onRemoteScreenShareAdded':
          eventListener?.onRemoteScreenShareAdded;
          hasRemoteScreenShare = true;
          notifyListeners();
          break;
        case 'onRemoteScreenShareRemoved':
          eventListener?.onRemoteScreenShareRemoved();
          hasRemoteScreenShare = false;
          notifyListeners();
          break;
        case 'onRemoteMuted':
          eventListener?.onRemoteMuted();
          remoteMuted = true;
          notifyListeners();
          break;
        case 'onRemoteUnmuted':
          eventListener?.onRemoteUnmuted();
          remoteMuted = false;
          notifyListeners();
          break;
        case 'onCallRecordingStarted':
          eventListener?.onCallRecordingStarted();
          break;
        case 'onReconnecting':
          eventListener?.onReconnecting();
          break;
        case 'onReconnected':
          eventListener?.onReconnected();
          break;
        case 'onRemoteDisconnected':
          eventListener?.onRemoteDisconnected();
          break;
        case 'onRemoteReconnected':
          eventListener?.onRemoteReconnected();
          break;
        default:
          throw Exception('Unknown call event! $event');
      }
    } catch (ex) {
      developer.log('Failed to emit call event!', error: ex);
      rethrow;
    }
  }

  Future<void> cameraVideo(bool cameraVideo) async {
    await Call._callChannel.invokeMethod('cameraVideo', {'cameraVideo': cameraVideo});
  }

  Future<void> screenShare(bool screenShare) async {
    await Call._callChannel.invokeMethod('screenShare', {'screenShare': screenShare});
  }

  factory WebrtcCall.fromJson(Map<String, dynamic> json) => _$WebrtcCallFromJson(json);

  @override
  Map<String, dynamic> toJson() => _$WebrtcCallToJson(this);
}

@JsonSerializable()
class IncomingWebrtcCall extends WebrtcCall {

  IncomingWebrtcCall(
      super.id,
      super.muted,
      super.source,
      super.destination,
      super.counterpart,
      super.hasCameraVideo,
      super.hasRemoteCameraVideo,
      super.hasScreenShare,
      super.hasRemoteScreenShare);

  Future<void> accept([WebrtcCallOptions? options]) async {
    await Call._callChannel.invokeMethod('accept', {
      'options': options != null ? jsonEncode(options.toJson()) : null
    });
  }

  Future<void> decline() async {
    await Call._callChannel.invokeMethod('decline', { });
  }

  factory IncomingWebrtcCall.fromJson(Map<String, dynamic> json) => _$IncomingWebrtcCallFromJson(json);

  @override
  Map<String, dynamic> toJson() => _$IncomingWebrtcCallToJson(this);
}