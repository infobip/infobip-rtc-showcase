package com.infobip.rtc.showcase.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.infobip.rtc.showcase.MainActivity
import com.infobip.rtc.showcase.R
import com.infobip.webrtc.sdk.api.InfobipRTC
import com.infobip.webrtc.sdk.api.call.ApplicationCall
import com.infobip.webrtc.sdk.api.model.CallStatus

const val NOTIFICATION_ID = 1
const val CHANNEL_ID = "Infobip RTC Showcase"
const val OUTGOING_CALL_START = "outgoing_call_start"
const val INCOMING_CALL_START = "incoming_call_start"
const val CALL_IN_PROGRESS = "call_in_progress"
const val CALL_FINISHED = "call_finished"

class ForegroundService : Service() {
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
        val applicationCall: ApplicationCall? = InfobipRTC.getInstance().activeApplicationCall

        when (action) {
            INCOMING_CALL_START -> {
                if (applicationCall != null && applicationCall.status() != CallStatus.FINISHED) {
                    startForegroundService("Incoming call")
                }
            }

            OUTGOING_CALL_START -> {
                startForegroundService("Calling...")
            }

            CALL_IN_PROGRESS -> {
                startForegroundService("In a call")
            }

            CALL_FINISHED -> {
                stopForegroundService()
            }
        }
        return START_NOT_STICKY
    }

    private fun startForegroundService(status: String) {
        val notification: Notification = createNotification(status)
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

    private fun createNotification(status: String): Notification {
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
            .setContentTitle(status)
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
