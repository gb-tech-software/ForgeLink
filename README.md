Act as an expert Android Engineer and Mobile UX System Architect. You are tasked with generating a fully complete, structurally clean, and uncoupled hybrid project framework for a high-performance local IDE application. The user interface must be written in React Native (TypeScript), and the heavy system processes, background runtime isolation, and terminal emulators must be built natively in Android Kotlin.

---

### 🧱 ARCHITECTURAL CONSTRAINTS & ISOLATION (CRITICAL)
1. NO MONOREPO COUPLING: Do not bundle this code into any workspace layout, Lerna, TurboRepo, or Replit-specific environment tools. The codebase must be a fully isolated, standalone React Native architecture configured to compile completely on a headless Linux system via GitHub Actions.
2. ABSOLUTE DIRECTORY SEPARATION:
   - All UI rendering, layout gesture wrappers, file tree state tracking, and view logic must be isolated in the root JavaScript/TypeScript structure.
   - All process management, storage permissions handling, system-level native threads, and C++ process loop bridges must be isolated inside the `android/app/src/main/` Kotlin tree.

---

### 📱 SYSTEM LOGIC REQUIREMENTS (KOTLIN BACKEND)
Generate a native Kotlin module that uses Android's NDK to interface with Termux's open-source `libtermexec.so` execution code. Implement the following:
1. Native Terminal Manager (`RTNTerminalView`):
   - Package Termux's native `TerminalView` layout template and `TerminalSession` controller into an Android native React Component View Manager.
   - It must accept direct text stream inputs via a React Native Native Module bridge method: `executeCommand(commandString: String)`.
2. Foreground Service Thread Execution:
   - Create a persistent Android Foreground Service to manage terminal server execution lifecycles (`npm run dev`, `python server.py`, etc.).
   - The execution loop MUST be handled inside this service context. If the user minimizes the UI panel or closes the screen, the service must keep the local Node/Python process running indefinitely, bypassing Android's Low Memory Killer.
   - When the user expands the terminal panel again, the UI component must instantly attach back onto the active background service stream.
3. Storage Access Framework (SAF) Bridge:
   - Configure native methods to take persistable URI permissions via Android's `Intent.ACTION_OPEN_DOCUMENT_TREE`.
   - The editor must write, update, and read files directly from the global user storage folder (e.g., `/storage/shared/Projects`) in place. Do not copy files into the app's internal sandbox.

---

### 🎨 MOBILE DEVELOPER WORKFLOW UX (REACT NATIVE UI)
Build a smooth, mobile-first interface optimized for touchscreen gestures (no heavy desktop simulations).
1. Layout Pane Layout:
   - Use `react-native-gesture-handler` and `react-native-reanimated` to construct a multi-panel workspace frame containing three responsive layers: File Tree Sidebar, Main Code Editor Canvas, and Bottom Drawer Engine.
   - The Bottom Drawer Engine must be a tabbed viewer. Tab 1 shows the native `RTNTerminalView`. Tab 2 shows an integrated layout `WebView` for previews.
   - Toggling tabs or swiping the drawer hidden must only alter view visibility flags (`display: 'none'`). It must NOT unmount the WebView or kill the background terminal stream.
2. Dual-Router Live Previews:
   - The WebView preview component must run a condition check when parsing a project workspace:
     * Mode A (Frameworks): If an active dev port is running (e.g., Vite/NextJS), point the WebView directly to `http://localhost:3000`.
     * Mode B (Vanilla Stack): If it is a vanilla project, read the path via the SAF Bridge and load it instantly using the local file schema (`file:///storage/.../index.html`) without executing terminal command tasks.

---

### 📂 STATE & PROJECT WORKSPACE PERSISTENCE
1. Create a workspace schema tracking metadata configuration profiles per unique directory URI.
2. Store the following workspace persistent data locally (using a clean local storage container like AsyncStorage):
   - Active open file tabs.
   - Horizontal/vertical split percentages.
   - Cursor positions per file.
   - Last executed terminal commands context per layout workspace.
3. When the app opens, read the previous URI pathway. Automatically re-mount the target directory, re-hydrate the file canvas tree, and cleanly attach back to the persistent Foreground Service console instance.

---

### 🤖 EXPECTED DELIVERABLES
Generate a production-ready codebase containing:
1. A fully isolated, standalone React Native package layout (`package.json`, TypeScript setups).
2. The complete native Android sub-directory (`android/app/build.gradle` containing proper NDK configurations targeting ARM64-v8a architectures).
3. The custom Kotlin bridge logic (`TerminalViewManager.kt`, `TerminalService.kt`, and the Native Module bridge registrations).
4. The React Native workspace manager UI views handling the panel gesture drawers, custom tabs, and layout WebView toggles.
5. Provide a `.github/workflows/android-build.yml` pipeline file to execute clean headless Android compilation via Gradle on a virtual Ubuntu host runner.
