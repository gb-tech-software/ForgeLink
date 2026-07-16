# ForgeLink

A mobile IDE for Android that lets you build, test, and deploy projects directly from your phone. Write code, run servers, and preview live updates—all on a single device.

## 🎯 What is ForgeLink?

ForgeLink is a standalone Android app that turns your phone into a development workstation. Whether you're on a trip, at a coffee shop, or away from your laptop, you can:

- **Edit Code**: Real-time file editing with workspace persistence
- **Run Projects**: Execute npm, python, and other build commands
- **Live Preview**: See your changes instantly in a WebView
- **Multi-Project**: Manage multiple projects on your device
- **Auto-Detection**: Recognizes Next.js, Vite, React, Python, and more

## ⚡ Quick Start

### Installation

1. **Download APK**
   - Get from [GitHub Releases](https://github.com/gb-tech-software/ForgeLink/releases)
   - Or build from source (see SETUP.md)

2. **Install**
   - Tap APK to install
   - Or use: `adb install app-debug.apk`

3. **Grant Permissions**
   - Storage access to your project folder
   - Notification permission for background tasks

4. **Open Project**
   - Grant access to `/storage/shared/Projects` or your projects folder
   - Select a project
   - Start developing!

## 📱 Supported Project Types

| Type | Detection | Build Commands |
|------|-----------|---|
| **Next.js** | `next.config.js` | dev, build, test |
| **Vite** | `vite.config.js` | dev, build, preview |
| **React** | `package.json` + React | start, build, test |
| **Vue** | `nuxt.config.js` | dev, build, serve |
| **Svelte** | `svelte.config.js` | dev, build, preview |
| **Node.js** | `package.json` | install, start, test |
| **Python** | `requirements.txt` | install, serve, run |
| **HTML** | `index.html` | serve via HTTP |

## 🏗️ Architecture

ForgeLink is built with:

- **React Native** (TypeScript) for the UI
- **Kotlin** for Android native features
- **Storage Access Framework** (SAF) for file access
- **Foreground Service** for background process execution
- **WebView** for live preview

### Directory Structure
```
ForgeLink/
├── src/                    # React Native UI & logic
│   ├── index.tsx          # Main app component + CrashReportScreen
│   ├── commands.ts        # Command presets
│   ├── workspace.js       # Workspace state helpers
│   ├── projectDetection.js # Project type detection
│   ├── ErrorHandler.js    # Error handling utilities
│   └── Logger.js          # Logging utilities
├── android/               # Android native code
│   └── app/src/main/java/com/forgelink/
│       ├── MainActivity.kt
│       ├── MainApplication.kt
│       ├── CrashReporter.kt         # ⚠️  In-process crash capture — see docs/crash-reporter.md
│       ├── TerminalService.kt       # Process execution
│       ├── ForgeLinkNativeModule.kt # React bridge (includes crash reporter methods)
│       ├── StorageAccessBridge.kt   # File system access
│       └── ...
├── docs/
│   └── crash-reporter.md  # ⚠️  Read before touching crash reporter code
├── .github/workflows/     # GitHub Actions CI/CD
└── SETUP.md              # Detailed setup guide
```

### ⚠️ Non-standard Gradle configuration

ForgeLink does **not** use the `com.facebook.react` Gradle plugin. The plugin
ships as Kotlin source inside `@react-native/gradle-plugin` and requires
`includeBuild` compilation — which fails in CI. Its behaviours are inlined:

- Native packages are added as Gradle subprojects in `settings.gradle`
- `PackageList.kt` is hand-written (registers Reanimated, Gesture Handler, WebView)
- `app/build.gradle` does **not** have `apply plugin: "com.facebook.react"`

This introduced a runtime launch crash currently under investigation. See
`docs/crash-reporter.md` for the full diagnostic setup.

### ⚠️ In-app crash reporter

Because the developer works from **Termux on-device** (where `adb logcat` behaves
differently from a desktop ADB connection), an in-process crash reporter is the
only way to read native JVM stack traces:

| Layer | File | What it catches |
|---|---|---|
| JVM exception handler | `CrashReporter.kt` | Any Java/Kotlin throw on any thread |
| JS global handler | `index.js` (`ErrorUtils`) | Unhandled JS errors & fatal Promise rejections |
| On-screen display | `src/index.tsx` (`CrashReportScreen`) | Shows report on next launch |

Report file: `/sdcard/Android/data/com.forgelink/files/crash_report.txt`  
(readable in any file manager, no root required on Android 10+)

**Do not remove** the crash reporter until the root-cause crash is fixed and an
alternative diagnostics path is in place. See `docs/crash-reporter.md`.

## 🚀 Features

### Core
- ✅ File editing with persistence
- ✅ Multiple file tabs
- ✅ Project type auto-detection
- ✅ Preset build commands
- ✅ Custom command input
- ✅ WebView live preview
- ✅ Terminal output viewing
- ✅ Recent command history

### Advanced
- ✅ Storage Access Framework (SAF) integration
- ✅ Persistent workspace state
- ✅ Multi-project support
- ✅ Responsive UI with gestures
- ✅ Background service execution
- ✅ Full permission handling

### Coming Soon
- 🔄 Git integration
- 🔄 Real PTY terminal (Termux)
- 🔄 Project templates/scaffolding
- 🔄 npm/pip UI package manager
- 🔄 Chrome DevTools debugging
- 🔄 Cloud sync across devices

## 📖 Development Guide

### Prerequisites
- Node.js 18+
- Java 17+
- Android SDK 34
- Gradle 8.10+

### Setup
```bash
git clone https://github.com/gb-tech-software/ForgeLink.git
cd ForgeLink

# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck
```

### Building
```bash
# Debug APK
npm run android:build

# Release APK
npm run android:release

# Install to device
npm run android:install
```

### Build from GitHub (phone-only workflow)
You do not need a powerful local setup to produce an APK. Push your changes to GitHub and let the workflow handle the build:

1. Push to the `main` or `develop` branch, or run the workflow manually from the Actions tab.
2. Open the completed `Android Build & Test` run in GitHub Actions.
3. Download the `forgelink-debug-apk` artifact from the run summary.
4. Transfer the APK to your phone and install it.

This uses GitHub-hosted runners for the heavy Android build work, so your phone only needs to receive the finished APK.

### Running Tests
```bash
npm test              # Run all tests
npm run typecheck     # TypeScript validation
```

## 🛠️ Configuration

### Local Development
```bash
# Copy template
cp android/local.properties.example android/local.properties

# Edit with your SDK path
# sdk.dir=/path/to/android-sdk
```

### Environment Variables
```bash
ANDROID_HOME=/path/to/sdk
JAVA_HOME=/path/to/java17
```

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup & deployment guide
- **[Android Build](android/)** - Native Android code & configuration
- **[Source Code](src/)** - React Native TypeScript source

## ❓ Troubleshooting

### "Storage access denied"
- Grant permissions in Settings > Apps > ForgeLink
- Or reinstall and grant during first run

### "Command not found"
- Ensure package is installed: `npm install` or `pip install -r requirements.txt`
- Check if command is available in PATH

### "Dev server not running"
- Run the start/dev command first
- Check terminal output for errors
- Ensure port 3000 or 8000 is available

### Build fails
- Clean: `cd android && ./gradlew clean`
- Check SDK path in `local.properties`
- Ensure Java 17 is installed

## 🤝 Contributing

ForgeLink is open source! Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🎓 Learn More

- [React Native Documentation](https://reactnative.dev)
- [Kotlin for Android](https://developer.android.com/kotlin)
- [Android Developer Guide](https://developer.android.com/guide)

## 📞 Support

- Open an issue on [GitHub](https://github.com/gb-tech-software/ForgeLink/issues)
- Check existing issues for solutions
- Include device info & build version in bug reports

---

**Made with ❤️ by gb-tech-software**

Start developing anywhere. ForgeLink makes it possible.
