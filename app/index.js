const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1400,
        height: 800,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {})
    })

    const isDev = !app.isPackaged;

    if (isDev) {
        // 开发环境
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools();
    } else {
        // 生产环境
        const indexHtmlPath = path.join(__dirname, 'resources', 'frontend', 'index.html');
        win.loadFile(indexHtmlPath);
    }
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    ipcMain.handle('select-file', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });

    ipcMain.handle('open_local_folder', async (event, folderPath) => {
        try {
            if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
                await shell.openPath(folderPath);
                return { success: true };
            } else {
                return { success: false, error: '路径不存在或不是一个文件夹' };
            }
        } catch (err) {
            return { success: false, error: err.message };
        }
    });
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})