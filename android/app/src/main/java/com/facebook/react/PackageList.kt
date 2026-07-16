package com.facebook.react

/**
 * Static replacement for the class that ReactPlugin would normally
 * auto-generate. This app has no npm-installed native modules, so the
 * auto-linked list is always empty. ForgeLinkPackage is added manually
 * in MainApplication.kt after this list is returned.
 */
class PackageList(private val reactNativeHost: ReactNativeHost?) {
    val packages: ArrayList<ReactPackage>
        get() = arrayListOf()
}
