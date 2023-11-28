package com.infobip.rtc.showcase.service

import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.infobip.rtc.showcase.MainActivity
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.event.call.CallHangupEvent
import com.infobip.webrtc.sdk.api.event.listener.IncomingApplicationCallEventListener
import com.infobip.webrtc.sdk.api.event.rtc.IncomingApplicationCallEvent
import com.infobip.webrtc.sdk.api.model.CallStatus
import com.infobip.webrtc.sdk.impl.event.listener.DefaultApplicationCallEventListener

private const val TAG = "INFOBIP_RTC"

class FcmService : FirebaseMessagingService() {
    companion object {
        private val infobipRTC: InfobipRTC = InfobipRTC.getInstance()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "Received push: $remoteMessage")
        if (infobipRTC.isIncomingApplicationCall(remoteMessage.data)) {
            infobipRTC.handleIncomingApplicationCall(
                remoteMessage.data,
                applicationContext,
                incomingApplicationCallEventListener()
            )
        }
    }

    private fun incomingApplicationCallEventListener(): IncomingApplicationCallEventListener {
        return IncomingApplicationCallEventListener { incomingApplicationCallEvent: IncomingApplicationCallEvent? ->
            val incomingCall = incomingApplicationCallEvent?.incomingApplicationCall

            incomingCall?.eventListener = object : DefaultApplicationCallEventListener() {
                override fun onHangup(callHangupEvent: CallHangupEvent) {
                    startService(applicationContext, CALL_FINISHED)
                }
            }

            val applicationCall = infobipRTC.activeApplicationCall
            if (applicationCall != null && applicationCall.status() != CallStatus.FINISHED) {
                startService(applicationContext, INCOMING_CALL_START)
                showIncomingCall()
            }
        }
    }

    private fun showIncomingCall() {
        val mainActivityIntent = Intent(applicationContext, MainActivity::class.java)
        mainActivityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        mainActivityIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK)
        mainActivityIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)

        mainActivityIntent.action = INCOMING_CALL_START

        startActivity(mainActivityIntent)
    }
}