'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');

const isDev = process.env.ALGEROLL_DEV === '1';
const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');

let staticServer = null;
let mainWindow = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(startApp).catch((error) => {
    dialog.showErrorBox('AlgeRoll', `No se pudo iniciar el juego:\n\n${error.message}`);
    app.quit();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('before-quit', () => {
    if (staticServer) {
      try {
        staticServer.server.close();
      } catch {
        // El servidor ya estaba cerrado.
      }
      staticServer = null;
    }
  });
}

async function startApp() {
  Menu.setApplicationMenu(null);

  const { createStaticServer } = await import('../server.mjs');
  staticServer = await createStaticServer({ port: 0, host: '127.0.0.1' });

  createMainWindow(staticServer.port);
}

function createMainWindow(port) {
  const windowOptions = {
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#5b2aa6',
    title: 'AlgeRoll',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: isDev,
    },
  };

  if (fs.existsSync(iconPath)) windowOptions.icon = iconPath;

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1:')) return { action: 'allow' };
    if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      event.preventDefault();
      if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}
