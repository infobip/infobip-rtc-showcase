package com.infobip.rtc.showcase.service

import android.content.Context
import android.content.Intent

class ServiceHelper {
    companion object {
        fun startService(context: Context, action: String) {
            val intent = Intent(context, ForegroundService::class.java)
            intent.action = action
            context.startService(intent)
        }
    }
}