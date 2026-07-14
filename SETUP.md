# ForgeLink Deployment & Setup Guide

## Prerequisites

### System Requirements
- **Android Device**: Android 7.0+ (API 24+)
- **Development Machine**: Linux, macOS, or Windows
- **Java**: OpenJDK 17+
- **Node.js**: v18+
- **Android SDK**: API 34, Build Tools 34.x

### Optional but Recommended
- Android Studio (for emulator & debugging)
- Gradle 8.10+

## Local Setup

### 1. Install Android SDK

#### Linux
```bash
# Install Java 17
sudo apt-get update
sudo apt-get install openjdk-17-jdk

# Download Android SDK
mkdir -p ~/Android/Sdk
cd ~/Android/Sdk

# Download command line tools
wget https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip
unzip commandlinetools-linux-*.zip

# Setup environment
export ANDROID_HOME=~/Android/Sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

# Install components
sdkmanager --sdk_root=$ANDROID_HOME "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

#### macOS
```bash
# Install via Homebrew
brew install java openjdk@17

# Download Android SDK (or use Android Studio)
mkdir -p ~/Library/Android/sdk

# Set environment
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
```

#### Windows
1. Download OpenJDK 17 from [adoptium.net](https://adoptium.net)
2. Download Android SDK from [developer.android.com](https://developer.android.com/studio/command-line)
3. Extract and set `ANDROID_HOME` environment variable
4. Run `sdkmanager` from command line

### 2. Configure ForgeLink

```bash
# Clone repository
git clone https://github.com/gb-tech-software/ForgeLink.git
cd ForgeLink

# Create Android SDK configuration
cp android/local.properties.example android/local.properties
# Edit android/local.properties and set your SDK path

# Install Node dependencies
npm install

# Run tests
npm test
```

## Building for Android

### Debug Build (Development)
```bash
cd android
./gradlew assembleDebug
```

APK will be at: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build (Production)
```bash
cd android
./gradlew assembleRelease
```

APK will be at: `app/build/outputs/apk/release/app-release.apk`

## Installing on Device

### Via Android Studio
1. Open Android Studio
2. File → Open → Select ForgeLink android folder
3. Connect device or start emulator
4. Click "Run" button

### Via Command Line
```bash
# Install debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Install release APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via Gradle
```bash
cd android
./gradlew installDebug    # or installRelease
```

## Project Types Supported

ForgeLink can smoothly handle:

| Project Type | Commands | Auto-Detected By |
|---|---|---|
| Next.js | dev, build, test | `next.config.js` |
| Vite | dev, build, preview | `vite.config.js` |
| React | start, build, test | `package.json` + React deps |
| Vue | dev, build, serve | `nuxt.config.js` or Vue setup |
| Svelte | dev, build, preview | `svelte.config.js` |
| Node.js | install, start, test | `package.json` |
| Python | install, serve, run | `requirements.txt`, `.py` files |
| Static HTML | serve via http-server | `index.html` |

## Using ForgeLink

### Workflow

1. **Grant Storage Access**
   - Open ForgeLink
   - Tap "Open Project Directory"
   - Select your projects folder
   - Grant persistent read/write access

2. **Select Project**
   - Browse available projects
   - Tap to open

3. **Run Commands**
   - Use preset commands (e.g., "Start Vite")
   - Or enter custom commands
   - Output streams to terminal tab

4. **Preview**
   - Switch to Preview tab
   - Auto-detects dev server or local files
   - Browse live preview

5. **Edit & Save**
   - Edit files in the canvas
   - Changes persist to storage
   - Sync with your project files

## File System Access

ForgeLink uses Android's Storage Access Framework (SAF):

- **Supported Locations**: `/storage/shared/Projects`, `/storage/emulated/0/Documents`, etc.
- **Permissions**: Persistent read/write access (no copy to sandbox)
- **Direct Editing**: Changes reflected immediately on disk
- **Project Detection**: Auto-scans for Node, Python, and web projects

## Troubleshooting

### SDK Not Found
```bash
# Create local.properties with SDK path
echo "sdk.dir=/path/to/android-sdk" > android/local.properties
```

### Build Fails
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

### App Crashes on Startup
1. Check Android version (7.0+ required)
2. Grant storage permissions in Settings
3. Check logs: `adb logcat | grep ForgeLink`

### Terminal Commands Not Running
1. Ensure shell access is available
2. Check file permissions
3. Try running commands manually in device's terminal app

## Development

### Running Tests
```bash
npm test
npm run typecheck
```

### Building for CI/CD
```bash
# CI will handle SDK setup automatically
npm run android:build
```

## Next Steps

1. **Enhanced Terminal**: Integrate real PTY (pty4j, Termux)
2. **Git Integration**: Built-in git commands
3. **Cloud Sync**: Sync projects across devices
4. **Package Manager**: Built-in npm/pip UI
5. **Debugging**: Chrome DevTools integration
