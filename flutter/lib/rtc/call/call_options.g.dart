// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'call_options.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AudioOptions _$AudioOptionsFromJson(Map<String, dynamic> json) => AudioOptions(
      audioQualityMode: $enumDecodeNullable(
          _$AudioQualityModeEnumMap, json['audioQualityMode']),
    );

Map<String, dynamic> _$AudioOptionsToJson(AudioOptions instance) =>
    <String, dynamic>{
      'audioQualityMode': _$AudioQualityModeEnumMap[instance.audioQualityMode],
    };

const _$AudioQualityModeEnumMap = {
  AudioQualityMode.auto: 'AUTO',
  AudioQualityMode.lowData: 'LOW_DATA',
  AudioQualityMode.highQuality: 'HIGH_QUALITY',
};

VideoOptions _$VideoOptionsFromJson(Map<String, dynamic> json) => VideoOptions(
      cameraOrientation: $enumDecodeNullable(
          _$CameraOrientationEnumMap, json['cameraOrientation']),
      videoMode: $enumDecodeNullable(_$VideoModeEnumMap, json['videoMode']),
    );

Map<String, dynamic> _$VideoOptionsToJson(VideoOptions instance) =>
    <String, dynamic>{
      'cameraOrientation':
          _$CameraOrientationEnumMap[instance.cameraOrientation],
      'videoMode': _$VideoModeEnumMap[instance.videoMode],
    };

const _$CameraOrientationEnumMap = {
  CameraOrientation.front: 'FRONT',
  CameraOrientation.back: 'BACK',
};

const _$VideoModeEnumMap = {
  VideoMode.grid: 'GRID',
  VideoMode.presentation: 'PRESENTATION',
};

RecordingOptions _$RecordingOptionsFromJson(Map<String, dynamic> json) =>
    RecordingOptions(
      recordingType:
          $enumDecodeNullable(_$RecordingTypeEnumMap, json['recordingType']),
    );

Map<String, dynamic> _$RecordingOptionsToJson(RecordingOptions instance) =>
    <String, dynamic>{
      'recordingType': _$RecordingTypeEnumMap[instance.recordingType],
    };

const _$RecordingTypeEnumMap = {
  RecordingType.audio: 'AUDIO',
  RecordingType.audioAndVideo: 'AUDIO_AND_VIDEO',
  RecordingType.undefined: 'UNDEFINED',
};

CallOptions _$CallOptionsFromJson(Map<String, dynamic> json) => CallOptions(
      audio: json['audio'] as bool?,
      audioOptions: json['audioOptions'] == null
          ? null
          : AudioOptions.fromJson(json['audioOptions'] as Map<String, dynamic>),
      recordingOptions: json['recordingOptions'] == null
          ? null
          : RecordingOptions.fromJson(
              json['recordingOptions'] as Map<String, dynamic>),
      customData: (json['customData'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, e as String),
      ),
      autoReconnect: json['autoReconnect'] as bool?,
    );

Map<String, dynamic> _$CallOptionsToJson(CallOptions instance) =>
    <String, dynamic>{
      'audio': instance.audio,
      'audioOptions': instance.audioOptions,
      'recordingOptions': instance.recordingOptions,
      'customData': instance.customData,
      'autoReconnect': instance.autoReconnect,
    };

PhoneCallOptions _$PhoneCallOptionsFromJson(Map<String, dynamic> json) =>
    PhoneCallOptions(
      audio: json['audio'] as bool?,
      audioOptions: json['audioOptions'] == null
          ? null
          : AudioOptions.fromJson(json['audioOptions'] as Map<String, dynamic>),
      recordingOptions: json['recordingOptions'] == null
          ? null
          : RecordingOptions.fromJson(
              json['recordingOptions'] as Map<String, dynamic>),
      customData: (json['customData'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, e as String),
      ),
      autoReconnect: json['autoReconnect'] as bool?,
      from: json['from'] as String?,
    );

Map<String, dynamic> _$PhoneCallOptionsToJson(PhoneCallOptions instance) =>
    <String, dynamic>{
      'audio': instance.audio,
      'audioOptions': instance.audioOptions,
      'recordingOptions': instance.recordingOptions,
      'customData': instance.customData,
      'autoReconnect': instance.autoReconnect,
      'from': instance.from,
    };

WebrtcCallOptions _$WebrtcCallOptionsFromJson(Map<String, dynamic> json) =>
    WebrtcCallOptions(
      audio: json['audio'] as bool?,
      audioOptions: json['audioOptions'] == null
          ? null
          : AudioOptions.fromJson(json['audioOptions'] as Map<String, dynamic>),
      recordingOptions: json['recordingOptions'] == null
          ? null
          : RecordingOptions.fromJson(
              json['recordingOptions'] as Map<String, dynamic>),
      customData: (json['customData'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, e as String),
      ),
      autoReconnect: json['autoReconnect'] as bool?,
      video: json['video'] as bool?,
      videoOptions: json['videoOptions'] == null
          ? null
          : VideoOptions.fromJson(json['videoOptions'] as Map<String, dynamic>),
      dataChannel: json['dataChannel'] as bool?,
    );

Map<String, dynamic> _$WebrtcCallOptionsToJson(WebrtcCallOptions instance) =>
    <String, dynamic>{
      'audio': instance.audio,
      'audioOptions': instance.audioOptions,
      'recordingOptions': instance.recordingOptions,
      'customData': instance.customData,
      'autoReconnect': instance.autoReconnect,
      'video': instance.video,
      'videoOptions': instance.videoOptions,
      'dataChannel': instance.dataChannel,
    };
