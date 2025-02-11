import 'package:flutter/material.dart';

import '../rtc/call/call.dart';

class CallActionsView extends StatefulWidget {
  final Call activeCall;
  final VoidCallback onMute;
  final VoidCallback onCameraVideo;
  final VoidCallback onHangup;

  const CallActionsView({required this.activeCall, required this.onMute, required this.onCameraVideo, required this.onHangup, super.key});

  @override
  CallActionsViewState createState() => CallActionsViewState();
}

class CallActionsViewState extends State<CallActionsView> {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.activeCall.established) ...[
          ElevatedButton(
            onPressed: widget.onMute,
            child: widget.activeCall.muted
                ? const Icon(Icons.mic_off, color: Colors.red)
                : const Icon(Icons.mic, color: Colors.green),
          ),
          const SizedBox(width: 20),
        ],
        if (widget.activeCall is WebrtcCall && widget.activeCall.established) ...[
          ElevatedButton(
            onPressed: widget.onCameraVideo,
            child: (widget.activeCall as WebrtcCall).hasCameraVideo
                ? const Icon(Icons.videocam_off)
                : const Icon(Icons.videocam),
          ),
          const SizedBox(width: 20),
        ],
        ElevatedButton(
          onPressed: widget.onHangup,
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          child: const Icon(Icons.call_end, color: Colors.white),
        ),
      ],
    );
  }
}