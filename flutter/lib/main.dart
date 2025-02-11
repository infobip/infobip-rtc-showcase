import 'dart:developer' as developer;
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:infobip_rtc_flutter_showcase/rtc/call/call_event.dart';
import 'package:infobip_rtc_flutter_showcase/rtc/call/call_listener.dart';
import 'package:infobip_rtc_flutter_showcase/rtc/call/call_options.dart';
import 'package:infobip_rtc_flutter_showcase/rtc/call/call_request.dart';
import 'package:infobip_rtc_flutter_showcase/rtc/call/enum.dart';
import 'package:infobip_rtc_flutter_showcase/rtc/service/token_service.dart';
import 'package:infobip_rtc_flutter_showcase/view/call_actions_view.dart';
import 'package:infobip_rtc_flutter_showcase/view/dialer_view.dart';
import 'package:infobip_rtc_flutter_showcase/view/incoming_call_view.dart';
import 'package:infobip_rtc_flutter_showcase/view/local_participant_view.dart';
import 'package:infobip_rtc_flutter_showcase/view/remote_participant_view.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';

import 'rtc/call/call.dart';
import 'rtc/infobip_rtc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    ChangeNotifierProvider(
      create: (_) => InfobipRTC.instance,
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Infobip RTC Showcase App',
      home: CallScreen(),
    );
  }
}

class CallScreen extends StatefulWidget {
  const CallScreen({super.key});

  @override
  CallScreenState createState() => CallScreenState();
}

class CallScreenState extends State<CallScreen> with SingleTickerProviderStateMixin implements PhoneCallEventListener, WebrtcCallEventListener, IncomingCallEventListener {
  late TabController _tabController;

  static const platform = MethodChannel('infobip-rtc');

  String? _token;
  String? _identity;
  String _registrationState = 'Connecting...';

  bool _isIncomingCall = false;
  CallType _callType = CallType.phone;

