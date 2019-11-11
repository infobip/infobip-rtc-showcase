$(document).ready(function() {
    setOnClickEventListeners();
    connectInfobipRTC()
        .then(identity => {
            listenForIncomingCall();
            $('#identity').html(identity);
        });
});

function setOnClickEventListeners() {
    $('#call-btn').click(call);
    $('#call-phone-number-btn').click(callPhoneNumber);
    $('#accept-btn').click(accept);
    $('#decline-btn').click(decline);
    $('#hangup-btn').click(hangup);
}

let infobipRTC;
let activeCall;

function call() {
    activeCall = infobipRTC.call(getDestination(), {});
    listenForCallEvents();
}

function callPhoneNumber() {
    activeCall = infobipRTC.callPhoneNumber(getDestination(), { from: '33755531044'});
    listenForCallEvents();
}

function listenForIncomingCall() {
    infobipRTC.on('incoming-call', function(incomingCall) {
        console.log('Received incoming call from: ' + incomingCall.source().identity);
        activeCall = incomingCall;
        incomingCall.on('established', event => {
            $('#hangup-btn').prop('disabled', false);
            $('#status').html('In a call with: ' + incomingCall.source().identity);
            $('#remoteAudio')[0].srcObject = event.remoteStream;
        });
        incomingCall.on('hangup', () => {
            $('#hangup-btn').prop('disabled', true);
            $('#status').html('');
        });

        $('#accept-btn').prop('disabled', false);
        $('#decline-btn').prop('disabled', false);
        $('#status').html('Incoming call from: ' + incomingCall.source().identity);
    });
}

function listenForCallEvents() {
    $('#call-btn').prop('disabled', true);
    $('#call-phone-number-btn').prop('disabled', true);
    $('#hangup-btn').prop('disabled', false);

    activeCall.on('established', function (event) {
        $('#status').html('Call established with: ' + getDestination());
        console.log('Call established with ' + getDestination());
        $('#remoteAudio')[0].srcObject = event.remoteStream;
    });
    activeCall.on('hangup', function (event) {
        hangup();
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
    $('#call-phone-number-btn').prop('disabled', false);
}

function getDestination() {
    return $('#destination').val();
}
