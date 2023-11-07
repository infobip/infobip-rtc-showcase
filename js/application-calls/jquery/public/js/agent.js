$(document).ready(function () {
    setOnClickEventListeners();
    connectInfobipRTC("agent")
        .then(identity => {
            listenForIncomingApplicationCall();
            $('#identity').html(identity);
        })
});

function setOnClickEventListeners() {
    $('#accept-btn').click(accept);
    $('#decline-btn').click(decline);
    $('#hangup-btn').click(hangup);
    $('#toggle-camera-video-btn').click(toggleCameraVideo);
    $('#toggle-screen-share-btn').click(toggleScreenShare);
}

function listenForIncomingApplicationCall() {
    infobipRTC.on(InfobipRTCEvent.INCOMING_APPLICATION_CALL, function (incomingApplicationCallEvent) {
        let incomingApplicationCall = incomingApplicationCallEvent.incomingCall;
        console.log('Received incoming call from: ' + incomingApplicationCall.from());
        activeCall = incomingApplicationCall;

        $('#incoming-call-actions').prop('hidden', false);
        $('#status').html('Incoming ' + (incomingApplicationCall.options.video ? 'video' : 'audio') + ' call from: ' + incomingApplicationCall.from());

        listenForApplicationCallEvents();
   });
}

function listenForApplicationCallEvents() {
    activeCall.on(CallsApiEvent.RINGING, function () {
        $('#status').html('Ringing...');
        console.log('Call is ringing...');
    });
    activeCall.on(CallsApiEvent.ESTABLISHED, function (event) {
        $('#status').html('Established...');
        console.log('Call is established...');
        setMediaStream($('#remote-audio')[0], event.stream);
    });
    activeCall.on(CallsApiEvent.HANGUP, function (event) {
        $('#status').html('Call finished, errorCode: ' + event.errorCode.name);
        console.log('Call finished, errorCode: ' + event.errorCode.name);
        setValuesAfterCall();
        removeMediaStreams();
    });
    activeCall.on(CallsApiEvent.ERROR, function (event) {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });

    activeCall.on(CallsApiEvent.CONFERENCE_JOINED, function (event) {
        $('#status').html('Joined conference, conferenceId: ' + event.id);
        console.log('Joined conference, conferenceId: ' + event.id);
    });
    activeCall.on(CallsApiEvent.CONFERENCE_LEFT, function (event) {
        $('#status').html('Left conference, errorCode: ' + event.errorCode.name);
        console.log('Left conference, errorCode: ' + event.errorCode.name);
    });
    activeCall.on(CallsApiEvent.DIALOG_JOINED, function (event) {
        $('#status').html('Joined dialog, dialogId: ' + event.id);
        console.log('Joined dialog, dialogId: ' + event.id);
    });
    activeCall.on(CallsApiEvent.DIALOG_LEFT, function (event) {
        $('#status').html('Left dialog, errorCode: ' + event.errorCode.name);
        console.log('Left dialog, errorCode: ' + event.errorCode.name);
    });

    activeCall.on(CallsApiEvent.PARTICIPANT_JOINING, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' is joining');
        console.log('Participant ' + event.participant.endpoint.identifier + ' is joining');
    });
    activeCall.on(CallsApiEvent.PARTICIPANT_JOINED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' joined');
        console.log('Participant ' + event.participant.endpoint.identifier + ' joined');
    });
    activeCall.on(CallsApiEvent.PARTICIPANT_LEFT, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' left');
        console.log('Participant ' + event.participant.endpoint.identifier + ' left');
    });

    activeCall.on(CallsApiEvent.PARTICIPANT_MUTED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' is now muted');
        console.log('Participant ' + event.participant.endpoint.identifier + ' is now muted');
    });
    activeCall.on(CallsApiEvent.PARTICIPANT_UNMUTED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' is now unmuted');
        console.log('Participant ' + event.participant.endpoint.identifier + ' is now unmuted');
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

    activeCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_ADDED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' added camera video');
        console.log('Participant ' + event.participant.endpoint.identifier + ' added camera video');
        addVideoElement(event.participant.endpoint.identifier, 'camera-video', event.stream);
    });
    activeCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_REMOVED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' removed camera video');
        console.log('Participant ' + event.participant.endpoint.identifier + ' removed camera video');
        removeVideoElement(event.participant.endpoint.identifier, 'camera-video');
    });
    activeCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_ADDED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' added screenshare');
        console.log('Participant ' + event.participant.endpoint.identifier + ' added screenshare');
        addVideoElement(event.participant.endpoint.identifier, 'screenshare', event.stream);
    });
    activeCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_REMOVED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' removed screenshare');
        console.log('Participant ' + event.participant.endpoint.identifier + ' removed screenshare');
        removeVideoElement(event.participant.endpoint.identifier, 'screenshare');
    });
}

function accept() {
    let applicationCallOptions = ApplicationCallOptions.builder().setVideo(true).build();
    activeCall.accept(applicationCallOptions);
    $('#incoming-call-actions').prop('hidden', true);
    $('#call-actions').prop('hidden', false);
}

function decline() {
    activeCall.decline();
    $('#incoming-call-actions').prop('hidden', true);
    $('#call-actions').prop('hidden', false);
}

function hangup() {
    if (activeCall) {
        activeCall.hangup();
    }
}

function toggleScreenShare() {
    if (activeCall) {
        activeCall.screenShare(!activeCall.hasScreenShare())
            .catch(error => console.log('Error toggling screen share {}', error));
    }
}

function toggleCameraVideo() {
    if (activeCall) {
        activeCall.cameraVideo(!activeCall.hasCameraVideo())
            .catch(error => console.log('Error toggling camera video {}', error));
    }
}

function setValuesAfterCall() {
    activeCall = undefined;
    $('#status').html('');
    $('#incoming-call-actions').prop('hidden', true);
    $('#call-actions').prop('hidden', true);
}

function setMediaStream(element, stream) {
    element.srcObject = stream;
    const showLocalVideos = (activeCall && (activeCall.hasCameraVideo() || activeCall.hasScreenShare()))
    $('#local-videos').prop('hidden', !showLocalVideos);
}

function addVideoElement(identifier, type, stream) {
    const videos = document.getElementById('videos');
    const video = document.createElement('video');
    video.setAttribute('id', type + '-' + identifier);
    video.width = 300;
    video.height = 300;
    video.autoplay = true
    video.srcObject = stream;
    videos.appendChild(video);
    $('#remote-videos').prop('hidden', false);
}

function removeVideoElement(identifier, type) {
    const videos = document.getElementById('videos');
    const video = document.getElementById(type + '-' + identifier);
    videos.removeChild(video);

    if (!videos.firstChild) {
        $('#remote-videos').prop('hidden', true);
    }
}

function removeMediaStreams() {
    this.setMediaStream($('#remote-audio')[0], null);
    this.setMediaStream($('#local-camera-video')[0], null);
    this.setMediaStream($('#local-screen-share')[0], null);

    const videos = document.getElementById('videos');
    while (videos.firstChild) {
        videos.removeChild(videos.lastChild);
    }
    $('#remote-videos').prop('hidden', true);
}