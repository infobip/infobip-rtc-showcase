// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'call_event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CallHangupEvent _$CallHangupEventFromJson(Map<String, dynamic> json) =>
    CallHangupEvent(
      ErrorCode.fromJson(json['errorCode'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CallHangupEventToJson(CallHangupEvent instance) =>
    <String, dynamic>{
      'errorCode': instance.errorCode,
    };

ErrorEvent _$ErrorEventFromJson(Map<String, dynamic> json) => ErrorEvent(
      ErrorCode.fromJson(json['errorCode'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ErrorEventToJson(ErrorEvent instance) =>
    <String, dynamic>{
      'errorCode': instance.errorCode,
    };

ErrorCode _$ErrorCodeFromJson(Map<String, dynamic> json) => ErrorCode(
      (json['id'] as num).toInt(),
      json['name'] as String?,
      json['description'] as String?,
    );

Map<String, dynamic> _$ErrorCodeToJson(ErrorCode instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
    };

IncomingWebrtcCallEvent _$IncomingWebrtcCallEventFromJson(
        Map<String, dynamic> json) =>
    IncomingWebrtcCallEvent(
      IncomingWebrtcCall.fromJson(
          json['incomingWebrtcCall'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$IncomingWebrtcCallEventToJson(
        IncomingWebrtcCallEvent instance) =>
    <String, dynamic>{
      'incomingWebrtcCall': instance.incomingWebrtcCall,
    };
