export const getDateString = (message) => {
    return message?.date?.toISOString().substring(11, 19);
}

export const MESSAGE_TYPE = {
    SENT_MESSAGE: 'sent_message',
    RECEIVED_MESSAGE: 'received_message',
    RECEIVED_BROADCAST: 'received_broadcast'
}
