/**
 * index.js — ForgeLink app entry point
 *
 * ⚠️  CRASH REPORTER — DO NOT REMOVE THE IIFE BELOW  ⚠️
 * -------------------------------------------------------
 * ForgeLink uses a non-standard Gradle setup (no ReactPlugin, hand-written
 * PackageList) that introduced a runtime crash at launch which cannot be
 * diagnosed via `adb logcat` from Termux.  The IIFE installs a global JS
 * error handler BEFORE AppRegistry.registerComponent() so that any exception
 * thrown during component initialisation (including Reanimated's first render)
 * is captured and written to the same crash_report.txt file that the native
 * JVM handler (CrashReporter.kt) uses.
 *
 * On the next launch, src/index.tsx checks for this file via
 * ForgeLinkNative.readCrashReport() and shows a CrashReportScreen instead of
 * the normal app so the developer can read the stack trace on-device.
 *
 * See docs/crash-reporter.md for the full design rationale.
 */

import { AppRegistry, NativeModules } from 'react-native';
import App from './src/index';
import { name as appName } from './app.json';

// ---------------------------------------------------------------------------
// Global JS error handler
//
// Installed before AppRegistry so it is active before the root component tree
// is constructed. Catches:
//   - Fatal JS exceptions during first render (e.g. undefined is not a function)
//   - Unhandled Promise rejections that React Native promotes to fatal errors
//   - Any throw inside a useEffect or event handler that isn't caught locally
//
// What it does:
//   1. Formats the error + stack trace as a plain-text block
//   2. Calls ForgeLinkNative.appendCrashLog() to append it to crash_report.txt
//      (same file the native JVM handler writes — both ends of the crash are
//      visible in a single file on the next launch)
//   3. Calls the previous handler so React Native's own fatal-error behaviour
//      (dev red screen / prod process kill) still runs
//
// Why "append" and not "write":
//   The native JVM handler fires first (before the JS runtime shuts down) and
//   writes the Java-layer section. The JS handler then appends the JS-layer
//   section. Both sections can appear in the same report.
//
// Why fire-and-forget (.catch(() => {})):
//   The bridge may already be tearing down by the time a fatal error is
//   dispatched here. A rejected promise from appendCrashLog must not itself
//   become an unhandled rejection that re-enters this handler.
// ---------------------------------------------------------------------------
(function installGlobalErrorHandler() {
  const prevHandler =
    typeof ErrorUtils !== 'undefined' ? ErrorUtils.getGlobalHandler?.() : null;

  if (typeof ErrorUtils === 'undefined' || !ErrorUtils.setGlobalHandler) {
    return; // Older RN versions or test environments — skip silently
  }

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    try {
      const { ForgeLinkNative } = NativeModules;
      if (ForgeLinkNative?.appendCrashLog) {
        const report = [
          '=== JS Error ===',
          `Time  : ${new Date().toISOString()}`,
          `Fatal : ${isFatal}`,
          `Name  : ${error?.name ?? 'Error'}`,
          `Msg   : ${error?.message ?? String(error)}`,
          '',
          '--- Stack ---',
          error?.stack || String(error),
        ].join('\n');
        ForgeLinkNative.appendCrashLog(report).catch(() => {});
      }
    } catch (_) {
      // Never let the reporter block the original handler
    }
    prevHandler?.(error, isFatal);
  });
})();

AppRegistry.registerComponent(appName, () => App);
