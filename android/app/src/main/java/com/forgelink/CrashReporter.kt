package com.forgelink

/**
 * CrashReporter — in-process crash capture for ForgeLink
 * ========================================================
 *
 * WHY THIS EXISTS
 * ---------------
 * ForgeLink is built with a non-standard Gradle configuration: the
 * `com.facebook.react` Gradle plugin is NOT used (no `apply plugin:
 * "com.facebook.react"` in app/build.gradle) because the plugin ships only
 * as Kotlin source inside the npm package and cannot be compiled in CI without
 * a full Kotlin toolchain available to the `includeBuild` composite. As a
 * result, autolinking, ReactPlugin hooks, and the generated PackageList are
 * all replaced by hand-written equivalents.
 *
 * This non-standard setup introduced a runtime crash that occurs a few
 * milliseconds after launch. The crash origin could not be identified via
 * `adb logcat` because the developer works exclusively from Termux on-device
 * (adb loopback does not work the same way as a desktop ADB connection).
 * CrashReporter is therefore the *only* available mechanism to read native JVM
 * stack traces from the device.
 *
 * DO NOT REMOVE THIS CLASS — or any of its call-sites — until the root-cause
 * crash has been identified and fixed, and a replacement diagnostics path is
 * in place.
 *
 * HOW IT WORKS
 * ------------
 * `install()` replaces the JVM's default uncaught-exception handler with one
 * that:
 *   1. Serialises the full stack trace + device metadata to a plain-text file
 *      on the device's external files directory (readable by any file manager,
 *      no root required):
 *          /sdcard/Android/data/com.forgelink/files/crash_report.txt
 *   2. Delegates to the previously registered handler (Android's own crash
 *      dialog / process termination) so normal OS behaviour is preserved.
 *
 * The JS side (`index.js`) additionally installs an `ErrorUtils` global handler
 * that calls `ForgeLinkNative.appendCrashLog()` → `CrashReporter.append()` to
 * append JS-layer errors to the same file.
 *
 * On the next launch, `src/index.tsx` calls `ForgeLinkNative.readCrashReport()`
 * during the very first `useEffect`, and if a report exists it renders a
 * full-screen `CrashReportScreen` in place of the normal app so the developer
 * can read the stack trace directly on the device screen.
 *
 * CALL-SITES (do not remove without updating all of these)
 * ---------------------------------------------------------
 *   • MainApplication.onCreate()          — installs the JVM exception handler
 *   • ForgeLinkNativeModule.appendCrashLog()  — JS → native append bridge
 *   • ForgeLinkNativeModule.readCrashReport() — read report on next launch
 *   • ForgeLinkNativeModule.clearCrashReport()— dismiss after user has read it
 *   • index.js  (ErrorUtils global handler)   — JS-side capture
 *   • src/index.tsx (CrashReportScreen)       — on-screen display
 *
 * FILE LOCATION
 * -------------
 * Writes to `Context.getExternalFilesDir(null)` (falls back to
 * `Context.filesDir` if external storage is unavailable). On Android 10+
 * (API 29+) the app can write to its own external files dir without any
 * WRITE_EXTERNAL_STORAGE permission. The file survives across app restarts
 * until explicitly deleted via `clear()`.
 */

import android.content.Context
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object CrashReporter {

    const val CRASH_FILE = "crash_report.txt"

    /**
     * Install the JVM uncaught-exception handler.
     *
     * Must be called in [MainApplication.onCreate] **before** `SoLoader.init()`
     * so that any exception thrown during native library loading (e.g.
     * UnsatisfiedLinkError from libreanimated.so) is captured.
     *
     * Safe to call multiple times; each call chains onto the previous handler.
     */
    fun install(context: Context) {
        val appContext = context.applicationContext
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()

        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            try {
                write(appContext, buildReport(thread, throwable))
            } catch (_: Throwable) {
                // Never let the reporter itself prevent the original handler
                // from running — that could swallow the crash silently.
            }
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }

    private fun buildReport(thread: Thread, throwable: Throwable): String {
        val sw = StringWriter()
        throwable.printStackTrace(PrintWriter(sw))
        val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US).format(Date())
        return buildString {
            appendLine("=== ForgeLink Crash Report ===")
            appendLine("Time   : $timestamp")
            appendLine("Thread : ${thread.name} (id=${thread.id}, group=${thread.threadGroup?.name})")
            appendLine()
            appendLine("--- Exception ---")
            appendLine(sw.toString())
            appendLine()
            appendLine("--- Device ---")
            appendLine("Android : ${android.os.Build.VERSION.RELEASE} (API ${android.os.Build.VERSION.SDK_INT})")
            appendLine("Device  : ${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
            appendLine("ABI     : ${android.os.Build.SUPPORTED_ABIS.joinToString(", ")}")
            appendLine("RAM     : ${Runtime.getRuntime().let {
                "${it.totalMemory() / 1024 / 1024}MB total / ${it.freeMemory() / 1024 / 1024}MB free"
            }}")
        }
    }

    /** Overwrite the crash file with [content]. Used by the JVM handler. */
    fun write(context: Context, content: String) {
        crashFile(context).writeText(content)
    }

    /**
     * Append [content] to the crash file (creates it if absent).
     * Called from [ForgeLinkNativeModule.appendCrashLog] which is invoked by
     * the JS `ErrorUtils` global handler in `index.js`.
     */
    fun append(context: Context, content: String) {
        val file = crashFile(context)
        if (file.exists()) file.appendText("\n$content") else file.writeText(content)
    }

    /**
     * Return the crash report text, or null if no report exists.
     * Called by [ForgeLinkNativeModule.readCrashReport] which is invoked from
     * the React `useEffect` in `src/index.tsx` on every cold launch.
     */
    fun read(context: Context): String? {
        val file = crashFile(context)
        return if (file.exists()) file.readText() else null
    }

    /**
     * Delete the crash report file.
     * Called by [ForgeLinkNativeModule.clearCrashReport] after the user taps
     * "Dismiss & continue" on the CrashReportScreen.
     */
    fun clear(context: Context) {
        crashFile(context).delete()
    }

    private fun crashFile(context: Context): File {
        // getExternalFilesDir is accessible from any file manager app without root.
        // filesDir is the fallback for devices where external storage is unavailable.
        val dir = context.getExternalFilesDir(null) ?: context.filesDir
        return File(dir, CRASH_FILE)
    }
}
