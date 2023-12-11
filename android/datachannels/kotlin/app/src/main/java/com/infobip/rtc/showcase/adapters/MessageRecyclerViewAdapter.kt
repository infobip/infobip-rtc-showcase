package com.infobip.rtc.showcase.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.infobip.rtc.showcase.R
import com.infobip.rtc.showcase.data.Message
import com.infobip.rtc.showcase.data.MessageType
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MessageRecyclerViewAdapter(private val data: MutableList<Message>) :
    RecyclerView.Adapter<MessageRecyclerViewAdapter.ViewHolder>() {

    private val formatter = SimpleDateFormat("h:mm a", Locale.getDefault())

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val primaryTextView: TextView
        val secondaryTextView: TextView

        init {
            primaryTextView = view.findViewById(R.id.message_primary_text)
            secondaryTextView = view.findViewById(R.id.message_secondary_text)
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view =
            LayoutInflater.from(parent.context).inflate(R.layout.message_layout, parent, false)
        return ViewHolder(view)
    }

    override fun getItemCount(): Int {
        return data.size
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val message: Message = data[position]
        val (primaryText, secondaryText) = getTexts(message)
        holder.primaryTextView.text = primaryText
        holder.secondaryTextView.text = secondaryText
    }

    private fun formatDate(date: Date): String {
        return formatter.format(date)
    }

    private fun getTexts(message: Message): Pair<String, String> {
        return when (message.type) {
            MessageType.SENT -> {
                val primaryText = "${message.text} (${message.status.value})"
                val secondaryText =
                    "(You) at ${formatDate(message.date) + if (message.to != null) " (Direct to ${message.to})" else ""}"
                primaryText to secondaryText
            }

            MessageType.RECEIVED -> {
                val primaryText = message.text
                val secondaryText =
                    "From ${message.from} at ${formatDate(message.date) + if (message.isDirect!!) " (Direct)" else ""}"
                primaryText to secondaryText
            }

            MessageType.BROADCAST -> {
                val primaryText = message.text
                val secondaryText = "(Broadcast) at ${formatDate(message.date)}"
                primaryText to secondaryText
            }
        }
    }
}