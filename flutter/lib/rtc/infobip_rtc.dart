import 'dart:async';
import 'dart:convert';
import 'dart:developer' as developer;
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:infobip_rtc_flutter_showcase/rtc/call/call_listener.dart';

import 'call/call.dart';
import 'call/call_event.dart';
import 'call/call_options.dart';
import 'call/call_request.dart';

class InfobipRTC with ChangeNotifier {
  static InfobipRTC? _instance;
  static InfobipRTC get instance => _instance ??= InfobipRTC._internal();

  static const MethodChannel _rtcChannel =
  MethodChannel('infobip-rtc');
  static const MethodChannel _rtcEventListenerChannel =
  MethodChannel('infobip-rtc-event-listener');

  static Call? _activeCall;
  static Call? get activeCall => _activeCall;
  static set activeCall(Call? call) {
    if (call == null) {
      _activeCall?.eventListener = null;
      _activeCall?.removeListener(instance._onCallChanged);
    }

    _activeCall = call;
    instance.notifyListeners();
  }

  static IncomingCallEventListener? _incomingCallEventListener;

  InfobipRTC._internal() {
    _rtcEventListenerChannel.setMethodCallHandler(_onMethodCall);
  }

  void _onCallChanged() {
    notifyListeners();
  }

  Future<void> _onMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onEvent':
        _onEvent(call);
        break;
      default:
        throw MissingPluginException('Method ${call.method} not implemented');
    }
  }

  Future<void> _onEvent(MethodCall call) async {
    var map = call.arguments as Map<Object?, Object?>;
    var event = map['event'] as String;
    var data = map['data'] as String?;

    try {
      switch (event) {
        case 'onIncomingCall':
          var incomingCallJson = jsonDecode(data!);
          activeCall = IncomingWebrtcCall.fromJson(incomingCallJson);
          _activeCall?.addListener(instance._onCallChanged);
          _incomingCallEventListener?.onIncomingWebrtcCall(
              IncomingWebrtcCallEvent(activeCall as IncomingWebrtcCall)
          );
          break;
        default:
          throw Exception('Unknown call event! $event');
      }
    } catch (ex) {
      developer.log('Failed to emit call event!', error: ex);
      rethrow;
    }
  }

  Future<void> registerForActiveConnection(String token, IncomingCallEventListener incomingCallEventListener) async {
    if (Platform.isAndroid) {
      _rtcChannel.invokeMethod('registerForActiveConnection', {
        'token': token
      });
    } else if (Platform.isIOS) {
      // todo
    }

    _incomingCallEventListener = incomingCallEventListener;
  }

  static Future<WebrtcCall> callWebrtc(WebrtcCallRequest callRequest,
      [WebrtcCallOptions? options]) async {
    String res = await _rtcChannel.invokeMethod('callWebrtc', {
      "token": callRequest.token,
      "destination": callRequest.destination,
      "options": options != null ? jsonEncode(options.toJson()) : null
    });

    activeCall = WebrtcCall.fromJson(jsonDecode(res));
    _activeCall?.eventListener = callRequest.eventListener;
    _activeCall?.addListener(instance._onCallChanged);

    activeCall?.muted = !(options?.audio ?? false);

    return activeCall as WebrtcCall;
  }
                                     
  static Future<PhoneCall> callPhone(PhoneCallRequest callRequest,
      [PhoneCallOptions? options]) async {
    String res = await _rtcChannel.invokeMethod('callPhone', {
      "token": callRequest.token,
      "destination": callRequest.destination,
      "options": options != null ? jsonEncode(options.toJson()) : null
    });

    activeCall = PhoneCall.fromJson(jsonDecode(res));
    _activeCall?.eventListener = callRequest.eventListener;
    _activeCall?.addListener(instance._onCallChanged);

    return activeCall as PhoneCall;
  }
}