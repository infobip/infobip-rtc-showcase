// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'call.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PhoneEndpoint _$PhoneEndpointFromJson(Map<String, dynamic> json) =>
    PhoneEndpoint(
      json['phoneNumber'] as String,
    );

Map<String, dynamic> _$PhoneEndpointToJson(PhoneEndpoint instance) =>
    <String, dynamic>{
      'phoneNumber': instance.phoneNumber,
    };

WebrtcEndpoint _$WebrtcEndpointFromJson(Map<String, dynamic> json) =>
    WebrtcEndpoint(
      json['identity'] as String,
      json['displayName'] as String?,
    );

Map<String, dynamic> _$WebrtcEndpointToJson(WebrtcEndpoint instance) =>
    <String, dynamic>{
      'identity': instance.identity,
      'displayName': instance.displayName,
    };

Call _$CallFromJson(Map<String, dynamic> json) => Call(
      json['id'] as String,
      json['muted'] as bool,
      WebrtcEndpoint.fromJson(json['source'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CallToJson(Call instance) => <String, dynamic>{
      'id': instance.id,
      'muted': instance.muted,
      'source': instance.source,
    };

PhoneCall _$PhoneCallFromJson(Map<String, dynamic> json) => PhoneCall(
      json['id'] as String,
      json['muted'] as bool,
      WebrtcEndpoint.fromJson(json['source'] as Map<String, dynamic>),
      PhoneEndpoint.fromJson(json['destination'] as Map<String, dynamic>),
      PhoneEndpoint.fromJson(json['counterpart'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$PhoneCallToJson(PhoneCall instance) => <String, dynamic>{
      'id': instance.id,
      'muted': instance.muted,
      'source': instance.source,
      'destination': instance.destination,
      'counterpart': instance.counterpart,
    };

WebrtcCall _$WebrtcCallFromJson(Map<String, dynamic> json) => WebrtcCall(
      json['id'] as String,
      json['muted'] as bool,
      WebrtcEndpoint.fromJson(json['source'] as Map<String, dynamic>),
      WebrtcEndpoint.fromJson(json['destination'] as Map<String, dynamic>),
      WebrtcEndpoint.fromJson(json['counterpart'] as Map<String, dynamic>),
      json['hasCameraVideo'] as bool,
      json['hasRemoteCameraVideo'] as bool,
      json['hasScreenShare'] as bool,
      json['hasRemoteScreenShare'] as bool,
    );

Map<String, dynamic> _$WebrtcCallToJson(WebrtcCall instance) =>
    <String, dynamic>{
      'id': instance.id,
      'muted': instance.muted,
      'source': instance.source,
      'destination': instance.destination,
      'counterpart': instance.counterpart,
      'hasCameraVideo': instance.hasCameraVideo,
      'hasRemoteCameraVideo': instance.hasRemoteCameraVideo,
      'hasScreenShare': instance.hasScreenShare,
      'hasRemoteScreenShare': instance.hasRemoteScreenShare,
    };

IncomingWebrtcCall _$IncomingWebrtcCallFromJson(Map<String, dynamic> json) =>
    IncomingWebrtcCall(
      json['id'] as String,
      json['muted'] as bool,
      WebrtcEndpoint.fromJson(json['source'] as Map<String, dynamic>),
      WebrtcEndpoint.fromJson(json['destination'] as Map<String, dynamic>),
      WebrtcEndpoint.fromJson(json['counterpart'] as Map<String, dynamic>),
      json['hasCameraVideo'] as bool,
      json['hasRemoteCameraVideo'] as bool,
      json['hasScreenShare'] as bool,
      json['hasRemoteScreenShare'] as bool,
    );

Map<String, dynamic> _$IncomingWebrtcCallToJson(IncomingWebrtcCall instance) =>
    <String, dynamic>{
      'id': instance.id,
      'muted': instance.muted,
      'source': instance.source,
      'destination': instance.destination,
      'counterpart': instance.counterpart,
      'hasCameraVideo': instance.hasCameraVideo,
      'hasRemoteCameraVideo': instance.hasRemoteCameraVideo,
      'hasScreenShare': instance.hasScreenShare,
      'hasRemoteScreenShare': instance.hasRemoteScreenShare,
    };
