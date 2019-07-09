package com.infobip.rtc.showcase.service

import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.infobip.rtc.showcase.MainActivity
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.event.IncomingCallEventListener

class FcmService : FirebaseMessagingService() {

    companion object {
        const val TAG = "INFOBIP_RTC"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "Received push: $remoteMessage")
        InfobipRTC.handleIncomingCall(remoteMessage.data, applicationContext, incomingCallEventListener())
    }

    private fun incomingCallEventListener(): IncomingCallEventListener {
        return IncomingCallEventListener {
            val mainActivityIntent = Intent(applicationContext, MainActivity::class.java)
            mainActivityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            mainActivityIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK)
            mainActivityIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            mainActivityIntent.action = MainActivity.INCOMING_CALL
            startActivity(mainActivityIntent)
        }
    }
}