  @override
  void initState() {
    super.initState();

    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 0) {
        setState(() {
          _callType = CallType.phone;
        });
      } else {
        setState(() {
          _callType = CallType.webrtc;
        });
      }
    });

    _register();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    try {
      final identity = _generateRandomIdentity();
      final token = await TokenService.fetchToken(identity) as String;
      setState(() {
        _registrationState = 'Registered as: $identity';
        _identity = identity;
        _token = token;
      });

      InfobipRTC.instance.registerForActiveConnection(_token!, this);
    } catch (e) {
      setState(() {
        _registrationState = 'Failed to register...';
      });
      developer.log("Failed to fetch token: '$e'.");
    }
  }

  String _generateRandomIdentity() {
    final random = Random();
    final randomNumbers = List.generate(5, (_) => random.nextInt(10)).join();
    return 'identity_$randomNumbers';
  }

  Future<void> _call(String destination, bool isAudioEnabled, bool isVideoEnabled) async {
    if (destination.isNotEmpty && _token != null) {
      try {
        if (_callType == CallType.webrtc) {
          if (!(await Permission.microphone.request().isGranted)) {
            return Future.error("No microphone permission!");
          }
          if (!(await Permission.camera.request().isGranted)) {
            return Future.error("No camera permission!");
          }

          final options = WebrtcCallOptions(
            audio: isAudioEnabled,
            audioOptions: AudioOptions(
              audioQualityMode: AudioQualityMode.highQuality
            ),
            recordingOptions: RecordingOptions(
              recordingType: RecordingType.undefined
            ),
            customData: {},
            autoReconnect: true,
            video: isVideoEnabled,
            videoOptions: VideoOptions(
              cameraOrientation: CameraOrientation.front,
              videoMode: VideoMode.presentation
            ),
            dataChannel: false,
          );
          await InfobipRTC.callWebrtc(WebrtcCallRequest(_token!, destination, this), options);
        } else if (_callType == CallType.phone) {
          if (!(await Permission.microphone.request().isGranted)) {
            return Future.error("No microphone permission!");
          }

          final options = PhoneCallOptions(
            audio: isAudioEnabled,
            audioOptions: AudioOptions(
              audioQualityMode: AudioQualityMode.highQuality
            ),
            recordingOptions: RecordingOptions(
              recordingType: RecordingType.undefined
            ),
            customData: {},
            autoReconnect: true
          );
          await InfobipRTC.callPhone(PhoneCallRequest(_token!, destination, this), options);
        }
      } on PlatformException catch (e) {
        developer.log("Failed to make a call: '${e.message}'.");
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please provide a destination and ensure token is fetched')),
      );
    }
  }

  Future<void> _hangup() async {
    InfobipRTC.activeCall?.hangup();
  }

  Future<void> _mute() async {
    InfobipRTC.activeCall?.mute(!InfobipRTC.activeCall!.muted);
  }

  Future<void> _cameraVideo() async {
    final call = InfobipRTC.activeCall as WebrtcCall;
    call.cameraVideo(!call.hasCameraVideo);
  }

  Future<void> _acceptIncomingCall() async {
    (InfobipRTC.activeCall as IncomingWebrtcCall).accept();

    setState(() {
      _isIncomingCall = false;
    });
  }

  Future<void> _declineIncomingCall() async {
    (InfobipRTC.activeCall as IncomingWebrtcCall).decline();
  }

  void showSnackBar(String text) {
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(text),
            duration: Duration(seconds: 1)
        )
    );
  }

  String? getRemoteIdentity(Call activeCall) {
    if (activeCall is WebrtcCall) {
      return activeCall.counterpart.identity;
    } else if (activeCall is PhoneCall) {
      return activeCall.counterpart.phoneNumber;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text('Infobip RTC Showcase'),
          bottom: TabBar(
            controller: _tabController,
            tabs: [
              Tab(icon: Icon(Icons.phone)),
              Tab(icon: Icon(Icons.person))
            ],
          ),
        ),
        body: Consumer<InfobipRTC>(
            builder: (context, infobipRTC, child) {
              final activeCall = InfobipRTC.activeCall;
              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Center(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(_registrationState, style: TextStyle(fontSize: 16)),
                      SizedBox(height: 20),

                      if (_token != null) ... [
                        if (activeCall != null && !_isIncomingCall) ...[
                          Text('In a call with ${getRemoteIdentity(activeCall)}', style: TextStyle(fontSize: 16)),
                          SizedBox(height: 20),
                        ],

                        if (activeCall == null)
                          DialerView(callType: _callType, onCall: _call),

                        if (activeCall is WebrtcCall && !_isIncomingCall) ...[
                          LocalParticipantView(identity: _identity!, call: activeCall),
                          const SizedBox(height: 10),
                          RemoteParticipantView(identity: activeCall.counterpart.identity, call: activeCall),
                          const SizedBox(height: 20),
                        ],

                        if (activeCall != null && !_isIncomingCall)
                          CallActionsView(
                              activeCall: activeCall,
                              onMute: _mute,
                              onCameraVideo: _cameraVideo,
                              onHangup: _hangup
                          ),

                        if (_isIncomingCall)
                          IncomingCallView(
                            activeCall: activeCall as IncomingWebrtcCall,
                            onAccept: _acceptIncomingCall,
                            onDecline: _declineIncomingCall,
                          )
                      ]
                    ],
                  ),
                )
              );
            })
    );
  }

  @override
  void onEarlyMedia() {
    showSnackBar('Early media...');
  }

  @override
  void onRinging() {
    showSnackBar('Call ringing...');
  }

  @override
  void onEstablished() {
    showSnackBar('Call established...');
  }

  @override
  void onHangup(CallHangupEvent callHangupEvent) {
    showSnackBar('Call ended...');

    InfobipRTC.activeCall = null;
    setState(() {
      _isIncomingCall = false;
    });
  }

  @override
  void onError(ErrorEvent errorEvent) {
    showSnackBar('An error has occurred: ${errorEvent.errorCode.name}');
  }

  @override
  void onCameraVideoAdded() {
    showSnackBar('Local camera video added...');
  }

  @override
  void onCameraVideoUpdated() {
    showSnackBar('Local camera video updated...');
  }

  @override
  void onCameraVideoRemoved() {
    showSnackBar('Local camera video removed...');
  }

  @override
  void onRemoteCameraVideoAdded() {
    showSnackBar('Remote camera video added...');
  }

  @override
  void onRemoteCameraVideoRemoved() {
    showSnackBar('Remote camera video removed...');
  }

  @override
  void onRemoteMuted() {
    showSnackBar('Remote muted...');
  }

  @override
  void onRemoteUnmuted() {
    showSnackBar('Remote unmuted...');
  }

  @override
  void onRemoteScreenShareAdded() {
    showSnackBar('Remote screen share added...');
  }

  @override
  void onRemoteScreenShareRemoved() {
    showSnackBar('Remote screen share removed...');
  }

  @override
  void onScreenShareAdded() {
    showSnackBar('Local screen share added...');
  }

  @override
  void onScreenShareRemoved() {
    showSnackBar('Local screen share removed...');
  }

  @override
  void onCallRecordingStarted() {
    showSnackBar('Call recording started...');
  }

  @override
  void onReconnected() {
    showSnackBar('Call reconnected...');
  }

  @override
  void onReconnecting() {
    showSnackBar('Call reconnecting...');
  }

  @override
  void onRemoteDisconnected() {
    showSnackBar('Remote disconnected...');
  }

  @override
  void onRemoteReconnected() {
    showSnackBar('Remote reconnected...');
  }

  @override
  void onIncomingWebrtcCall(IncomingWebrtcCallEvent incomingWebrtcCallEvent) {
    incomingWebrtcCallEvent.incomingWebrtcCall.eventListener = this;

    showSnackBar('Incoming call...');

    setState(() {
      _isIncomingCall = true;
    });
  }
}