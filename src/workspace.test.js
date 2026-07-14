const { createWorkspaceSeed, derivePreviewUri, normalizeWorkspace } = require('./workspace');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('creates a seeded workspace', () => {
  const workspace = createWorkspaceSeed('/storage/shared/Projects');
  if (!workspace.files['README.md']) throw new Error('missing seeded readme');
});

test('derives a local file preview URL', () => {
  const preview = derivePreviewUri('/storage/shared/Projects');
  if (!preview.includes('/index.html')) throw new Error('expected index.html preview');
});

test('normalizes a saved workspace profile', () => {
  const workspace = normalizeWorkspace({ directoryUri: '/storage/shared/Apps', openFiles: [] });
  if (workspace.openFiles.length === 0) throw new Error('expected fallback open files');
});
