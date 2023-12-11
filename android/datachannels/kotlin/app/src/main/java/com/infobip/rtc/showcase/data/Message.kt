package com.infobip.rtc.showcase.data

import java.util.Date

data class Message(
    var type: MessageType,
    var date: Date,
    var text: String,
    var status: MessageStatus,
    var messageId: String?,
    var to: String?,
    var from: String?,
    var isDirect: Boolean?
)

enum class MessageType {
    SENT, RECEIVED, BROADCAST
}

enum class MessageStatus(val value: String) {
    SENT("Sent"), DELIVERED("Delivered")
}