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

function getDateString(message) {
    return message?.date?.toISOString().substring(11, 19);
}

const MESSAGE_TYPE = {
    SENT_MESSAGE: 'sent_message',
    RECEIVED_MESSAGE: 'received_message',
    RECEIVED_BROADCAST: 'received_broadcast'
}

let infobipRTC;
let activeRoomCall;

$(window).on("beforeunload", function () {
    if (infobipRTC) {
        infobipRTC.disconnect();
    }
});

$(window).ready(function(){
    $.get('pages/chatroom.html', function (pageContent) {
        $(".page-container").html(pageContent);
    });
});
