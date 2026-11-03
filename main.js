const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

// Ensure single instance of the application
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1000,
    minHeight: 650,
    title: 'StudyFlow — Smart Study Planner',
    icon: iconPath,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Show gracefully when ready
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links to open in the user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  createAppMenu();
}

function createAppMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Homework / Task',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-action', 'new-task');
          }
        },
        {
          label: 'Add Daily Schedule Block',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-action', 'new-block');
          }
        },
        {
          label: 'Add Exam / Test',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-action', 'new-test');
          }
        },
        { type: 'separator' },
        {
          label: 'Export Backup JSON',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-action', 'export-data');
          }
        },
        {
          label: 'Print / Save Schedule as PDF',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Exit StudyFlow' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => { if (mainWindow) mainWindow.webContents.send('menu-action', 'view-home'); }
        },
        {
          label: 'Homework & Tasks',
          accelerator: 'CmdOrCtrl+2',
          click: () => { if (mainWindow) mainWindow.webContents.send('menu-action', 'view-tasks'); }
        },
        {
          label: 'Daily Planner',
          accelerator: 'CmdOrCtrl+3',
          click: () => { if (mainWindow) mainWindow.webContents.send('menu-action', 'view-planner'); }
        },
        {
          label: 'Calendar',
          accelerator: 'CmdOrCtrl+4',
          click: () => { if (mainWindow) mainWindow.webContents.send('menu-action', 'view-calendar'); }
        },
        {
          label: 'Tests & Exams',
          accelerator: 'CmdOrCtrl+5',
          click: () => { if (mainWindow) mainWindow.webContents.send('menu-action', 'view-tests'); }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Toggle Theme (Dark / Light)',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-action', 'toggle-theme');
          }
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-action', 'shortcuts');
          }
        },
        { type: 'separator' },
        {
          label: 'About StudyFlow App',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About StudyFlow',
              message: 'StudyFlow Desktop App v1.0.0',
              detail: 'Smart Study Planner & Homework Organizer.\nDesigned to help students excel in school with intelligent scheduling, task prioritization, and progress tracking.\n\nRunning fully offline on Windows.',
              icon: path.join(__dirname, 'assets', 'icon.png')
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
