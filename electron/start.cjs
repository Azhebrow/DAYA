const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

// Запускаем основной процесс Electron
const child = spawn(electron, [path.join(__dirname, 'main.cjs')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

child.on('close', (code) => {
  process.exit(code);
});
