import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { commandPresets } from './commands';
import { createWorkspaceSeed, derivePreviewUri, normalizeWorkspace } from './workspace';

const { ForgeLinkNative } = NativeModules;

// ---------------------------------------------------------------------------
// CrashReportScreen
//
// WHY THIS EXISTS — DO NOT REMOVE WITHOUT READING docs/crash-reporter.md
// -----------------------------------------------------------------------
// ForgeLink uses a non-standard Gradle build (no ReactPlugin) which introduced
// a runtime crash at launch.  The developer works from Termux on-device where
// `adb logcat` does not behave like a desktop ADB connection, so there is no
// other way to read native JVM stack traces.
//
// On every cold launch, App's first useEffect calls
// ForgeLinkNative.readCrashReport().  If the native JVM handler
// (CrashReporter.kt) or the JS ErrorUtils handler (index.js) wrote a report
// during the previous run, this component is rendered instead of the normal
// app so the developer can read the full exception on-device.
//
// The report file lives at:
//   /sdcard/Android/data/com.forgelink/files/crash_report.txt
// and is also readable in any file manager (no root needed on Android 10+).
//
// "Dismiss & continue" deletes the file via ForgeLinkNative.clearCrashReport()
// and re-renders the normal app.
//
// Related files (all must be kept in sync):
//   CrashReporter.kt            — writes / appends / reads / clears the file
//   ForgeLinkNativeModule.kt    — bridge: appendCrashLog, readCrashReport, clearCrashReport
//   MainApplication.kt          — installs the JVM handler before SoLoader.init()
//   index.js                    — installs the JS ErrorUtils handler before AppRegistry
//   docs/crash-reporter.md      — full design rationale and removal criteria
// ---------------------------------------------------------------------------
function CrashReportScreen({
  report,
  onDismiss,
}: {
  report: string;
  onDismiss: () => void;
}) {
  return (
    <SafeAreaView style={cr.root}>
      <View style={cr.header}>
        <Text style={cr.title}>💥 Previous Crash Detected</Text>
        <Text style={cr.subtitle}>
          The app crashed last time it ran. The full report is below.{'\n'}
          File also saved to:{'\n'}
          <Text style={cr.path}>Android/data/com.forgelink/files/crash_report.txt</Text>
        </Text>
      </View>
      <ScrollView style={cr.scroll} contentContainerStyle={cr.scrollContent}>
        <Text style={cr.report} selectable>{report}</Text>
      </ScrollView>
      <TouchableOpacity
        style={cr.button}
        onPress={async () => {
          try { await ForgeLinkNative?.clearCrashReport?.(); } catch (_) {}
          onDismiss();
        }}
      >
        <Text style={cr.buttonText}>Dismiss &amp; continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const cr = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  title: { color: '#f87171', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },
  path: { color: '#38bdf8', fontFamily: 'monospace' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  report: {
    color: '#e2e8f0',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  button: {
    margin: 16,
    paddingVertical: 14,
    backgroundColor: '#1e40af',
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

// ---------------------------------------------------------------------------

type WorkspaceProfile = {
  id: string;
  directoryUri: string;
  openFiles: string[];
  splitPercentages: { left: number; right: number };
  cursorPositions: Record<string, { line: number; column: number }>;
  lastCommands: string[];
  files: Record<string, string>;
  activeFile: string;
};

const App = () => {
  // Crash report state — checked once on mount before anything else renders.
  const [crashReport, setCrashReport] = useState<string | null>(null);
  const [crashChecked, setCrashChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const report: string | null = await ForgeLinkNative?.readCrashReport?.();
        if (report) setCrashReport(report);
      } catch (_) {
        // If the native module isn't available yet, proceed normally
      } finally {
        setCrashChecked(true);
      }
    })();
  }, []);

  const [workspace, setWorkspace] = useState<WorkspaceProfile>(() => createWorkspaceSeed());
  const [activeTab, setActiveTab] = useState<'terminal' | 'preview'>('terminal');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [commandInput, setCommandInput] = useState('npm run dev');
  const [statusMessage, setStatusMessage] = useState('Workspace ready');
  const drawerHeight = useSharedValue(220);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const saved = await AsyncStorage.getItem('forge-link:workspace');
        if (saved) {
          const parsed = normalizeWorkspace(JSON.parse(saved));
          setWorkspace(parsed);
          setCommandInput(parsed.lastCommands[0] || 'npm run dev');
        }
      } catch (error) {
        console.warn(error);
      }
    };

    loadWorkspace();
  }, []);

  useEffect(() => {
    const persist = async () => {
      await AsyncStorage.setItem('forge-link:workspace', JSON.stringify(workspace));
    };
    persist();
  }, [workspace]);

  const toggleDrawer = () => {
    const next = !drawerOpen;
    setDrawerOpen(next);
    drawerHeight.value = withTiming(next ? 220 : 72, { duration: 180 });
  };

  const animatedDrawerStyle = useAnimatedStyle(() => ({ height: drawerHeight.value }));
  const gesture = Gesture.Tap().onEnd(() => {
    toggleDrawer();
  });

  const updateActiveFile = (file: string) => {
    setWorkspace((prev) => ({ ...prev, activeFile: file }));
  };

  const updateFileContent = (file: string, value: string) => {
    setWorkspace((prev) => ({
      ...prev,
      files: { ...prev.files, [file]: value },
      cursorPositions: { ...prev.cursorPositions, [file]: { line: 1, column: 0 } },
    }));
  };

  const runCommand = async (commandOverride?: string) => {
    const resolved = commandOverride || commandInput;
    if (!resolved.trim()) {
      Alert.alert('No command', 'Enter a command to run.');
      return;
    }

    try {
      await ForgeLinkNative?.executeCommand?.(resolved);
      setWorkspace((prev) => ({
        ...prev,
        lastCommands: [resolved, ...prev.lastCommands.filter((item) => item !== resolved)].slice(0, 8),
      }));
      setStatusMessage(`Running: ${resolved}`);
    } catch (error) {
      console.warn(error);
      setStatusMessage('Command dispatch failed');
    }
  };

  const previewMode = useMemo(() => {
    if (workspace.directoryUri.includes('/storage')) {
      return 'local-file';
    }
    return 'framework';
  }, [workspace.directoryUri]);

  const activeFileContent = workspace.files[workspace.activeFile] || '';
  const previewUri = useMemo(() => derivePreviewUri(workspace.directoryUri, 'http://localhost:3000'), [workspace.directoryUri]);

  // Show crash report screen if a previous crash was detected
  if (crashChecked && crashReport) {
    return (
      <CrashReportScreen
        report={crashReport}
        onDismiss={() => setCrashReport(null)}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.sidebar}>
          <Text style={styles.title}>ForgeLink Workspace</Text>
          <Text style={styles.subtitle}>{workspace.directoryUri}</Text>
          <ScrollView style={styles.fileList}>
            {workspace.openFiles.map((file) => (
              <TouchableOpacity key={file} style={[styles.fileItem, workspace.activeFile === file && styles.activeFileItem]} onPress={() => updateActiveFile(file)}>
                <Text style={styles.fileText}>{file}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.canvas}>
          <Text style={styles.canvasTitle}>Main Editor Canvas</Text>
          <Text style={styles.canvasBody}>A practical daily-driver shell for editing files, launching commands, and previewing projects.</Text>
          <TextInput
            style={styles.editor}
            multiline
            value={activeFileContent}
            onChangeText={(value) => updateFileContent(workspace.activeFile, value)}
            placeholder="Start typing your project notes or code"
          />
          <View style={styles.commandRow}>
            <TextInput
              style={styles.commandInput}
              value={commandInput}
              onChangeText={setCommandInput}
              placeholder="npm run dev"
            />
            <TouchableOpacity style={styles.actionButton} onPress={() => runCommand()}>
              <Text style={styles.actionText}>Run</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.status}>{statusMessage}</Text>
          <View style={styles.presetRow}>
            {commandPresets.slice(0, 3).map((preset) => (
              <TouchableOpacity key={preset.label} style={styles.presetChip} onPress={() => setCommandInput(preset.command)}>
                <Text style={styles.presetText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.drawer, animatedDrawerStyle]}>
            <View style={styles.drawerHandle} />
            <View style={styles.tabs}>
              <TouchableOpacity style={[styles.tab, activeTab === 'terminal' && styles.activeTab]} onPress={() => setActiveTab('terminal')}>
                <Text>Terminal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'preview' && styles.activeTab]} onPress={() => setActiveTab('preview')}>
                <Text>Preview</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.drawerContent}>
              {activeTab === 'terminal' ? (
                <View style={styles.terminalPanel}>
                  <Text style={styles.terminalTitle}>Recent commands</Text>
                  {workspace.lastCommands.map((command) => (
                    <Text key={command} style={styles.commandListItem}>{command}</Text>
                  ))}
                </View>
              ) : (
                <WebView source={{ uri: previewMode === 'local-file' ? previewUri : 'http://localhost:3000' }} style={styles.webview} />
              )}
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111827' },
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#111827' },
  sidebar: { width: '30%', padding: 16, backgroundColor: '#1f2937' },
  title: { color: '#f9fafb', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#9ca3af', marginBottom: 12 },
  fileList: { flex: 1 },
  fileItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#374151' },
  activeFileItem: { backgroundColor: '#374151' },
  fileText: { color: '#f9fafb' },
  canvas: { flex: 1, padding: 16, backgroundColor: '#f3f4f6' },
  canvasTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  canvasBody: { marginBottom: 12 },
  editor: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, backgroundColor: '#fff', marginBottom: 12 },
  commandRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  commandInput: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  actionButton: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#2563eb', borderRadius: 8, justifyContent: 'center' },
  actionText: { color: '#fff', fontWeight: '600' },
  status: { marginBottom: 8, color: '#374151' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#dbeafe', borderRadius: 999, marginRight: 8, marginBottom: 8 },
  presetText: { color: '#1d4ed8' },
  drawer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', elevation: 8 },
  drawerHandle: { width: 56, height: 5, borderRadius: 3, backgroundColor: '#d1d5db', alignSelf: 'center', marginTop: 8 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  activeTab: { backgroundColor: '#dbeafe', borderRadius: 8 },
  drawerContent: { flex: 1, padding: 12 },
  terminalPanel: { flex: 1 },
  terminalTitle: { fontWeight: '700', marginBottom: 8 },
  commandListItem: { marginBottom: 6, color: '#374151' },
  webview: { flex: 1 },
});

export default App;
