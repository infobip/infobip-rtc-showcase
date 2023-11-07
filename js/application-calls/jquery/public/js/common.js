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