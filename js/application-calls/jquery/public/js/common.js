async function connectInfobipRTC(identity) {
    let url = "http://localhost:8080/token" + (identity ? "/" + identity : "");
    return new Promise(resolve => {
        $.post({
            url: url,
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

function getApplicationId() {
    if (!applicationId) {
        $.getJSON('../config/config.json', function (data) {
            applicationId = data.INFOBIP_APP_ID;
        }).fail(function (jqxhr, textStatus, error) {
            console.log("Failed to load config.json: " + error);
        });
    }
}

let infobipRTC;
let activeCall;
let applicationId;

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
    const page = window.location.hash === '' ? 'role' : window.location.hash.substring(1);
    $.get('pages/' + page + '.html', function (pageContent) {
        $(".page-container").html(pageContent);
    });
});

$(window).on("hashchange", function () {
    const page = window.location.hash === '' ? 'role' : window.location.hash.substring(1);
    $.get('pages/' + page + '.html', function (pageContent) {
        $(".page-container").html(pageContent);
    });
});

function onAudioInputDeviceChanged(event) {
    if (activeCall) {
        activeCall.setAudioInputDevice(event.value);
    }
}

function onAudioQualityChange(event) {
    if (activeCall) {
        activeCall.audioQualityMode(audioQualityModes[event.value]);
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
