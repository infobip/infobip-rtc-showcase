import 'package:json_annotation/json_annotation.dart';

import 'enum.dart';

part 'call_options.g.dart';

@JsonSerializable()
class AudioOptions {
  final AudioQualityMode? audioQualityMode;

  const AudioOptions({this.audioQualityMode});

  factory AudioOptions.fromJson(Map<String, dynamic> json) =>
      _$AudioOptionsFromJson(json);

  Map<String, dynamic> toJson() => _$AudioOptionsToJson(this);
}

@JsonSerializable()
class VideoOptions {
  final CameraOrientation? cameraOrientation;
  final VideoMode? videoMode;

  const VideoOptions({this.cameraOrientation, this.videoMode});

  factory VideoOptions.fromJson(Map<String, dynamic> json) =>
      _$VideoOptionsFromJson(json);

  Map<String, dynamic> toJson() => _$VideoOptionsToJson(this);
}

@JsonSerializable()
class RecordingOptions {
  final RecordingType? recordingType;

  const RecordingOptions({this.recordingType});

  factory RecordingOptions.fromJson(Map<String, dynamic> json) =>
      _$RecordingOptionsFromJson(json);

  Map<String, dynamic> toJson() => _$RecordingOptionsToJson(this);
}

@JsonSerializable()
class CallOptions {
  final bool? audio;
  final AudioOptions? audioOptions;
  final RecordingOptions? recordingOptions;
  final Map<String, String>? customData;
  final bool? autoReconnect;

  const CallOptions(
      {this.audio, this.audioOptions, this.recordingOptions, this.customData, this.autoReconnect});

  factory CallOptions.fromJson(Map<String, dynamic> json) =>
      _$CallOptionsFromJson(json);

  Map<String, dynamic> toJson() => _$CallOptionsToJson(this);
}

@JsonSerializable()
class PhoneCallOptions extends CallOptions {
  final String? from;

  const PhoneCallOptions({
    super.audio,
    super.audioOptions,
    super.recordingOptions,
    super.customData,
    super.autoReconnect,
    this.from
  });

  factory PhoneCallOptions.fromJson(Map<String, dynamic> json) => _$PhoneCallOptionsFromJson(json);

  @override
  Map<String, dynamic> toJson() => _$PhoneCallOptionsToJson(this);
}

@JsonSerializable()
class WebrtcCallOptions extends CallOptions {
  final bool? video;
  final VideoOptions? videoOptions;
  final bool? dataChannel;

  const WebrtcCallOptions({
    super.audio,
    super.audioOptions,
    super.recordingOptions,
    super.customData,
    super.autoReconnect,
    this.video,
    this.videoOptions,
    this.dataChannel
  });

  factory WebrtcCallOptions.fromJson(Map<String, dynamic> json) =>
      _$WebrtcCallOptionsFromJson(json);

  @override
  Map<String, dynamic> toJson() => _$WebrtcCallOptionsToJson(this);
}