package com.facebook.react

/**
 * Static replacement for the class that ReactPlugin would normally auto-generate.
 *
 * Packages listed here are the npm dependencies with Android native modules that
 * require explicit registration via the bridge (old-arch / Paper renderer).
 *
 *   - react-native-gesture-handler  → RNGestureHandlerPackage
 *   - react-native-reanimated        → ReanimatedPackage
 *   - react-native-webview           → RNCWebViewPackage
 *
 * @react-native-async-storage/async-storage v2.x is a pure TurboModule
 * (NativeAsyncStorageModuleSpec) with no ReactPackage class; it registers
 * itself automatically through RN 0.76's TurboModule interop layer and must
 * NOT be listed here.
 *
 * ForgeLinkPackage is added manually in MainApplication.kt after this list.
 */
class PackageList(private val reactNativeHost: ReactNativeHost?) {
    val packages: ArrayList<ReactPackage>
        get() = arrayListOf(
            com.swmansion.gesturehandler.RNGestureHandlerPackage(),
            com.swmansion.reanimated.ReanimatedPackage(),
            com.reactnativecommunity.webview.RNCWebViewPackage(),
        )
}
