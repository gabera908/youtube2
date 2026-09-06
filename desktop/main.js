const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3030/api';

let mainWindow;

const windowState = {
  x: undefined,
  y: undefined,
  width: 1200,
  height: 800,
};

function createWindow() {
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    title: 'مدير منصة فيديو بلس',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
  });

  mainWindow.on('resize', () => {
    if (!mainWindow.isMaximized()) {
      const bounds = mainWindow.getBounds();
      windowState.width = bounds.width;
      windowState.height = bounds.height;
    }
  });

  mainWindow.on('move', () => {
    const bounds = mainWindow.getBounds();
    windowState.x = bounds.x;
    windowState.y = bounds.y;
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'إضافة فيديو',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-add-video'),
        },
        {
          label: 'تحديث',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.webContents.send('menu-refresh'),
        },
        { type: 'separator' },
        {
          label: 'خروج',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'أدوات',
      submenu: [
        {
          label: 'DevTools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'حول التطبيق',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول التطبيق',
              message: 'مدير منصة فيديو بلس',
              detail:
                'الإصدار 1.0.0\nتطبيق سطح مكتب لإدارة محتوى الفيديو\n\n© 2026 جميع الحقوق محفوظة',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('api-request', async (event, { method, url, data }) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const options = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    const result = await response.json();
    return { success: true, data: result, status: response.status };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timed out' };
    }
    if (error.type === 'system' && error.errno === 'ECONNREFUSED') {
      return { success: false, error: 'Server not running' };
    }
    return { success: false, error: error.message || 'Unknown error' };
  }
});

app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
