async function connectInfobipRTC() {
    return new Promise(resolve => {
        $.post({
            url: "http://localhost:8080/token",
            type: 'POST',
            contentType: 'application/json',
            success: function (data) {
                infobipRTC = createInfobipRtc(data.token, { debug: true });
                infobipRTC.on(InfobipRTCEvent.CONNECTED, function (event) {
                    console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    resolve(event.identity);
                });
                infobipRTC.on(InfobipRTCEvent.DISCONNECTED, function (event) {
                    console.warn('Disconnected from Infobip RTC Cloud.');
                });
                infobipRTC.connect();
            }
        });
    });
}

let infobipRTC;
let activeCall;
let activeRoomCall;

let audioQualityModes = {
    "Low": AudioQualityMode.LOW_DATA,
    "Auto": AudioQualityMode.AUTO,
    "High": AudioQualityMode.HIGH_QUALITY
}

$(window).on("beforeunload", function () {
    if (infobipRTC) {
        infobipRTC.disconnect();
    }
});

$(window).ready(function(){
    const page = window.location.hash === '' ? 'webrtc-call' : window.location.hash.substring(1);
    $.get('pages/' + page + '.html', function (pageContent) {
        $(".page-container").html(pageContent);
    });
});

$(window).on("hashchange", function () {
    const page = window.location.hash.substring(1);
    $.get('pages/' + page + '.html', function (pageContent) {
        $(".page-container").html(pageContent);
    });
});

function onAudioInputDeviceChanged(event) {
    if (activeCall) {
        activeCall.setAudioInputDevice(event.value);
    } else if (activeRoomCall) {
        activeRoomCall.setAudioInputDevice(event.value);
    }
}

function onAudioQualityChange(event) {
    if (activeCall) {
        activeCall.audioQualityMode(audioQualityModes[event.value]);
    } else if (activeRoomCall) {
        activeRoomCall.audioQualityMode(audioQualityModes[event.value])
    }
}

function appendAudioInputDeviceOptions() {
    infobipRTC.getAudioInputDevices().then(inputDevices => {
        const audioInputDeviceSelect = $('#audio-input-device-select');
        inputDevices.forEach(device => {
            const option = document.createElement('option');
            option.setAttribute('value', device.deviceId);
            option.innerText = device.label || device.deviceId
            audioInputDeviceSelect.append(option);
        });
    });
}

function appendAudioQualityModeOptions() {
    const audioQualityModeSelect = $('#audio-quality-mode-select');
    Object.keys(audioQualityModes).forEach(mode => {
        const option = document.createElement('option');
        option.setAttribute('value', mode);
        option.innerText = mode;
        audioQualityModeSelect.append(option);
    });

    audioQualityModeSelect.val("Auto");
}
