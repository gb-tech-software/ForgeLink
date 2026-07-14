const initialFiles = {
  'README.md': '# Welcome to ForgeLink\nUse this workspace to edit files, run commands, and preview local projects.',
};

function createWorkspaceSeed(directoryUri = '/storage/shared/Projects') {
  return {
    id: 'workspace:default',
    directoryUri,
    openFiles: ['README.md'],
    splitPercentages: { left: 30, right: 70 },
    cursorPositions: { 'README.md': { line: 1, column: 0 } },
    lastCommands: ['npm run dev'],
    files: { ...initialFiles },
    activeFile: 'README.md',
  };
}

function isLocalWorkspace(directoryUri = '') {
  return Boolean(
    directoryUri &&
      (directoryUri.includes('/storage') || directoryUri.startsWith('file://') || directoryUri.startsWith('/data/')),
  );
}

function derivePreviewUri(directoryUri = '', fallback = 'http://localhost:3000') {
  if (!directoryUri) {
    return fallback;
  }

  if (isLocalWorkspace(directoryUri)) {
    if (directoryUri.endsWith('/index.html')) {
      return directoryUri;
    }
    return `${directoryUri.replace(/\/$/, '')}/index.html`;
  }

  return fallback;
}

function normalizeWorkspace(raw = {}) {
  const seeded = createWorkspaceSeed(raw.directoryUri || '/storage/shared/Projects');
  return {
    ...seeded,
    ...raw,
    files: { ...seeded.files, ...(raw.files || {}) },
    openFiles: Array.isArray(raw.openFiles) && raw.openFiles.length ? raw.openFiles : seeded.openFiles,
    splitPercentages: { ...seeded.splitPercentages, ...(raw.splitPercentages || {}) },
    cursorPositions: { ...seeded.cursorPositions, ...(raw.cursorPositions || {}) },
    lastCommands: Array.isArray(raw.lastCommands) && raw.lastCommands.length ? raw.lastCommands : seeded.lastCommands,
    activeFile: raw.activeFile || seeded.activeFile,
  };
}

module.exports = {
  createWorkspaceSeed,
  derivePreviewUri,
  isLocalWorkspace,
  normalizeWorkspace,
};
