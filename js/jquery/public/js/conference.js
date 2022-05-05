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
    let conferenceOptions = ConferenceOptions.builder()
        .setVideo(video)
        .build();

    activeConference = infobipRTC.joinConference(getConferenceId(), conferenceOptions);
    listenForConferenceEvents();
}

function listenForConferenceEvents() {
    $('#join-btn').prop('disabled', true);
    $('#leave-btn').prop('disabled', true);

    activeConference.on('joined', function (event) {
        $('#status').html('Joined conference with ID: ' + getConferenceId());
        console.log('Joined conference with ID: ' + getConferenceId());
        setMediaStream($('#remoteAudio')[0], event.stream);
        setValuesAfterJoiningConference();
        if (event.users.length) {
            $("#users").append("<br/><b>Users:</b><br/>");
            event.users.forEach(user => this.addUser(user.identity));
        }
    });
    activeConference.on('left', function (event) {
        $('#status').html('Left conference with ID: ' + getConferenceId());
        console.log('Left conference with ID: ' + getConferenceId());
        removeMediaStreams();
        setValuesAfterLeavingConference();
    });
    activeConference.on('user-joined', function (event) {
        $('#status').html('User ' + event.user.identity + ' joined conference');
        console.log('User ' + event.user.identity + ' joined conference');
        this.addUser(event.user.identity);
    });
    activeConference.on('user-left', function (event) {
        $('#status').html('User ' + event.user.identity + ' left conference');
        console.log('User ' + event.user.identity + ' left conference');
        this.removeUser(event.user.identity);
    });
    activeConference.on('user-muted', function (event) {
        $('#status').html('User ' + event.user.identity + ' is now muted');
        console.log('User ' + event.user.identity + ' is now muted');
    });
    activeConference.on('user-unmuted', function (event) {
        $('#status').html('User ' + event.user.identity + ' is now unmuted');
        console.log('User ' + event.user.identity + ' is now unmuted');
    });

    activeConference.on('local-camera-video-added', function (event) {
        $('#status').html('User added local camera video');
        console.log('User added local camera video');
        setMediaStream($('#localCameraVideo')[0], event.stream);
    });
    activeConference.on('local-camera-video-removed', function (event) {
        $('#status').html('User removed local camera video');
        console.log('User removed local camera video');
        setMediaStream($('#localCameraVideo')[0], null);
    });
    activeConference.on('local-screenshare-added', function (event) {
        $('#status').html('User removed local screenshare');
        console.log('User removed local screenshare');
        setMediaStream($('#localScreenShare')[0], event.stream);
    });
    activeConference.on('local-screenshare-removed', function (event) {
        $('#status').html('User removed local screenshare');
        console.log('User removed local screenshare');
        setMediaStream($('#localScreenShare')[0], null);
    });

    activeConference.on('user-camera-video-added', function (event) {
        $('#status').html('User ' + event.user.identity + ' added camera video');
        console.log('User ' + event.user.identity + ' added camera video');
        addVideoElement(event.user.identity, 'camera-video', event.stream);
    });
    activeConference.on('user-camera-video-removed', function (event) {
        $('#status').html('User ' + event.user.identity + ' removed camera video');
        console.log('User ' + event.user.identity + ' removed camera video');
        removeVideoElement(event.user.identity, 'camera-video');
    });
    activeConference.on('user-screenshare-added', function (event) {
        $('#status').html('User ' + event.user.identity + ' added screenshare');
        console.log('User ' + event.user.identity + ' added screenshare');
        addVideoElement(event.user.identity, 'screenshare', event.stream);
    });
    activeConference.on('user-screenshare-removed', function (event) {
        $('#status').html('User ' + event.user.identity + ' removed screenshare');
        console.log('User ' + event.user.identity + ' removed screenshare');
        removeVideoElement(event.user.identity, 'screenshare');
    });

    activeConference.on('error', function (event) {
        $('#status').html('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });
}

function setMediaStream(element, stream) {
    element.srcObject = stream;
    const showLocalVideos = (activeConference && (activeConference.hasCameraVideo() || activeConference.hasScreenShare()))
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
    if (activeConference) {
        activeConference.leave();
    }
}

function toggleShareScreen() {
    if (activeConference) {
        activeConference.screenShare(!activeConference.hasScreenShare())
            .catch(error => console.log('Error toggling screen share {}', error));
    }
}

function toggleCameraVideo() {
    if (activeConference) {
        activeConference.cameraVideo(!activeConference.hasCameraVideo())
            .catch(error => console.log('Error toggling camera video {}', error));
    }
}

function setValuesAfterJoiningConference() {
    $('#join-btn').prop('disabled', true);
    $('#join-video-btn').prop('disabled', true);
    $('#leave-btn').prop('disabled', false);
    $('#toggle-camera-video-btn').prop('disabled', false);
    $('#toggle-share-screen-btn').prop('disabled', false);
    $('#localVideos').prop('hidden', true);
    $('#remoteVideos').prop('hidden', true);
}

function setValuesAfterLeavingConference() {
    activeConference = undefined;
    $('#status').html('');
    $('#join-btn').prop('disabled', false);
    $('#join-video-btn').prop('disabled', false);
    $('#leave-btn').prop('disabled', true);
    $('#toggle-camera-video-btn').prop('disabled', true);
    $('#toggle-share-screen-btn').prop('disabled', true);
    $('#localVideos').prop('hidden', true);
    $('#remoteVideos').prop('hidden', true);
}

function getConferenceId() {
    return $('#conferenceId').val();
}

function addVideoElement(identity, type, stream) {
    const videos = document.getElementById('videos');
    const video = document.createElement('video');
    video.setAttribute('id', type + '-' + identity);
    video.width = 300;
    video.height = 300;
    video.autoplay = true
    video.srcObject = stream;
    videos.appendChild(video);
    $('#remoteVideos').prop('hidden', false);
}

function removeVideoElement(identity, type) {
    const videos = document.getElementById('videos');
    const video = document.getElementById(type + '-' + identity);
    videos.removeChild(video);

    if (!videos.firstChild) {
        $('#remoteVideos').prop('hidden', true);
    }
}

function addUser(identity) {
    $("#users").append("<div id='" + identity + "'>" + identity + "</div>");
}

function removeUser(identity) {
    document.getElementById(identity).innerHTML = '';
}
