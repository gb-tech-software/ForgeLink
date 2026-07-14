package com.forgelink

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ForgeLinkNativeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "ForgeLinkNative"

    @ReactMethod
    fun executeCommand(commandString: String, promise: com.facebook.react.bridge.Promise) {
        try {
            val serviceIntent = Intent(reactContext, TerminalService::class.java).apply {
                action = TerminalService.ACTION_START
                putExtra(TerminalService.EXTRA_COMMAND, commandString)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent)
            } else {
                reactContext.startService(serviceIntent)
            }
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("EXECUTE_COMMAND_ERROR", error)
        }
    }
}
