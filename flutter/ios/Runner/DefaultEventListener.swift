import InfobipRTC

extension InfobipRTCPlugin: PhoneCallEventListener, WebrtcCallEventListener {
    public func onEarlyMedia(_ callEarlyMediaEvent: CallEarlyMediaEvent) {
        invokeEvent(event: "onEarlyMedia", data: "{}")
    }

    public func onRinging(_ callRingingEvent: CallRingingEvent) {
        invokeEvent(event: "onRinging", data: "{}")
    }

    public func onEstablished(_ callEstablishedEvent: CallEstablishedEvent) {
        invokeEvent(event: "onEstablished", data: "{}")
    }

    public func onHangup(_ callHangupEvent: CallHangupEvent) {
        invokeEvent(event: "onHangup", data: callHangupEvent.toFlutterModel())
    }

    public func onError(_ errorEvent: ErrorEvent) {
        invokeEvent(event: "onError", data: errorEvent.toFlutterModel())
    }

    public func onCameraVideoAdded(_ cameraVideoAddedEvent: CameraVideoAddedEvent) {
        videoPlugin?.setTrack(streamId: "local", track: cameraVideoAddedEvent.track)
        invokeEvent(event: "onCameraVideoAdded", data: "{}")
    }

    public func onCameraVideoUpdated(_ cameraVideoUpdatedEvent: CameraVideoUpdatedEvent) {
        videoPlugin?.setTrack(streamId: "local", track: cameraVideoUpdatedEvent.track)
        invokeEvent(event: "onCameraVideoUpdated", data: "{}")
    }

    public func onCameraVideoRemoved() {
        videoPlugin?.setTrack(streamId: "local", track: nil)
        invokeEvent(event: "onCameraVideoRemoved", data: nil)
    }

    public func onRemoteCameraVideoAdded(_ cameraVideoAddedEvent: CameraVideoAddedEvent) {
        videoPlugin?.setTrack(streamId: "remote", track: cameraVideoAddedEvent.track)
        invokeEvent(event: "onRemoteCameraVideoAdded", data: "{}")
    }

    public func onRemoteCameraVideoRemoved() {
        videoPlugin?.setTrack(streamId: "remote", track: nil)
        invokeEvent(event: "onRemoteCameraVideoRemoved", data: nil)
    }

    public func onRemoteMuted() {
        invokeEvent(event: "onRemoteMuted", data: nil)
    }

    public func onRemoteUnmuted() {
        invokeEvent(event: "onRemoteUnmuted", data: nil)
    }
    
    public func onScreenShareAdded(_ screenShareAddedEvent: ScreenShareAddedEvent) {
        invokeEvent(event: "onScreenShareAdded", data: nil)
    }

    public func onScreenShareRemoved(_ screenShareRemovedEvent: ScreenShareRemovedEvent) {
        invokeEvent(event: "onScreenShareRemoved", data: nil)
    }
    
    public func onRemoteScreenShareAdded(_ screenShareAddedEvent: ScreenShareAddedEvent) {
        invokeEvent(event: "onRemoteScreenShareAdded", data: nil)
    }
    
    public func onRemoteScreenShareRemoved() {
        invokeEvent(event: "onRemoteScreenShareRemoved", data: nil)
    }
    
    public func onCallRecordingStarted(_ callRecordingStartedEvent: CallRecordingStartedEvent) {
        invokeEvent(event: "onCallRecordingStarted", data: callRecordingStartedEvent.toFlutterModel())
    }
    
    public func onRemoteDisconnected(_ remoteDisconnectedEvent: RemoteDisconnectedEvent) {
        invokeEvent(event: "onRemoteDisconnected", data: nil)
    }
    
    public func onRemoteReconnected(_ remoteReconnectedEvent: RemoteReconnectedEvent) {
        invokeEvent(event: "onRemoteReconnected", data: nil)
    }
    
    public func onReconnecting(_ callReconnectingEvent: CallReconnectingEvent) {
        invokeEvent(event: "onReconnecting", data: nil)
    }
    
    public func onReconnected(_ callReconnectedEvent: CallReconnectedEvent) {
        invokeEvent(event: "onReconnected", data: nil)
    }
}

extension InfobipRTCPlugin: IncomingCallEventListener {
    public func onIncomingWebrtcCall(_ incomingWebrtcCallEvent: IncomingWebrtcCallEvent) {
        let incomingCall = incomingWebrtcCallEvent.incomingWebrtcCall
        incomingCall.webrtcCallEventListener = self
        
        if let messenger = binaryMessenger {
            let flutterChannel = FlutterMethodChannel(name: InfobipRTCPlugin.RTC_EVENT_LISTENER_CHANNEL, binaryMessenger: messenger)
            flutterChannel.invokeMethod("onEvent", arguments: [
                "event": "onIncomingCall",
                "data": incomingCall.toFlutterModel().toJsonString()
            ])
        }
    }
}
