$(document).ready(function () {
    setOnClickEventListeners();
    connectInfobipRTC()
        .then(identity => {
            listenForIncomingCall();
            $('#identity').html(identity);
        })

    const userAgent = window.navigator.userAgent;
    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
        document.getElementById("remoteVideo").muted = true;
        $("<button id='playBtn'>Tap to Unmute</button><br><br>").insertBefore("#remoteVideo")
        $("#playBtn").click(function (){
            document.getElementById("remoteVideo").muted = false;
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
    $('#call-share-screen-btn').click(toggleShareScreen);
    $('#call-phone-number-btn').click(callPhoneNumber);
    $('#accept-btn').click(accept);
    $('#decline-btn').click(decline);
    $('#hangup-btn').click(hangup);
}

function call(video = false) {
    let callOptions = CallOptions.builder()
        .setVideo(video)
        .build();
    activeCall = infobipRTC.call(getDestination(), callOptions);
    listenForCallEvents();
}

function callPhoneNumber() {
    let callPhoneNumberOptions = CallPhoneNumberOptions.builder()
        .setFrom('33712345678')
        .build();
    activeCall = infobipRTC.callPhoneNumber(getDestination(), callPhoneNumberOptions);
    listenForCallEvents();
}

function listenForIncomingCall() {
    $('#call-share-screen-btn').prop('disabled', true);
    infobipRTC.on('incoming-call', function (incomingCallEvent) {
        let incomingCall = incomingCallEvent.incomingCall;
        console.log('Received incoming call from: ' + incomingCall.source().identity);
        activeCall = incomingCall;
        incomingCall.on('established', event => {
            $('#call-btn').prop('disabled', true);
            $('#call-video-btn').prop('disabled', true);
            $('#call-phone-number-btn').prop('disabled', true);
            $('#hangup-btn').prop('disabled', false);
            $('#call-share-screen-btn').prop('disabled', false);
            $('#status').html('In a call with: ' + incomingCall.source().identity);
            setMediaStream(incomingCall, event);
        });
        incomingCall.on('hangup', () => {
            hangup();
        });
        incomingCall.on('updated', function (event) {
            setMediaStream(incomingCall, event);
            $('#call-share-screen-btn').prop('disabled', false);
        });
        incomingCall.on('error', () => {
            console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
            hangup();
        });

        $('#accept-btn').prop('disabled', false);
        $('#decline-btn').prop('disabled', false);
        $('#status').html('Incoming ' + (incomingCall.options.video ? 'video' : 'audio') + ' call from: ' + incomingCall.source().identity);
    });
}

function listenForCallEvents() {
    $('#call-btn').prop('disabled', true);
    $('#call-video-btn').prop('disabled', true);
    $('#call-phone-number-btn').prop('disabled', true);
    $('#call-share-screen-btn').prop('disabled', true);
    $('#hangup-btn').prop('disabled', false);

    activeCall.on('established', function (event) {
        $('#call-share-screen-btn').prop('disabled', false);
        $('#status').html('Call established with: ' + getDestination());
        console.log('Call established with ' + getDestination());
        setMediaStream(activeCall, event);
    });
    activeCall.on('hangup', function (event) {
        hangup();
    });
    activeCall.on('updated', function (event) {
        setMediaStream(activeCall, event);
        $('#call-share-screen-btn').prop('disabled', false);
    });
    activeCall.on('ringing', function (event) {
        $('#status').html('Ringing...');
        console.log('Call is ringing...');
    });
    activeCall.on('error', function (event) {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        hangup();
    });
}

function toggleShareScreen() {
    if (activeCall) {
        activeCall.screenShare(!activeCall.hasScreenShare());
    }
}

function removeMediaStream() {
    $('#remoteVideo')[0].srcObject = null;
    $('#localVideo')[0].srcObject = null;
    $('#remoteAudio')[0].srcObject = null;
}

function setMediaStream(call, event) {
    if (call.hasLocalVideo()) {
        $('#localVideo')[0].srcObject = event.localStream;
    } else {
        $('#localVideo')[0].srcObject = null;
    }

    if(call.hasRemoteVideo()) {
        $('#remoteVideo')[0].srcObject = event.remoteStream;
        $('#remoteAudio')[0].srcObject = null;
    } else {
        $('#remoteVideo')[0].srcObject = null;
        $('#remoteAudio')[0].srcObject = event.remoteStream;
    }
}

function accept() {
    $('#accept-btn').prop('disabled', true);
    $('#decline-btn').prop('disabled', true);
    activeCall.accept();
}

function decline() {
    $('#accept-btn').prop('disabled', true);
    $('#decline-btn').prop('disabled', true);
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
    $('#call-phone-number-btn').prop('disabled', false);
    $('#call-share-screen-btn').prop('disabled', true);
    removeMediaStream();
}

function getDestination() {
    return $('#destination').val();
}
