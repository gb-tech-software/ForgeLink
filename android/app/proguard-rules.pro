# This is a configuration file for ProGuard.
# http://proguard.sourceforge.net/index.html#manual/usage.html

-dontobfuscate

# React Native
-keep public class com.facebook.react.** { *; }
-keep public class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.shell.** { *; }
-keep class com.facebook.react.common.** { *; }
-keep class com.facebook.react.cxxbridge.** { *; }

# ForgeLink
-keep public class com.forgelink.** { *; }
-keep class com.forgelink.** { *; }

# AndroidX
-keep public class androidx.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-keep interface kotlin.** { *; }
