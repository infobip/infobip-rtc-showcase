$(document).ready(function() {
    setOnClickEventListeners();
    connectInfobipRTC('callTest');
});

function setOnClickEventListeners() {
    $('#call-btn').click(call);
    $('#call-phone-number-btn').click(callPhoneNumber);
    $('#hangup-btn').click(hangup);
}

let infobipRTC;
let activeCall;

function call() {
    activeCall = infobipRTC.call(getDestination(), {});
    listenForCallEvents();
}

function callPhoneNumber() {
    activeCall = infobipRTC.callPhoneNumber(getDestination(), { from: '38761225883'});
    listenForCallEvents();
}

function listenForCallEvents() {
    activeCall.on('established', function (event) {
        console.log('Call established with ' + getDestination());
        $('#hangup-btn').prop('disabled', false);
        $('#remoteAudio')[0].srcObject = event.remoteStream;
    });
    activeCall.on('hangup', function (event) {
        activeCall = undefined;
        $('#hangup-btn').prop('disabled', true);
    });
    activeCall.on('ringing', function (event) {
        console.log('Call is ringing...');
    });
    activeCall.on('error', function (event) {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });
}

function hangup() {
    if (activeCall) {
        activeCall.hangup();
        activeCall = undefined;
        $('#hangup-btn').prop('disabled', true);
    }
}

function getDestination() {
    return $('#destination').val();
}
