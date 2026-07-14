import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { NativeModules } from 'react-native';

import { commandPresets } from './commands';
import { createWorkspaceSeed, derivePreviewUri, normalizeWorkspace } from './workspace';

const { ForgeLinkNative } = NativeModules;

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

  return (
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
