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
    activeCall = infobipRTC.callPhoneNumber(getDestination(), { from: '33755531044'});
    listenForCallEvents();
}

function listenForCallEvents() {
    $('#call-btn').prop('disabled', true);
    $('#call-phone-number-btn').prop('disabled', true);
    $('#hangup-btn').prop('disabled', false);

    activeCall.on('established', function (event) {
        console.log('Call established with ' + getDestination());
        $('#remoteAudio')[0].srcObject = event.remoteStream;
    });
    activeCall.on('hangup', function (event) {
        hangup();
    });
    activeCall.on('ringing', function (event) {
        console.log('Call is ringing...');
    });
    activeCall.on('error', function (event) {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
        hangup();
    });
}

function hangup() {
    if (activeCall) {
        activeCall.hangup();
    }
    activeCall = undefined;
    $('#hangup-btn').prop('disabled', true);
    $('#call-btn').prop('disabled', false);
    $('#call-phone-number-btn').prop('disabled', false);
}

function getDestination() {
    return $('#destination').val();
}
