$(document).ready(function() {
    setOnClickEventListeners();
    connectInfobipRTC('receiveCallTest')
        .then(identity => {
            listenForIncomingCall();
            $('#identity').html(identity);
        });
});

let infobipRTC;
let activeCall;

function setOnClickEventListeners() {
    $('#accept-btn').click(accept);
    $('#decline-btn').click(decline);
    $('#hangup-btn').click(hangup);
}

function listenForIncomingCall() {
    infobipRTC.on('incoming-call', function(incomingCall) {
        console.log('Received incoming call from: ' + incomingCall.caller.identity);
        activeCall = incomingCall;
        incomingCall.on('established', event => {
            $('#hangup-btn').prop('disabled', false);
            $('#status').html('In a call with: ' + incomingCall.caller.identity);
            $('#remoteAudio')[0].srcObject = event.remoteStream;
        });
        incomingCall.on('hangup', () => {
            $('#hangup-btn').prop('disabled', true);
            $('#status').html('Idle');
        });

        $('#accept-btn').prop('disabled', false);
        $('#decline-btn').prop('disabled', false);
        $('#status').html('Incoming call from: ' + incomingCall.caller.identity);
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
    $('#hangup-btn').prop('disabled', true);
    if (activeCall) {
        activeCall.hangup();
    }
}
