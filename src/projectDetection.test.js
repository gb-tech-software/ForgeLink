const { detectProjectType, generateBuildCommands, generateInstallCommand, generateDebugInfo } = require('./projectDetection.js');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('detects Next.js projects', () => {
  const type = detectProjectType({ 'next.config.js': true, 'package.json': true });
  if (type !== 'next') throw new Error(`expected 'next', got '${type}'`);
});

test('detects Vite projects', () => {
  const type = detectProjectType({ 'vite.config.js': true, 'package.json': true });
  if (type !== 'vite') throw new Error(`expected 'vite', got '${type}'`);
});

test('detects Python projects', () => {
  const type = detectProjectType({ 'requirements.txt': true });
  if (type !== 'python') throw new Error(`expected 'python', got '${type}'`);
});

test('detects static HTML projects', () => {
  const type = detectProjectType({ 'index.html': true });
  if (type !== 'html') throw new Error(`expected 'html', got '${type}'`);
});

test('generates build commands for Next.js', () => {
  const commands = generateBuildCommands('next', 'MyApp');
  if (!commands[0].includes('dev') || !commands[1].includes('build')) {
    throw new Error('expected dev and build commands');
  }
});

test('generates install command for Node projects', () => {
  const cmd = generateInstallCommand('node');
  if (!cmd.includes('npm')) throw new Error('expected npm install');
});

test('generates debug info', () => {
  const info = generateDebugInfo('vite');
  if (!info.includes('vite') || !info.includes('Available commands')) {
    throw new Error('expected debug info with project type and commands');
  }
});
