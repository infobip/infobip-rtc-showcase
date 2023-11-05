$(document).ready(function () {
    setOnClickEventListeners();
    connectInfobipRTC()
        .then(identity => {
            listenForIncomingCall();
            $('#identity').html(identity);
        })

    const userAgent = window.navigator.userAgent;
    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
        document.getElementById("remote-camera-video").muted = true;
        $("<button id='play-btn'>Tap to Unmute</button><br><br>").insertBefore("#remote-camera-video")
        $("#play-btn").click(function (){
            document.getElementById("remote-camera-video").muted = false;
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
    $('#toggle-screen-share-btn').click(toggleScreenShare);
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
    $('#toggle-screen-share-btn').prop('disabled', true);
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
    $('#toggle-screen-share-btn').prop('disabled', true);
    $('#toggle-camera-video-btn').prop('disabled', true);
    $('#hangup-btn').prop('disabled', false);

    activeCall.on(CallsApiEvent.RINGING, function (event) {
        $('#status').html('Ringing...');
        console.log('Call is ringing...');
    });
    activeCall.on(CallsApiEvent.ESTABLISHED, function (event) {
        $('#toggle-screen-share-btn').prop('disabled', false);
        $('#toggle-camera-video-btn').prop('disabled', false);
        $('#status').html('Call established with: ' + activeCall.counterpart().identifier);
        console.log('Call established with ' + activeCall.counterpart().identifier);
        setMediaStream($('#remote-audio')[0], event.stream);
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
        setMediaStream($('#local-camera-video')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, function (event) {
        $('#status').html('Local camera video has been updated');
        console.log('Local camera video has been updated');
        setMediaStream($('#local-camera-video')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.CAMERA_VIDEO_REMOVED, function () {
        $('#status').html('Local camera video has been removed');
        console.log('Local camera video has been removed');
        setMediaStream($('#local-camera-video')[0], null);
    });
    activeCall.on(CallsApiEvent.SCREEN_SHARE_ADDED, function (event) {
        $('#status').html('Local screenshare has been added');
        console.log('Local screenshare has been added');
        setMediaStream($('#local-screen-share')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.SCREEN_SHARE_REMOVED, function () {
        $('#status').html('Local screenshare has been removed');
        console.log('Local screenshare has been removed');
        setMediaStream($('#local-screen-share')[0], null);
    });

    activeCall.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_ADDED, function (event) {
        $('#status').html('Remote camera video has been added');
        console.log('Remote camera video has been added');
        setMediaStream($('#remote-camera-video')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.REMOTE_CAMERA_VIDEO_REMOVED, function () {
        $('#status').html('Remote camera video has been removed');
        console.log('Remote camera video has been removed');
        setMediaStream($('#remote-camera-video')[0], null);
    });
    activeCall.on(CallsApiEvent.REMOTE_SCREEN_SHARE_ADDED, function (event) {
        $('#status').html('Remote screenshare has been added');
        console.log('Remote screenshare has been added');
        setMediaStream($('#remote-screen-share')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.REMOTE_SCREEN_SHARE_REMOVED, function () {
        $('#status').html('Remote screenshare has been removed');
        console.log('Remote screenshare has been removed');
        setMediaStream($('#remote-screen-share')[0], null);
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

function toggleScreenShare() {
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
    $('#local-videos').prop('hidden', !shouldShowLocalVideos());
    $('#remote-videos').prop('hidden', !shouldShowRemoteVideos());
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
    $('#toggle-screen-share-btn').prop('disabled', true);
    $('#toggle-camera-video-btn').prop('disabled', true);
    removeAllMediaStreams();
}

function removeAllMediaStreams() {
    $('#remote-camera-video')[0].srcObject = null;
    $('#remote-screen-share')[0].srcObject = null;
    $('#local-camera-video')[0].srcObject = null;
    $('#local-screen-share')[0].srcObject = null;
    $('#remote-audio')[0].srcObject = null;

    $('#local-videos').prop('hidden', true);
    $('#remote-videos').prop('hidden', true);
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
