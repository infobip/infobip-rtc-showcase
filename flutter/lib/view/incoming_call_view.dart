import 'package:flutter/material.dart';

import '../rtc/call/call.dart';

class IncomingCallView extends StatelessWidget {
  final IncomingWebrtcCall activeCall;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const IncomingCallView({
    required this.activeCall,
    required this.onAccept,
    required this.onDecline,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          'Incoming Call from: ${activeCall.counterpart.identity}',
          style: const TextStyle(fontSize: 16),
        ),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: onAccept,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: const Text('Accept'),
            ),
            const SizedBox(width: 20),
            ElevatedButton(
              onPressed: onDecline,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Decline'),
            ),
          ],
        ),
      ],
    );
  }
}
