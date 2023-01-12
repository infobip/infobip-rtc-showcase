package com.infobip.rtc.showcase.service

import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.infobip.rtc.showcase.MainActivity
import com.infobip.rtc.showcase.MainActivity.Companion.CALL_FINISHED
import com.infobip.rtc.showcase.MainActivity.Companion.INCOMING_CALL_START
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.CallStatus
import com.infobip.webrtc.sdk.api.event.IncomingCallEventListener
import com.infobip.webrtc.sdk.api.event.call.CallErrorEvent
import com.infobip.webrtc.sdk.api.event.call.CallHangupEvent
import com.infobip.webrtc.sdk.api.event.rtc.IncomingCallEvent
import com.infobip.webrtc.sdk.impl.event.DefaultCallEventListener

class FcmService : FirebaseMessagingService() {
    companion object {
        const val TAG = "INFOBIP_RTC"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "Received push: $remoteMessage")
        InfobipRTC.handleIncomingCall(remoteMessage.data, applicationContext, incomingCallEventListener())
    }

    private fun incomingCallEventListener(): IncomingCallEventListener? {
        return IncomingCallEventListener { incomingCallEvent: IncomingCallEvent ->
            val incomingCall = incomingCallEvent.incomingCall

            incomingCall.setEventListener(object : DefaultCallEventListener() {
                override fun onHangup(callHangupEvent: CallHangupEvent) {
                    ServiceHelper.startService(applicationContext, CALL_FINISHED)
                }

                override fun onError(callErrorEvent: CallErrorEvent) {
                    ServiceHelper.startService(applicationContext, CALL_FINISHED)
                }
            })

            val activeCall = InfobipRTC.getActiveCall()
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
