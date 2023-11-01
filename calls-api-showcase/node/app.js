const express = require('express');
const config = require('./config.json');
const https = require('./lib/https')();
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const AUTH = 'App ' + conf('INFOBIP_API_KEY');
const ARGS = require('args-parser')(process.argv);

app.post('/event', async (req, res) => {
    console.log('Received event: %s', JSON.stringify(req.body));
    let type = req.body.type;

    if (type === 'CALL_RECEIVED') {
        console.log('New call from %s', req.body.properties.call.from);
        let callId = req.body.callId;
        try {
            console.log('Answering callId: ' + callId);
            await answer(callId);
            res.sendStatus(200)
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    } else if (type === 'CALL_ESTABLISHED' && req.body.properties.call.direction === 'INBOUND') {
        let callId = req.body.callId;
        let scenario = req.body.properties.call.customData.scenario;
        try {
            if (scenario === 'dialog') {
                const phoneNumber = ARGS['phone-number'];
                if (phoneNumber === null) {
                    console.log('Saying text, callId: ' + callId);
                    await say(callId, "Phone call service is currently unavailable!", "en");
                } else {
                    console.log('Joining dialog, callId: ' + callId);
                    await createDialog(callId, phoneNumber);
                }
            } else if (scenario === 'conference') {
                console.log('Saying text, callId: ' + callId);
                await say(callId, "Wait as we connect you to one of our agents!", "en");
            } else {
                setTimeout(() => {
                    console.log('Hanging up, callId: ' + callId);
                    hangupCall(callId);
                }, 2000);
            }
            res.sendStatus(200)
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    } else if (type === 'SAY_FINISHED') {
        let callId = req.body.callId;
        let scenario = req.body.properties.customData.scenario;

        try {
            if (scenario === 'dialog') {
                console.log('Hanging up, callId: ' + callId);
                await hangupCall(callId);
            } else if (scenario === 'conference') {
                console.log('Calling agent...');
                await connectWithNewCall(callId, 'agent')
            }
            res.sendStatus(200)
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    } else if (type === 'CALL_FINISHED') {
        console.log('Call %s finished with the following error code %s', req.body.properties.callLog.callId, req.body.properties.callLog.errorCode.name);

        const conferenceIds = req.body.properties.callLog.conferenceIds;
        if (conferenceIds && conferenceIds[0]) {
            const conferenceId = conferenceIds[0];
            console.log('Hanging up, conferenceId: ' + conferenceId);
            await hangupConference(conferenceId);
        }
        res.sendStatus(200);
    } else if (type === 'CALL_FAILED') {
        console.error('Call %s failed with the following error code %s', req.body.properties.callLog.callId, req.body.properties.callLog.errorCode.name);

        const conferenceIds = req.body.properties.callLog.conferenceIds;
        if (conferenceIds && conferenceIds[0]) {
            const conferenceId = conferenceIds[0];
            console.log('Hanging up, conferenceId: ' + conferenceId);
            await hangupConference(conferenceId);
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(200);
    }
});

const server = app.listen(conf('HTTP_PORT'), () => {
    console.log('Started Infobip Calls Showcase at http://%s:%s', 'localhost', conf('HTTP_PORT'));
});

async function answer(callId) {
    await https.post(conf('INFOBIP_API_HOST'), '/calls/1/calls/' + callId + '/answer', '{}', AUTH);
}

async function say(callId, text, language) {
    let body = JSON.stringify({
        text: text,
        language: language
    });
    await https.post(conf('INFOBIP_API_HOST'), '/calls/1/calls/' + callId + '/say', body, AUTH);
}

async function hangupCall(callId) {
    await https.post(conf('INFOBIP_API_HOST'), '/calls/1/calls/' + callId + '/hangup', '{}', AUTH)
}

async function hangupConference(conferenceId) {
    await https.post(conf('INFOBIP_API_HOST'), '/calls/1/conferences/' + conferenceId + '/hangup', '{}', AUTH)
}

async function createDialog(callId, phoneNumber) {
    let body = JSON.stringify({
        parentCallId: callId,
        childCallRequest: {
            endpoint: {
                type: 'PHONE',
                phoneNumber: phoneNumber
            },
            from: 'Customer'
        },
        propagationOptions: {
            childCallHangup: true,
            childCallRinging: true
        }
    });
    await https.post(conf('INFOBIP_API_HOST'), '/calls/1/dialogs', body, AUTH);
}

async function connectWithNewCall(callId, identity) {
    let body = JSON.stringify({
        callRequest: {
            endpoint: {
                type: 'WEBRTC',
                identity: identity
            },
            from: 'Customer'
        },
        connectOnEarlyMedia: true,
        conferenceRequest: {
            maxDuration: 600
        }
    });
    await https.post(conf('INFOBIP_API_HOST'), '/calls/1/calls/' + callId + '/connect', body, AUTH);
}

function conf(key) {
    return config[key] || process.env[key];
}