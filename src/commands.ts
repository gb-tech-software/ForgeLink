export type CommandPreset = {
  label: string;
  command: string;
  description: string;
};

export const commandPresets: CommandPreset[] = [
  { label: 'Start Vite', command: 'npm run dev -- --host 0.0.0.0', description: 'Run a Vite app locally' },
  { label: 'Start Next.js', command: 'npm run dev -- --hostname 0.0.0.0', description: 'Run a Next.js app locally' },
  { label: 'Start Python server', command: 'python3 -m http.server 8000', description: 'Serve a static folder locally' },
  { label: 'Install dependencies', command: 'npm install', description: 'Install Node dependencies' },
  { label: 'Run tests', command: 'npm test', description: 'Run project tests' },
];
