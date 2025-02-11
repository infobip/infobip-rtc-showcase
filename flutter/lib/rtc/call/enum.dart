import 'package:json_annotation/json_annotation.dart';

enum CallType { phone, webrtc }

enum RecordingType {
  @JsonValue("AUDIO")
  audio,
  @JsonValue("AUDIO_AND_VIDEO")
  audioAndVideo,
  @JsonValue("UNDEFINED")
  undefined
}

enum CameraOrientation {
  @JsonValue("FRONT")
  front,
  @JsonValue("BACK")
  back
}

enum VideoMode {
  @JsonValue("GRID")
  grid,
  @JsonValue("PRESENTATION")
  presentation
}

enum AudioQualityMode {
  @JsonValue("AUTO")
  auto,
  @JsonValue("LOW_DATA")
  lowData,
  @JsonValue("HIGH_QUALITY")
  highQuality
}