package com.infobip.rtc.showcase.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.infobip.rtc.showcase.MainActivity
import com.infobip.rtc.showcase.MainActivity.Companion.CALL_FINISHED
import com.infobip.rtc.showcase.MainActivity.Companion.CALL_IN_PROGRESS
import com.infobip.rtc.showcase.MainActivity.Companion.INCOMING_CALL_START
import com.infobip.rtc.showcase.MainActivity.Companion.OUTGOING_CALL_START
import com.infobip.rtc.showcase.R
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.Call
import com.infobip.webrtc.sdk.api.call.RoomCall
import com.infobip.webrtc.sdk.api.call.WebrtcCall
import com.infobip.webrtc.sdk.api.model.CallStatus

class ForegroundService : Service() {
    companion object {
        const val NOTIFICATION_ID = 1
        const val CHANNEL_ID = "Infobip RTC Showcase"
        private val infobipRTC: InfobipRTC = InfobipRTC.getInstance()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        val notificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannel(notificationManager)
        }
    }

    override fun onStartCommand(intent: Intent, flags: Int, startId: Int): Int {
        val action = intent.action ?: return START_NOT_STICKY

        val activeCall: Call? = infobipRTC.activeCall
        val activeRoomCall: RoomCall? = infobipRTC.activeRoomCall
        val peer = if (activeCall != null) activeCall.destination().identifier()
            else activeRoomCall?.name()

        when (action) {
            INCOMING_CALL_START -> {
                if (activeCall != null && activeCall.status() != CallStatus.FINISHED && activeCall is WebrtcCall) {
                    val isVideo =
                        activeCall.hasCameraVideo() || activeCall.hasRemoteCameraVideo()
                    startForegroundService(
                        "Incoming " + (if (isVideo) "video" else "audio") + " call",
                        peer = activeCall.source().identifier()
                    )
                }
            }
            OUTGOING_CALL_START -> {
                startForegroundService(
                    "Calling...", peer
                )
            }
            CALL_IN_PROGRESS -> {
                startForegroundService(
                    "In a ${if (activeRoomCall != null) "room call" else "call"}",
                    peer
                )
            }
            CALL_FINISHED -> {
                stopForegroundService()
            }
        }
        return START_NOT_STICKY
    }

    private fun startForegroundService(status: String, peer: String?) {
        val notification: Notification = createNotification(peer, status)
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun stopForegroundService() {
        stopForeground(true)
        stopSelf()
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun createNotificationChannel(notificationManager: NotificationManager) {
        val channel =
            NotificationChannel(CHANNEL_ID, CHANNEL_ID, NotificationManager.IMPORTANCE_HIGH)
        channel.setShowBadge(false)
        channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        channel.setSound(null, null)
        notificationManager.createNotificationChannel(channel)
    }

    private fun createNotification(peer: String?, status: String): Notification {
        val contentIntent = Intent(applicationContext, MainActivity::class.java)
        contentIntent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP

        val pendingIntent = PendingIntent.getActivity(
            applicationContext,
            0,
            contentIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentTitle(peer)
            .setContentText(status)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
            builder.setFullScreenIntent(pendingIntent, true)
        } else {
            builder.setContentIntent(pendingIntent)
        }
        return builder.build()
    }
}
