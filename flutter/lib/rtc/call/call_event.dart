import 'package:json_annotation/json_annotation.dart';

import 'call.dart';

part 'call_event.g.dart';

@JsonSerializable()
class CallHangupEvent {
  final ErrorCode errorCode;

  const CallHangupEvent(this.errorCode);

  factory CallHangupEvent.fromJson(Map<String, dynamic> json) =>
      _$CallHangupEventFromJson(json);

  Map<String, dynamic> toJson() => _$CallHangupEventToJson(this);
}

@JsonSerializable()
class ErrorEvent {
  final ErrorCode errorCode;

  const ErrorEvent(this.errorCode);

  factory ErrorEvent.fromJson(Map<String, dynamic> json) =>
      _$ErrorEventFromJson(json);

  Map<String, dynamic> toJson() => _$ErrorEventToJson(this);
}

@JsonSerializable()
class ErrorCode {
  final int id;
  final String? name;
  final String? description;

  const ErrorCode(this.id, this.name, this.description);

  factory ErrorCode.fromJson(Map<String, dynamic> json) =>
      _$ErrorCodeFromJson(json);

  Map<String, dynamic> toJson() => _$ErrorCodeToJson(this);
}

@JsonSerializable()
class IncomingWebrtcCallEvent {
  final IncomingWebrtcCall incomingWebrtcCall;

  const IncomingWebrtcCallEvent(this.incomingWebrtcCall);

  factory IncomingWebrtcCallEvent.fromJson(Map<String, dynamic> json) =>
      _$IncomingWebrtcCallEventFromJson(json);

  Map<String, dynamic> toJson() => _$IncomingWebrtcCallEventToJson(this);
}

