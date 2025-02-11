import 'package:flutter/cupertino.dart';
import 'package:infobip_rtc_flutter_showcase/view/participant_view.dart';

import '../rtc/call/call.dart';

class LocalParticipantView extends StatelessWidget {
  final String identity;
  final Call call;

  const LocalParticipantView(
      {required this.identity, required this.call, super.key});

  @override
  Widget build(BuildContext context) {
    return ParticipantView(
      identity: identity,
      isMuted: call.muted,
      hasCameraVideo: call is WebrtcCall ? (call as WebrtcCall).hasCameraVideo : false,
      streamId: "local",
    );
  }
}