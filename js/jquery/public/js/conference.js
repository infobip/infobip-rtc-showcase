$(document).ready(function () {
    setOnClickEventListeners();
    connectInfobipRTC()
        .then(identity => {
            $('#identity').html(identity);
        })
});

function setOnClickEventListeners() {
    $('#join-btn').click(join);
    $('#leave-btn').click(leave);
}

function join() {
    let conferenceOptions = ConferenceOptions.builder()
        .setVideo(false)
        .build();

    activeConference = infobipRTC.joinConference(getConferenceId(), conferenceOptions);
    listenForConferenceEvents();
}

function listenForConferenceEvents() {
    $('#join-btn').prop('disabled', true);
    $('#leave-btn').prop('disabled', true);

    activeConference.on('joined', function (event) {
        $('#join-btn').prop('disabled', true);
        $('#leave-btn').prop('disabled', false);
        $('#status').html('Joined conference with ID: ' + getConferenceId());
        console.log('Joined conference with ID: ' + getConferenceId());
        setMediaStream(activeConference, event);
    });
    activeConference.on('left', function (event) {
        $('#status').html('Left conference with ID: ' + getConferenceId());
        console.log('Left conference with ID: ' + getConferenceId());
        removeMediaStream();
        setValuesAfterLeavingConference();
    });
    activeConference.on('user-joined', function (event) {
        $('#status').html('User ' + event.user.identity + ' joined conference');
        console.log('User ' + event.user.identity + ' joined conference');
    });
    activeConference.on('user-left', function (event) {
        $('#status').html('User ' + event.user.identity + ' left conference');
        console.log('User ' + event.user.identity + ' left conference');
    });
    activeConference.on('user-muted', function (event) {
        $('#status').html('User ' + event.user.identity + ' is now muted');
        console.log('User ' + event.user.identity + ' is now muted');
    });
    activeConference.on('user-unmuted', function (event) {
        $('#status').html('User ' + event.user.identity + ' is now unmuted');
        console.log('User ' + event.user.identity + ' is now unmuted');
    });
    activeConference.on('error', function (event) {
        $('#status').html('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        removeMediaStream();
        setValuesAfterLeavingConference();
    });
}

function setMediaStream(call, event) {
    $('#remoteAudio')[0].srcObject = event.stream;
}

function removeMediaStream() {
    $('#remoteAudio')[0].srcObject = null;
}

function leave() {
    if (activeConference) {
        activeConference.leave();
    }
}

function setValuesAfterLeavingConference() {
    activeConference = undefined;
    $('#status').html('');
    $('#leave-btn').prop('disabled', true);
    $('#join-btn').prop('disabled', false);
}

function getConferenceId() {
    return $('#conferenceId').val();
}