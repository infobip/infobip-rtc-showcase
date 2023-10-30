$(document).ready(function () {
    setOnClickEventListeners();
    connectInfobipRTC()
        .then(identity => {
            $('#identity').html(identity);
        })
});

function setOnClickEventListeners() {
    $('#call-btn').click(callPhone);
    $('#hangup-btn').click(hangup);
}

function callPhone() {
    let phoneCallOptions = PhoneCallOptions.builder()
        .setFrom('33712345678')
        .build();
    activeCall = infobipRTC.callPhone(getDestination(), phoneCallOptions);
    listenForCallEvents();
}

function listenForCallEvents() {
    $('#call-btn').prop('disabled', true);
    $('#hangup-btn').prop('disabled', false);

    activeCall.on(CallsApiEvent.RINGING, function (event) {
        $('#status').html('Ringing...');
        console.log('Call is ringing...');
    });
    activeCall.on(CallsApiEvent.ESTABLISHED, function (event) {
        $('#toggle-share-screen-btn').prop('disabled', false);
        $('#toggle-camera-video-btn').prop('disabled', false);
        $('#status').html('Call established with: ' + getDestination());
        console.log('Call established with ' + getDestination());
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
}

function setMediaStream(element, stream) {
    element.srcObject = stream;
}

function hangup() {
    if (activeCall) {
        activeCall.hangup();
    }
    activeCall = undefined;
    $('#status').html('');
    $('#hangup-btn').prop('disabled', true);
    $('#call-btn').prop('disabled', false);
    setMediaStream($('#remoteAudio')[0], null);
}

function getDestination() {
    return $('#destination').val();
}
