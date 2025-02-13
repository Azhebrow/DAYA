const builder = require('electron-builder');
const path = require('path');

builder.build({
  config: {
    appId: 'com.productivity.tracker',
    productName: 'Productivity Tracker',
    directories: {
      output: path.join(__dirname, '../releases')
    },
    files: [
      'dist/**/*',
      'electron/**/*'
    ],
    win: {
      target: ['nsis'],
      icon: path.join(__dirname, '../generated-icon.png')
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true
    }
  }
}).catch((error) => {
  console.error('Error during build:', error);
  process.exit(1);
});
