package com.forgelink

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.concurrent.ConcurrentHashMap

class TerminalService : Service() {
    companion object {
        const val ACTION_START = "com.forgelink.START"
        const val ACTION_STOP = "com.forgelink.STOP"
        const val EXTRA_COMMAND = "com.forgelink.EXTRA_COMMAND"
        const val EXTRA_PROCESS_ID = "com.forgelink.EXTRA_PROCESS_ID"
        private const val CHANNEL_ID = "forgelink_terminal"
        private const val NOTIFICATION_ID = 1001
        private val TAG = "ForgeLink"
    }

    private val processes = ConcurrentHashMap<String, ProcessHandle>()
    private var notificationManager: NotificationManager? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        notificationManager = getSystemService(NotificationManager::class.java)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val command = intent?.getStringExtra(EXTRA_COMMAND) ?: return START_STICKY
        val processId = intent.getStringExtra(EXTRA_PROCESS_ID) ?: System.currentTimeMillis().toString()

        if (command.isNotBlank()) {
            startForeground(NOTIFICATION_ID, buildNotification(command, processId))
            CoroutineScope(Dispatchers.IO).launch {
                executeCommand(processId, command)
            }
        }
        return START_STICKY
    }

    private fun executeCommand(processId: String, command: String) {
        val process = ProcessHandle(processId, command)
        processes[processId] = process
        
        try {
            val proc = Runtime.getRuntime().exec(arrayOf("/bin/bash", "-c", command), null, filesDir)
            process.process = proc
            
            // Capture stdout
            CoroutineScope(Dispatchers.IO).launch {
                readStream(proc.inputStream, processId, "stdout")
            }
            
            // Capture stderr
            CoroutineScope(Dispatchers.IO).launch {
                readStream(proc.errorStream, processId, "stderr")
            }
            
            // Wait for process completion
            val exitCode = proc.waitFor()
            process.exitCode = exitCode
            Log.d(TAG, "Process $processId completed with exit code: $exitCode")
            
        } catch (error: Exception) {
            Log.e(TAG, "Failed to execute command: $command", error)
            process.error = error.message ?: "Unknown error"
        } finally {
            processes.remove(processId)
        }
    }

    private fun readStream(stream: java.io.InputStream, processId: String, streamType: String) {
        try {
            BufferedReader(InputStreamReader(stream)).use { reader ->
                var line: String? = null
                while (reader.readLine().also { line = it } != null) {
                    Log.d(TAG, "[$processId:$streamType] $line")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error reading stream $streamType for process $processId", e)
        }
    }

    private fun buildNotification(command: String, processId: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ForgeLink: Running")
            .setContentText(command.take(50) + if (command.length > 50) "..." else "")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setOngoing(true)
            .setProgress(0, 0, true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ForgeLink Terminal",
                NotificationManager.IMPORTANCE_LOW
            )
            channel.description = "ForgeLink background process execution"
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private data class ProcessHandle(
        val id: String,
        val command: String,
        var process: Process? = null,
        var exitCode: Int? = null,
        var error: String? = null
    )
}
