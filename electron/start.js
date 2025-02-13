const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

// Запускаем основной процесс Electron
const child = spawn(electron, [path.join(__dirname, 'main.js')], {
  stdio: 'inherit'
});

child.on('close', (code) => {
  process.exit(code);
});
