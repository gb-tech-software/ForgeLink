function detectProjectType(files = {}) {
  if (files['next.config.js'] || files['next.config.ts']) return 'next';
  if (files['vite.config.js'] || files['vite.config.ts']) return 'vite';
  if (files['nuxt.config.js'] || files['nuxt.config.ts']) return 'vue';
  if (files['svelte.config.js']) return 'svelte';
  if (files['package.json']) {
    if (files['public/index.html'] || files['src/index.tsx']) return 'react';
    return 'node';
  }
  if (files['requirements.txt'] || files['setup.py'] || files['pyproject.toml']) return 'python';
  if (files['index.html']) return 'html';
  return 'unknown';
}

function generateBuildCommands(type = 'unknown', name = '') {
  switch (type) {
    case 'next':
      return [
        'npm run dev -- --hostname 0.0.0.0 --port 3000',
        'npm run build',
        'npm test',
      ];
    case 'vite':
      return [
        'npm run dev -- --host 0.0.0.0 --port 3000',
        'npm run build',
        'npm run preview -- --host 0.0.0.0 --port 4173',
      ];
    case 'vue':
      return [
        'npm run dev -- --host 0.0.0.0',
        'npm run build',
        'npm run serve',
      ];
    case 'svelte':
      return [
        'npm run dev -- --host 0.0.0.0',
        'npm run build',
        'npm run preview -- --host 0.0.0.0',
      ];
    case 'react':
      return [
        'npm start',
        'npm run build',
        'npm test',
      ];
    case 'node':
      return [
        'npm install',
        'npm start',
        'npm test',
      ];
    case 'python':
      return [
        'python3 -m pip install -r requirements.txt 2>/dev/null || true',
        'python3 -m http.server 8000 --bind 0.0.0.0',
        'python3 app.py 2>/dev/null || python3 server.py 2>/dev/null || echo "No main entry found"',
      ];
    case 'html':
      return [
        'python3 -m http.server 8000 --bind 0.0.0.0',
      ];
    default:
      return [
        'npm install && npm start',
        'python3 -m http.server 8000 --bind 0.0.0.0',
      ];
  }
}

function generateInstallCommand(type = 'unknown') {
  switch (type) {
    case 'next':
    case 'vite':
    case 'react':
    case 'vue':
    case 'svelte':
    case 'node':
      return 'npm install';
    case 'python':
      return 'python3 -m pip install -r requirements.txt';
    default:
      return 'echo "No install command detected"';
  }
}

function generateDebugInfo(type = 'unknown') {
  const baseInfo = `Project Type: ${type}\n`;
  const buildCmds = generateBuildCommands(type, '');
  return baseInfo + `Available commands:\n${buildCmds.map((cmd, i) => `${i + 1}. ${cmd}`).join('\n')}`;
}

module.exports = {
  detectProjectType,
  generateBuildCommands,
  generateInstallCommand,
  generateDebugInfo,
};

