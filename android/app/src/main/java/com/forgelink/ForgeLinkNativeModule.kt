package com.forgelink

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ForgeLinkNativeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "ForgeLinkNative"

    @ReactMethod
    fun executeCommand(commandString: String, promise: Promise) {
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

    // ── Crash Reporter bridge methods ─────────────────────────────────────────
    // These three methods are the React Native bridge surface for CrashReporter.
    // They are called from index.js (appendCrashLog) and src/index.tsx
    // (readCrashReport, clearCrashReport).  DO NOT remove without reading
    // docs/crash-reporter.md — the crash reporter is the only diagnostics
    // mechanism available in the developer's Termux environment.
    // ─────────────────────────────────────────────────────────────────────────

    /** Appends a JS error block to crash_report.txt. Called by the ErrorUtils
     *  global handler in index.js on any fatal JS exception. */
    @ReactMethod
    fun appendCrashLog(content: String, promise: Promise) {
        try {
            CrashReporter.append(reactContext, content)
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("CRASH_LOG_ERROR", error)
        }
    }

    /** Returns the crash report text, or null if none exists. */
    @ReactMethod
    fun readCrashReport(promise: Promise) {
        try {
            promise.resolve(CrashReporter.read(reactContext))
        } catch (error: Throwable) {
            promise.reject("CRASH_READ_ERROR", error)
        }
    }

    /** Deletes the crash report file. */
    @ReactMethod
    fun clearCrashReport(promise: Promise) {
        try {
            CrashReporter.clear(reactContext)
            promise.resolve(true)
        } catch (error: Throwable) {
            promise.reject("CRASH_CLEAR_ERROR", error)
        }
    }
}
