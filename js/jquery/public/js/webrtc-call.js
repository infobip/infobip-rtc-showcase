$(document).ready(function () {
    setOnClickEventListeners();
    connectInfobipRTC()
        .then(identity => {
            listenForIncomingCall();
            $('#identity').html(identity);
        })

    const userAgent = window.navigator.userAgent;
    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
        document.getElementById("remoteCameraVideo").muted = true;
        $("<button id='playBtn'>Tap to Unmute</button><br><br>").insertBefore("#remoteCameraVideo")
        $("#playBtn").click(function (){
            document.getElementById("remoteCameraVideo").muted = false;
        })
    }
});

function setOnClickEventListeners() {
    $('#call-btn').click(function () {
        call(false);
    });
    $('#call-video-btn').click(function () {
        call(true);
    });
    $('#toggle-share-screen-btn').click(toggleShareScreen);
    $('#toggle-camera-video-btn').click(toggleCameraVideo);
    $('#accept-btn').click(accept);
    $('#decline-btn').click(decline);
    $('#hangup-btn').click(hangup);
}

function call(video = false) {
    let webrtcCallOptions = WebrtcCallOptions.builder()
        .setVideo(video)
        .build();
    activeCall = infobipRTC.callWebrtc(getDestination(), webrtcCallOptions);
    listenForCallEvents();
}

function listenForIncomingCall() {
    $('#toggle-share-screen-btn').prop('disabled', true);
    $('#toggle-camera-video-btn').prop('disabled', true);

    infobipRTC.on(InfobipRTCEvent.INCOMING_WEBRTC_CALL, function (incomingCallEvent) {
        let incomingWebrtcCall = incomingCallEvent.incomingCall;
        console.log('Received incoming call from: ' + incomingWebrtcCall.counterpart().identifier);
        activeCall = incomingWebrtcCall;

        $('#accept-decline-buttons').prop('hidden', false);
        $('#status').html('Incoming ' + (incomingWebrtcCall.options.video ? 'video' : 'audio') + ' call from: ' + incomingWebrtcCall.counterpart().identifier);

        listenForCallEvents();
   });
}

function listenForCallEvents() {
    $('#call-btn').prop('disabled', true);
    $('#call-video-btn').prop('disabled', true);
    $('#toggle-share-screen-btn').prop('disabled', true);
    $('#toggle-camera-video-btn').prop('disabled', true);
    $('#hangup-btn').prop('disabled', false);

    activeCall.on(CallsApiEvent.RINGING, function (event) {
        $('#status').html('Ringing...');
        console.log('Call is ringing...');
    });
    activeCall.on(CallsApiEvent.ESTABLISHED, function (event) {
        $('#toggle-share-screen-btn').prop('disabled', false);
        $('#toggle-camera-video-btn').prop('disabled', false);
        $('#status').html('Call established with: ' + activeCall.counterpart().identifier);
        console.log('Call established with ' + activeCall.counterpart().identifier);
        setMediaStream($('#remoteAudio')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.HANGUP, function (event) {
        $('#status').html('Call finished: ' + event.errorCode.name);
        console.log('Call finished: ' + event.errorCode.name);
        hangup();
    });
    activeCall.on(CallsApiEvent.ERROR, function (event) {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });

    activeCall.on(CallsApiEvent.CAMERA_VIDEO_ADDED, function (event) {
        $('#status').html('Local camera video has been added');
        console.log('Local camera video has been added');
        setMediaStream($('#localCameraVideo')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, function (event) {
        $('#status').html('Local camera video has been updated');
        console.log('Local camera video has been updated');
        setMediaStream($('#localCameraVideo')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.CAMERA_VIDEO_REMOVED, function () {
        $('#status').html('Local camera video has been removed');
        console.log('Local camera video has been removed');
        setMediaStream($('#localCameraVideo')[0], null);
    });
    activeCall.on(CallsApiEvent.SCREEN_SHARE_ADDED, function (event) {
        $('#status').html('Local screenshare has been added');
        console.log('Local screenshare has been added');
        setMediaStream($('#localScreenShare')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.SCREEN_SHARE_REMOVED, function () {
        $('#status').html('Local screenshare has been removed');
        console.log('Local screenshare has been removed');
        setMediaStream($('#localScreenShare')[0], null);
    });

    activeCall.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_ADDED, function (event) {
        $('#status').html('Remote camera video has been added');
        console.log('Remote camera video has been added');
        setMediaStream($('#remoteCameraVideo')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_REMOVED, function () {
        $('#status').html('Remote camera video has been removed');
        console.log('Remote camera video has been removed');
        setMediaStream($('#remoteCameraVideo')[0], null);
    });
    activeCall.on(CallsApiEvent.REMOTE_SCREEN_SHARE_ADDED, function (event) {
        $('#status').html('Remote screenshare has been added');
        console.log('Remote screenshare has been added');
        setMediaStream($('#remoteScreenShare')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.REMOTE_SCREEN_SHARE_REMOVED, function () {
        $('#status').html('Remote screenshare has been removed');
        console.log('Remote screenshare has been removed');
        setMediaStream($('#remoteScreenShare')[0], null);
    });

    activeCall.on(CallsApiEvent.REMOTE_MUTED, function () {
        $('#status').html('Remote participant has been muted');
        console.log('Remote participant has been muted');
    });
    activeCall.on(CallsApiEvent.REMOTE_UNMUTED, function () {
        $('#status').html('Remote participant has been unmuted');
        console.log('Remote participant has been unmuted');
    });
}

function toggleShareScreen() {
    if (activeCall) {
        activeCall.screenShare(!activeCall.hasScreenShare());
    }
}

function toggleCameraVideo() {
    if (activeCall) {
        activeCall.cameraVideo(!activeCall.hasCameraVideo());
    }
}

function setMediaStream(element, stream) {
    element.srcObject = stream;
    $('#localVideos').prop('hidden', !shouldShowLocalVideos());
    $('#remoteVideos').prop('hidden', !shouldShowRemoteVideos());
}

function accept() {
    $('#accept-decline-buttons').prop('hidden', true);
    activeCall.accept();
}

function decline() {
    $('#accept-decline-buttons').prop('hidden', true);
    activeCall.decline();
}

function hangup() {
    if (activeCall) {
        activeCall.hangup();
    }
    activeCall = undefined;
    $('#status').html('');
    $('#hangup-btn').prop('disabled', true);
    $('#call-btn').prop('disabled', false);
    $('#call-video-btn').prop('disabled', false);
    $('#toggle-share-screen-btn').prop('disabled', true);
    $('#toggle-camera-video-btn').prop('disabled', true);
    removeAllMediaStreams();
}

function removeAllMediaStreams() {
    $('#remoteCameraVideo')[0].srcObject = null;
    $('#remoteScreenShare')[0].srcObject = null;
    $('#localCameraVideo')[0].srcObject = null;
    $('#localScreenShare')[0].srcObject = null;
    $('#remoteAudio')[0].srcObject = null;

    $('#localVideos').prop('hidden', true);
    $('#remoteVideos').prop('hidden', true);
}

function getDestination() {
    return $('#destination').val();
}

function shouldShowLocalVideos() {
    return activeCall && (activeCall.hasCameraVideo() || activeCall.hasScreenShare());
}

function shouldShowRemoteVideos() {
    return activeCall && (activeCall.hasRemoteCameraVideo() || activeCall.hasRemoteScreenShare());
}
