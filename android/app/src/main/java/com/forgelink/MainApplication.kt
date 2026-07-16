package com.forgelink

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
                // ForgeLinkPackage is not an npm module, so autolinking won't find it
                add(ForgeLinkPackage())
            }

        override fun getJSMainModuleName(): String = "index"
    }

    override fun onCreate() {
        super.onCreate()

        // ── Crash Reporter ────────────────────────────────────────────────────
        // MUST be installed before SoLoader.init() so that any JVM exception
        // thrown during native library loading (e.g. UnsatisfiedLinkError from
        // libreanimated.so, which loads during bridge initialisation) is caught
        // and written to crash_report.txt before the process exits.
        //
        // This reporter exists because ForgeLink uses a non-standard Gradle
        // build (no ReactPlugin) that introduced a launch-time crash, and the
        // developer's Termux environment cannot capture `adb logcat` the way a
        // desktop ADB connection would. It is the sole diagnostics mechanism.
        //
        // See docs/crash-reporter.md and CrashReporter.kt for full details.
        // DO NOT remove or reorder this call without reading that document.
        // ─────────────────────────────────────────────────────────────────────
        CrashReporter.install(this)

        SoLoader.init(this, OpenSourceMergedSoMapping)
    }
}
