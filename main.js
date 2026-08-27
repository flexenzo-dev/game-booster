const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

// ── auto-elevate to Administrator on Windows ────────────────
function isAdmin() {
  try { execFileSync('net', ['session'], { windowsHide: true }); return true; }
  catch { return false; }
}
if (process.platform === 'win32' && !isAdmin() && process.env.GB_ELEVATED !== '1' && !process.env.GB_SKIP_ELEVATE) {
  const args = process.argv.slice(1);
  const argList = args.map(a => `'${a.replace(/'/g, "''")}'`).join(',');
  const script = `Start-Process -FilePath '${process.execPath.replace(/'/g, "''")}' -ArgumentList @(${argList}) -Verb RunAs`;
  spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    detached: true, stdio: 'ignore', env: { ...process.env, GB_ELEVATED: '1' },
  }).unref();
  app.quit();
}

const system = require('./backend/system');
const cleaner = require('./backend/cleaner');
const power = require('./backend/power');
const telemetry = require('./backend/telemetry');
const gaming = require('./backend/gaming');
const network = require('./backend/network');
const debloat = require('./backend/debloat');
const appsMod = require('./backend/apps');
const ai = require('./backend/ai');
const { runPS } = require('./backend/util');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: parseInt(process.env.GB_W || '1280', 10),
    height: parseInt(process.env.GB_H || '800', 10),
    minWidth: 1000,
    minHeight: 660,
    backgroundColor: '#e0e5ec',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Screenshot mode (testing only): GB_SHOT=<file>
  if (process.env.GB_SHOT) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const img = await win.webContents.capturePage();
          require('fs').writeFileSync(process.env.GB_SHOT, img.toPNG());
        } catch (e) { console.error('shot', e.message); }
        app.quit();
      }, 5000);
    });
  }
}

function log(msg) {
  if (win && !win.isDestroyed()) win.webContents.send('log', msg);
}

// ── generic wrappers that stream progress to the console ──
const withLog = (fn) => async (evt, payload) => {
  try {
    return await fn(payload, log);
  } catch (e) {
    log('  ! ' + e.message);
    return { error: e.message };
  }
};

app.whenReady().then(() => {
  createWindow();

  // info
  ipcMain.handle('sysinfo', () => system.getSystemInfo());
  ipcMain.handle('admin', () => isAdmin());
  ipcMain.handle('catalog', () => ({
    targets: Object.keys(cleaner.TARGETS),
    gaming: gaming.TWEAKS.map(t => t.name),
    privacy: telemetry.TWEAKS.map(t => t.name),
    power: Object.keys(power.PLANS),
    dns: Object.keys(network.DNS),
    bloat: debloat.BLOAT,
    extra: debloat.EXTRA,
    apps: appsMod.APPS.map(a => a.name),
  }));

  // AI optimization
  ipcMain.handle('aiStatus', () => ({ key: ai.hasKey() }));
  ipcMain.handle('aiAnalyze', async () => {
    try {
      const info = await system.getSystemInfo();
      log('  → Consulting DeepSeek with your hardware…');
      return { ok: true, plan: await ai.analyze(info), info };
    } catch (e) {
      log('  ✗ AI analyze failed: ' + e.message);
      return { ok: false, error: e.message };
    }
  });
  ipcMain.handle('aiOptimize', withLog(async () => {
    const info = await system.getSystemInfo();
    const plan = await ai.aiOptimize(info, log);
    log('  ── AI OPTIMIZE DONE ──');
    return plan;
  }));
  ipcMain.handle('aiApplyPlan', withLog(async (plan) => {
    const applied = await ai.applyPlan(plan, log);
    log('  ── AI PLAN APPLIED ──');
    return applied;
  }));

  // cleaner
  ipcMain.handle('scanJunk', (e, cats) => cleaner.scanJunk(cats));
  ipcMain.handle('cleanJunk', withLog((cats) => cleaner.cleanJunk(cats, log)));

  // power
  ipcMain.handle('powerActive', () => power.getActivePlan());
  ipcMain.handle('setPower', withLog(async (name) => { const r = await power.setPlan(name); log('  ' + r.out); return r; }));
  ipcMain.handle('hibernate', withLog(async (mode) => { const r = mode === 'on' ? await power.enableHibernation() : await power.disableHibernation(); log('  Hibernation ' + mode); return r; }));

  // telemetry
  ipcMain.handle('applyPrivacy', withLog(async (ids) => { const r = await telemetry.apply(ids); r.forEach(x => log('    ' + (x.ok ? '✓' : '✗') + ' ' + x.id)); return r; }));
  ipcMain.handle('revertPrivacy', () => telemetry.revert());

  // gaming
  ipcMain.handle('applyGaming', withLog(async (ids) => { const r = await gaming.apply(ids); r.forEach(x => log('    ' + (x.ok ? '✓' : '✗') + ' ' + x.id)); return r; }));
  ipcMain.handle('revertGameDVR', () => gaming.revertGameDVR());

  // network
  ipcMain.handle('applyDns', withLog(async (choice) => { const r = await network.setDns(choice); log('  DNS ' + choice + (r.ok ? ' ✓' : ' ✗')); return r; }));
  ipcMain.handle('optimizeTcp', withLog(async () => { const r = await network.optimizeTcp(); r.forEach(x => log('    ' + (x.ok ? '✓' : '✗') + ' ' + x.label)); return r; }));
  ipcMain.handle('resetNetwork', () => network.resetNetwork());

  // debloat
  ipcMain.handle('removeBloat', withLog(async (pats) => { const r = await debloat.remove(pats); r.forEach(x => log('    ' + (x.ok ? '✓' : '✗') + ' ' + x.pattern)); return r; }));
  ipcMain.handle('applyExtra', withLog(async (id) => { const r = await debloat.applyExtra(id); log('    ✓ ' + id); return r; }));

  // apps
  ipcMain.handle('installApps', withLog(async (names) => { const r = await appsMod.install(names, log); r.forEach(x => log('    ' + (x.ok ? '✓' : '›') + ' ' + x.name)); return r; }));
  ipcMain.handle('wingetAvailable', () => appsMod.wingetAvailable());

  // tools
  ipcMain.handle('restorePoint', withLog(async () => { log('  → Creating restore point…'); const ok = await system.createRestorePoint(); log('  ' + (ok ? '✓ Restore point created' : '✗ Failed')); return ok; }));
  ipcMain.handle('regBackup', withLog(async () => { const r = await system.backupRegistry(); log('  ' + (r.ok ? '✓ ' + r.file : '✗ ' + r.file)); return r; }));
  ipcMain.handle('flushDns', () => system.flushDns());
  ipcMain.handle('startupApps', () => system.getStartupApps());
  ipcMain.handle('openExternal', (e, url) => shell.openExternal(url));
  ipcMain.handle('clearClipboard', () => runPS("Set-Clipboard -Value ''").then(() => true));

  // one-click
  ipcMain.handle('oneClick', withLog(async () => {
    log('  ── ONE-CLICK START ──');
    log('  → Restore point…'); await system.createRestorePoint();
    log('  → Cleaning…'); await cleaner.cleanJunk(['User Temp', 'Windows Temp', 'Thumbnail Cache'], log);
    log('  → Power: Ultimate…'); await power.setPlan('Ultimate Performance');
    log('  → Gaming tweaks…'); await gaming.apply();
    log('  → Privacy…'); await telemetry.apply();
    log('  → Network…'); await network.optimizeTcp(); await network.setDns('Cloudflare (1.1.1.1 / 1.0.0.1) — Fast Gaming');
    log('  ── DONE — REBOOT RECOMMENDED ──');
    return true;
  }));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
