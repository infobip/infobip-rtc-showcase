async function connectInfobipRTC() {
    return new Promise(resolve => {
        $.post({
            url: "http://localhost:8080/token",
            type: 'POST',
            contentType: 'application/json',
            success: function (data) {
                infobipRTC = new InfobipRTC(data.token, { debug: true });
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

$(window).on("beforeunload", function () {
    if (infobipRTC) {
        infobipRTC.disconnect();
    }
});
