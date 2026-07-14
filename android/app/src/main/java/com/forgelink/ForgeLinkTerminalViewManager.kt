package com.forgelink

import android.content.Context
import android.view.View
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class ForgeLinkTerminalViewManager : SimpleViewManager<View>() {
    override fun getName(): String = "RTNTerminalView"

    override fun createViewInstance(reactContext: ThemedReactContext): View {
        return View(reactContext)
    }

    @ReactProp(name = "command")
    fun setCommand(view: View, value: String?) {
        view.setBackgroundColor(0xFF111827.toInt())
    }
}
