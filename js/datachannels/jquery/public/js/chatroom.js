let endpoints = [];

$(document).ready(function () {
    setOnClickEventListeners();
    connectInfobipRTC()
        .then(identity => {
            $('#identity').html(identity);
            $('#join-room-actions').prop('hidden', false);
        })
});

function setOnClickEventListeners() {
    $('#join-btn').click(joinRoom);
    $('#leave-btn').click(leave);
    $('#send-btn').click(send);
}

function joinRoom() {
    let roomCallOptions = RoomCallOptions.builder()
        .setAudio(false)
        .setDataChannel(true)
        .build();

    activeRoomCall = infobipRTC.joinRoom(getRoomName(), roomCallOptions);

    listenForRoomCallEvents();
    listenForDataChannelEvents(activeRoomCall.dataChannel());
}

function leave() {
    if (activeRoomCall) {
        activeRoomCall.leave();
    }
}

async function send() {
    const currentMessage = $('#current-message').val();
    const to = $('#to').val();
    const trimmedMessage = currentMessage?.trim();
    if (trimmedMessage?.length === 0) {
        return;
    }
    const toEndpoint = getEndpointByIdentifier(to);

    const message = {
        'type': MESSAGE_TYPE.SENT_MESSAGE,
        'messageId': null,
        'date': new Date(),
        'to': toEndpoint?.identifier,
        'text': trimmedMessage,
        'status': null
    }

    try {
        const messageId = await activeRoomCall?.dataChannel()?.send(trimmedMessage, toEndpoint);
        message.messageId = messageId;
        message.status = 'Sent'
    } catch (e) {
        console.error(e);
        message.status = 'Failed'
    }

    addMessageToChatBox(message);
    $('#current-message').val('')
}

function listenForRoomCallEvents() {
    activeRoomCall.on(CallsApiEvent.ROOM_JOINED, function (event) {
        $('#status').html('Joined room, roomId: ' + event.id);
        console.log('Joined room, roomId: ' + event.id);

        showRoomId(event.id);

        event.participants.forEach(participant => addEndpoint(participant.endpoint));

        $('#leave-btn').prop('disabled', false);
        $('#join-btn').prop('disabled', true);
        $('#chat-actions').prop('hidden', false);
    });
    activeRoomCall.on(CallsApiEvent.ROOM_LEFT, function (event) {
        $('#status').html('Left room, errorCode: ' + event.errorCode.name);
        console.log('Left room, errorCode: ' + event.errorCode.name);
        setValuesAfterLeaving();
    });

    activeRoomCall.on(CallsApiEvent.PARTICIPANT_JOINING, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' is joining');
        console.log('Participant ' + event.participant.endpoint.identifier + ' is joining');
    });

    activeRoomCall.on(CallsApiEvent.PARTICIPANT_JOINED, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' joined');
        console.log('Participant ' + event.participant.endpoint.identifier + ' joined');
        addEndpoint(event.participant.endpoint)
    });

    activeRoomCall.on(CallsApiEvent.PARTICIPANT_LEFT, function (event) {
        $('#status').html('Participant ' + event.participant.endpoint.identifier + ' left');
        console.log('Participant ' + event.participant.endpoint.identifier + ' left');
        removeEndpoint(event.participant.endpoint.identifier);
    });

    activeRoomCall.on(CallsApiEvent.ERROR, function (event) {
        console.log('Oops, something went very wrong! Message: ' + JSON.stringify(event));
    });
}

function listenForDataChannelEvents(dataChannel) {
    dataChannel.on(DataChannelEvent.TEXT_RECEIVED_EVENT, event => {
        console.log(`Received ${event?.isDirect ? 'direct ' : ''}text from ${event?.from?.identifier}`)
        addMessageToChatBox({
            'type': MESSAGE_TYPE.RECEIVED_MESSAGE,
            'date': event?.date,
            'from': event?.from?.identifier,
            'isDirect': event?.isDirect,
            'text': event?.text,
        });
    });

    dataChannel.on(DataChannelEvent.TEXT_DELIVERED_EVENT, event => {
        console.log(`Text message with id: ${event.id} was ${event?.delivered ? '' : 'not '}delivered.`);
        updateSentMessageStatus(event?.id, event?.delivered ? 'Delivered' : 'Failed');
    });

    dataChannel.on(DataChannelEvent.BROADCAST_TEXT_RECEIVED_EVENT, event => {
        console.log(`Received broadcast: ${event.text}`);
        addMessageToChatBox({
            'type': MESSAGE_TYPE.RECEIVED_BROADCAST,
            'date': event?.date,
            'text': event?.text
        });
    });
}

function getRoomName() {
    return $('#room-name').val();
}

function addEndpoint(endpoint) {
    endpoints.push(endpoint);
}

function removeEndpoint(identifier) {
    endpoints = endpoints.filter(endpoint => endpoint.identifier !== identifier);
}

function getEndpointByIdentifier(identifier) {
    return endpoints.find(endpoint => endpoint.identifier === identifier);
}

function showRoomId(id) {
    $('#room-id')
        .text(`Room id: ${id}`)
        .prop('hidden', false);
}

function hideRoomId() {
    $('#room-id')
        .prop('hidden', true);
}

function setValuesAfterLeaving() {
    activeRoomCall = undefined;
    endpoints = [];
    $('#status').html('');
    $('#chat-actions').prop('hidden', true);
    $('#join-btn').prop('disabled', false);
    $('#leave-btn').prop('disabled', true);
    hideRoomId();
}

function addMessageToChatBox(message) {
    switch (message.type) {
        case MESSAGE_TYPE.SENT_MESSAGE:
            addSentMessage(message);
            break;
        case MESSAGE_TYPE.RECEIVED_MESSAGE:
            addReceivedMessage(message);
            break;
        case MESSAGE_TYPE.RECEIVED_BROADCAST:
            addReceivedBroadcast(message);
            break;
    }
}

function addReceivedMessage(message) {
    const primaryText = message?.text;
    const secondaryText = `From ${message?.from} at ${getDateString(message)} ${message?.isDirect ? '(Direct)' : ''}`

    appendMessageHTML(null, primaryText, secondaryText)
}

function addSentMessage(message) {
    const primaryText = `${message?.text} (${message?.status})`
    const secondaryText = `(You) at ${getDateString(message)} ${message?.to ? `(Direct to ${message?.to})` : ''}`
    const messageId = message?.messageId;

    appendMessageHTML(messageId, primaryText, secondaryText)
}

function addReceivedBroadcast(message) {
    const primaryText = message?.text;
    const secondaryText = `(Broadcast) at ${getDateString(message)}`

    appendMessageHTML(null, primaryText, secondaryText)
}

function appendMessageHTML(messageId, primaryText, secondaryText) {
    const messageHTML = "<div " + (messageId ? "id='" + messageId + "'" : '') + "><p class='secondary-text'>" + secondaryText + "</p><p class='primary-text'>" + primaryText + "</p></div>";

    $('#chat-box')
        .append(messageHTML)
}

function updateSentMessageStatus(messageId, status) {
    $('#' + messageId).find('.primary-text').text(function (_, current) {
        return current.replace(/\(Sent\)/g, '(' + status + ')');
    })
}
