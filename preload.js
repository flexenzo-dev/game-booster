const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gameboost', {
  sysinfo: () => ipcRenderer.invoke('sysinfo'),
  isAdmin: () => ipcRenderer.invoke('admin'),
  catalog: () => ipcRenderer.invoke('catalog'),
  aiStatus: () => ipcRenderer.invoke('aiStatus'),
  aiAnalyze: () => ipcRenderer.invoke('aiAnalyze'),
  aiOptimize: () => ipcRenderer.invoke('aiOptimize'),
  aiApplyPlan: (plan) => ipcRenderer.invoke('aiApplyPlan', plan),

  scanJunk: (cats) => ipcRenderer.invoke('scanJunk', cats),
  cleanJunk: (cats) => ipcRenderer.invoke('cleanJunk', cats),

  powerActive: () => ipcRenderer.invoke('powerActive'),
  setPower: (name) => ipcRenderer.invoke('setPower', name),
  hibernate: (mode) => ipcRenderer.invoke('hibernate', mode),

  applyPrivacy: (ids) => ipcRenderer.invoke('applyPrivacy', ids),
  revertPrivacy: () => ipcRenderer.invoke('revertPrivacy'),

  applyGaming: (ids) => ipcRenderer.invoke('applyGaming', ids),
  revertGameDVR: () => ipcRenderer.invoke('revertGameDVR'),

  applyDns: (choice) => ipcRenderer.invoke('applyDns', choice),
  optimizeTcp: () => ipcRenderer.invoke('optimizeTcp'),
  resetNetwork: () => ipcRenderer.invoke('resetNetwork'),

  removeBloat: (pats) => ipcRenderer.invoke('removeBloat', pats),
  applyExtra: (id) => ipcRenderer.invoke('applyExtra', id),

  installApps: (names) => ipcRenderer.invoke('installApps', names),
  wingetAvailable: () => ipcRenderer.invoke('wingetAvailable'),

  restorePoint: () => ipcRenderer.invoke('restorePoint'),
  regBackup: () => ipcRenderer.invoke('regBackup'),
  flushDns: () => ipcRenderer.invoke('flushDns'),
  startupApps: () => ipcRenderer.invoke('startupApps'),
  clearClipboard: () => ipcRenderer.invoke('clearClipboard'),
  oneClick: () => ipcRenderer.invoke('oneClick'),

  onLog: (cb) => ipcRenderer.on('log', (_e, msg) => cb(msg)),
});
