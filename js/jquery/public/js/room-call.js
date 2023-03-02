$(document).ready(function () {
    setOnClickEventListeners();
    connectInfobipRTC()
        .then(identity => {
            $('#identity').html(identity);
        })
});

function setOnClickEventListeners() {
    $('#join-btn').click(function () {
        join(false);
    });
    $('#join-video-btn').click(function () {
        join(true);
    });
    $('#leave-btn').click(leave);
    $('#toggle-camera-video-btn').click(toggleCameraVideo);
    $('#toggle-share-screen-btn').click(toggleShareScreen);
}

function join(video = false) {
    let roomCallOptions = RoomCallOptions.builder()
        .setVideo(video)
        .build();

    activeRoomCall = infobipRTC.joinRoom(getRoomName(), roomCallOptions);
    listenForRoomCallEvents();
}

function listenForRoomCallEvents() {
    $('#join-btn').prop('disabled', true);
    $('#leave-btn').prop('disabled', true);

    activeRoomCall.on(CallsApiEvent.ROOM_JOINED, function (event) {
        $('#status').html('Joined room: ' + getRoomName());
        console.log('Joined room: ' + getRoomName());
        setMediaStream($('#remoteAudio')[0], event.stream);
        setValuesAfterJoiningRoom();
        if (event.participants.length) {
            $("#participants").append("<br/><b>Participants:</b><br/>");
            event.participants.forEach(participant => this.addParticipant(participant.endpoint.identifier));
        }
    });
    activeRoomCall.on(CallsApiEvent.ROOM_LEFT, function (event) {
        $('#status').html('Left room: ' + event.errorCode.name);
        console.log('Left room: ' + event.errorCode.name);
        removeMediaStreams();
        setValuesAfterLeavingRoom();
    });
    activeRoomCall.on(CallsApiEvent.PARTICIPANT_JOINING, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' is joining room');
        console.log('Participant ' + event.participant.endpoint.identifier + ' is joining room');
    });
    activeRoomCall.on(CallsApiEvent.PARTICIPANT_JOINED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' joined room');
        console.log('Participant ' + event.participant.endpoint.identifier + ' joined room');
        this.addParticipant(event.participant.endpoint.identifier);
    });
    activeRoomCall.on(CallsApiEvent.PARTICIPANT_LEFT, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' left room');
        console.log('Participant ' + event.participant.endpoint.identifier + ' left room');
        this.removeParticipant(event.participant.endpoint.identifier);
    });

    activeRoomCall.on(CallsApiEvent.PARTICIPANT_MUTED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' is now muted');
        console.log('Participant ' + event.participant.endpoint.identifier + ' is now muted');
    });
    activeRoomCall.on(CallsApiEvent.PARTICIPANT_UNMUTED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' is now unmuted');
        console.log('Participant ' + event.participant.endpoint.identifier + ' is now unmuted');
    });

    activeRoomCall.on(CallsApiEvent.CAMERA_VIDEO_ADDED, function (event) {
        $('#status').html('Participant added local camera video');
        console.log('Participant added local camera video');
        setMediaStream($('#localCameraVideo')[0], event.stream);
    });
    activeRoomCall.on(CallsApiEvent.CAMERA_VIDEO_UPDATED, function (event) {
        $('#status').html('Participant updated local camera video');
        console.log('Participant updated local camera video');
        setMediaStream($('#localCameraVideo')[0], event.stream);
    });
    activeRoomCall.on(CallsApiEvent.CAMERA_VIDEO_REMOVED, function () {
        $('#status').html('Participant removed local camera video');
        console.log('Participant removed local camera video');
        setMediaStream($('#localCameraVideo')[0], null);
    });

    activeRoomCall.on(CallsApiEvent.SCREEN_SHARE_ADDED, function (event) {
        $('#status').html('Participant added local screenshare');
        console.log('Participant added local screenshare');
        setMediaStream($('#localScreenShare')[0], event.stream);
    });
    activeRoomCall.on(CallsApiEvent.SCREEN_SHARE_REMOVED, function () {
        $('#status').html('Participant removed local screenshare');
        console.log('Participant removed local screenshare');
        setMediaStream($('#localScreenShare')[0], null);
    });

    activeRoomCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_ADDED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' added camera video');
        console.log('Participant ' + event.participant.endpoint.identifier + ' added camera video');
        addVideoElement(event.participant.endpoint.identifier, 'camera-video', event.stream);
    });
    activeRoomCall.on(CallsApiEvent.PARTICIPANT_CAMERA_VIDEO_REMOVED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' removed camera video');
        console.log('Participant ' + event.participant.endpoint.identifier + ' removed camera video');
        removeVideoElement(event.participant.endpoint.identifier, 'camera-video');
    });

    activeRoomCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_ADDED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' added screenshare');
        console.log('Participant ' + event.participant.endpoint.identifier + ' added screenshare');
        addVideoElement(event.participant.endpoint.identifier, 'screenshare', event.stream);
    });
    activeRoomCall.on(CallsApiEvent.PARTICIPANT_SCREEN_SHARE_REMOVED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' removed screenshare');
        console.log('Participant ' + event.participant.endpoint.identifier + ' removed screenshare');
        removeVideoElement(event.participant.endpoint.identifier, 'screenshare');
    });

    activeRoomCall.on(CallsApiEvent.ERROR, function (event) {
        $('#status').html('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });
}

function setMediaStream(element, stream) {
    element.srcObject = stream;
    const showLocalVideos = (activeRoomCall && (activeRoomCall.hasCameraVideo() || activeRoomCall.hasScreenShare()))
    $('#localVideos').prop('hidden', !showLocalVideos);
}

function removeMediaStreams() {
    this.setMediaStream($('#remoteAudio')[0], null);
    this.setMediaStream($('#localCameraVideo')[0], null);
    this.setMediaStream($('#localScreenShare')[0], null);

    const videos = document.getElementById('videos');
    while (videos.firstChild) {
        videos.removeChild(videos.lastChild);
    }
}

function leave() {
    if (activeRoomCall) {
        activeRoomCall.leave();
    }
}

function toggleShareScreen() {
    if (activeRoomCall) {
        activeRoomCall.screenShare(!activeRoomCall.hasScreenShare())
            .catch(error => console.log('Error toggling screen share {}', error));
    }
}

function toggleCameraVideo() {
    if (activeRoomCall) {
        activeRoomCall.cameraVideo(!activeRoomCall.hasCameraVideo())
            .catch(error => console.log('Error toggling camera video {}', error));
    }
}

function setValuesAfterJoiningRoom() {
    $('#join-btn').prop('disabled', true);
    $('#join-video-btn').prop('disabled', true);
    $('#leave-btn').prop('disabled', false);
    $('#toggle-camera-video-btn').prop('disabled', false);
    $('#toggle-share-screen-btn').prop('disabled', false);
}

function setValuesAfterLeavingRoom() {
    activeRoomCall = undefined;
    $('#status').html('');
    $('#participants').html('');
    $('#join-btn').prop('disabled', false);
    $('#join-video-btn').prop('disabled', false);
    $('#leave-btn').prop('disabled', true);
    $('#toggle-camera-video-btn').prop('disabled', true);
    $('#toggle-share-screen-btn').prop('disabled', true);
    $('#localVideos').prop('hidden', true);
    $('#remoteVideos').prop('hidden', true);
}

function getRoomName() {
    return $('#roomName').val();
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
    $('#remoteVideos').prop('hidden', false);
}

function removeVideoElement(identifier, type) {
    const videos = document.getElementById('videos');
    const video = document.getElementById(type + '-' + identifier);
    videos.removeChild(video);

    if (!videos.firstChild) {
        $('#remoteVideos').prop('hidden', true);
    }
}

function addParticipant(identifier) {
    $("#participants").append("<div id='" + identifier + "'>" + identifier + "</div>");
}

function removeParticipant(identifier) {
    document.getElementById(identifier).innerHTML = '';
}
