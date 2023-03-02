async function connectInfobipRTC() {
    return new Promise(resolve => {
        $.post({
            url: "http://localhost:8080/token",
            type: 'POST',
            contentType: 'application/json',
            success: function (data) {
                infobipRTC = createInfobipRtc(data.token, { debug: true });
                infobipRTC.on('connected', function (event) {
                    console.log('Connected to Infobip RTC Cloud with: %s', event.identity);
                    resolve(event.identity);
                });
                infobipRTC.on('disconnected', function (event) {
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