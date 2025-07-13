const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFile: () => ipcRenderer.invoke('select-file'),
    openLocalFolder: (path) => ipcRenderer.invoke('open_local_folder', path)
});