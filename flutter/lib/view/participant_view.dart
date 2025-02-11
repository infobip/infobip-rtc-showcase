import 'package:flutter/material.dart';
import 'package:infobip_rtc_flutter_showcase/view/video_view.dart';

class ParticipantView extends StatelessWidget {
  final String identity;
  final bool isMuted;
  final bool hasCameraVideo;
  final String streamId;

  const ParticipantView({
    required this.identity,
    required this.isMuted,
    required this.hasCameraVideo,
    required this.streamId,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        hasCameraVideo
            ? SizedBox(
          width: 300,
          height: 200,
          child: VideoView(streamId),
        )
            : const Icon(Icons.person, size: 100.0),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              identity,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(width: 8),
            Icon(
              isMuted ? Icons.mic_off : Icons.mic,
              size: 20.0,
              color: isMuted ? Colors.red : Colors.green,
            ),
          ],
        ),
      ],
    );
  }
}