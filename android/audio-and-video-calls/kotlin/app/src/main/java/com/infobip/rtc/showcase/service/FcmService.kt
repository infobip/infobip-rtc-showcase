package com.infobip.rtc.showcase.service

import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.infobip.rtc.showcase.MainActivity
import com.infobip.rtc.showcase.MainActivity.Companion.CALL_FINISHED
import com.infobip.rtc.showcase.MainActivity.Companion.INCOMING_CALL_START
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.event.call.CallHangupEvent
import com.infobip.webrtc.sdk.api.event.listener.IncomingCallEventListener
import com.infobip.webrtc.sdk.api.event.rtc.IncomingWebrtcCallEvent
import com.infobip.webrtc.sdk.api.model.CallStatus
import com.infobip.webrtc.sdk.impl.event.listener.DefaultWebrtcCallEventListener

class FcmService : FirebaseMessagingService() {
    companion object {
        const val TAG = "INFOBIP_RTC"
        private val infobipRTC: InfobipRTC = InfobipRTC.getInstance()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "Received push: $remoteMessage")
        if (infobipRTC.isIncomingCall(remoteMessage.data)) {
            infobipRTC.handleIncomingCall(
                remoteMessage.data,
                applicationContext,
                incomingCallEventListener()
            )
        }
    }

    private fun incomingCallEventListener(): IncomingCallEventListener {
        return IncomingCallEventListener { incomingWebrtcCallEvent: IncomingWebrtcCallEvent? ->
            val incomingCall = incomingWebrtcCallEvent?.incomingWebrtcCall

            incomingCall?.eventListener = object : DefaultWebrtcCallEventListener() {
                override fun onHangup(callHangupEvent: CallHangupEvent) {
                    ServiceHelper.startService(applicationContext, CALL_FINISHED)
                }
            }

            val activeCall = infobipRTC.activeCall
            if (activeCall != null && activeCall.status() != CallStatus.FINISHED) {
                ServiceHelper.startService(applicationContext, INCOMING_CALL_START)
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