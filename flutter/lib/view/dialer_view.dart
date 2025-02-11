import 'package:flutter/material.dart';
import 'package:infobip_rtc_flutter_showcase/rtc/call/enum.dart';

class DialerView extends StatefulWidget {
  final Function(String, bool, bool) onCall;
  final CallType callType;

  const DialerView({required this.callType, required this.onCall, super.key});

  @override
  DialerViewState createState() => DialerViewState();
}

class DialerViewState extends State<DialerView> {
  final TextEditingController _destinationIdentifierController = TextEditingController();

  bool _audioEnabled = true;
  bool _videoEnabled = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: _destinationIdentifierController,
          decoration: const InputDecoration(
            labelText: 'Enter destination...',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                const Icon(Icons.mic),
                Switch(
                  value: _audioEnabled,
                  onChanged: (value) {
                    setState(() {
                      _audioEnabled = value;
                    });
                  },
                ),
              ],
            ),
            if (widget.callType == CallType.webrtc) ...[
              const SizedBox(width: 20),
              Row(
                children: [
                  const Icon(Icons.videocam),
                  Switch(
                    value: _videoEnabled,
                    onChanged: (value) {
                      setState(() {
                        _videoEnabled = value;
                      });
                    },
                  ),
                ],
              ),
            ]
          ],
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: () {
            widget.onCall(
              _destinationIdentifierController.text.trim(),
              _audioEnabled,
              _videoEnabled,
            );
            _destinationIdentifierController.clear();
          },
          child: const Icon(Icons.call),
        ),
      ],
    );
  }
}