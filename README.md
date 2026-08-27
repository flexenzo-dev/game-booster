# ⚡ GameBoost — Neumorphic Windows Gaming Optimizer (Electron)

**Publisher: Flexenzo Dev**

A modern, **white neumorphic** Windows gaming optimizer. Clean junk, set power
plans, kill telemetry, apply FPS/latency tweaks, optimize network, debloat
Windows, and install gaming apps — in one beautiful soft-UI app.

It's **AI-powered**: GameBoost reads your PC specs and uses the **DeepSeek** LLM
to build a tailored optimization plan, then applies it all with a single button.

Built with **Electron** (HTML/CSS/JS renderer + Node.js system backend), packaged
with **electron-builder** into a native **NSIS** installer.

**Note**: You have to type your deepseek api key on DEEPSEEK_API_KEY.txt
---

## 🤖 AI Optimize (DeepSeek)

- One button reads your CPU / GPU / RAM / storage / OS and sends them to
  **DeepSeek** (`deepseek-chat`), which returns a hardware-specific plan
  (power plan, gaming tweaks, privacy, DNS/TCP, cleaning, debloat, apps).
- **AI Optimize** — analyzes and applies everything automatically.
- **Preview Plan** — shows the AI's reasoning & recommendations first, then
  lets you apply them.

### Set your API key
Create a `DEEPSEEK_API_KEY.txt` file in the project root containing the key
(already added, gitignored), or set the environment variable
`DEEPSEEK_API_KEY`. The key is never logged or committed.


---

## ✨ Features

### 🧹 Cleaner
- Windows/User Temp, Prefetch, Recycle Bin, Thumbnail Cache, Windows Update cache,
  Delivery Optimization, Edge/Chrome cache, DirectX shader cache, Logs
- Scan shows size + file count; selective clean

### ⚡ Power
- Unlock & activate **Ultimate Performance** / High / Balanced / Power Saver
- AC tweaks (disk/standby/hibernate/monitor timeouts = 0)
- Disable/Enable hibernation

### 🛡️ Privacy
- `AllowTelemetry = 0`, DiagTrack + dmwappushservice disabled, hosts block
- Cortana, Advertising ID, Activity History, Location, Feedback, App telemetry
- Disables telemetry scheduled tasks

### 🎮 Gaming
- GameDVR/Game Bar off, Fullscreen optimizations off
- Hardware-accelerated GPU scheduling (`HwSchMode=2`)
- Visual FX → Performance, SysMain off (SSD)
- GPU priority + `SystemResponsiveness=0` + `NetworkThrottlingIndex=10`
- Disable Nagle's algorithm (`TcpAckFrequency`, `TCPNoDelay`)
- MSI mode for GPU, HPET off, dynamic tick off

### 🌐 Network
- DNS: Cloudflare 1.1.1.1 / Google / Quad9 / Auto
- TCP: autotuning, chimney, DCA, NetDMA, ECN off, RSC off
- Winsock / IP reset

### 🗑️ Debloat
- 40+ bloat packages (CandyCrush, Xbox, Zune, Skype, People…)
- Extra: Widgets, Copilot, OneDrive, Teams Chat

### 📦 Gaming Apps
- Steam, Epic, Discord, Riot, EA, GOG, NVIDIA App, Chrome, Firefox, 7-Zip,
  VC++ Redist, OBS, Spotify — via **winget** (silent) or browser fallback

### 🔧 Tools
- Restore point, registry backup, flush DNS, clear clipboard, startup apps
- **One-click Optimize** (restore → clean → power → gaming → privacy → network)

---

## 🚀 Run (development)

```bat
cd GameBoost-Electron
npm install
npm start
```
> The app **auto-elevates to Administrator** on launch (UAC prompt) so all
> system tweaks succeed. In dev it relaunches itself elevated via PowerShell.

## 📦 Build NSIS installer

```bat
npm run dist
```
Outputs:
- `dist/GameBoost Setup 1.0.0.exe`  ← **Nullsoft NSIS installer** (per-machine)

Installer (configured in `package.json` → `build.nsis`):
- `perMachine: true` (installs to Program Files), `allowElevation: true`
- Desktop + Start Menu shortcuts, uninstaller, custom icon
- `signAndEditExecutable: false` + `afterPack.js` — embeds icon/version via the
  bundled `rcedit` binary (avoids the winCodeSign symlink/Dev-Mode requirement)

Optional: `set CSC_IDENTITY_AUTO_DISCOVERY=false` before building to skip
code-signing certificate auto-discovery.

---

## ✅ Code signing (remove "Unknown publisher")

The installer shows **"Unknown publisher"** because it isn't signed. Publisher
& company metadata is set to **Flexenzo Dev**, but Windows only shows a trusted
publisher after the build is **code-signed** with a certificate from a CA.

To sign it, either:

1. **Buy a code-signing cert (OV/EV)** from DigiCert / Sectigo / SSL.com
   (~$50–$250/yr), then set `WIN_CSC_LINK` (base64 `.pfx`) + `WIN_CSC_KEY_PASSWORD`
   and set `"signAndEditExecutable": true` (remove `false`) in `package.json`.
2. Or use an **Azure Trusted Signing** / cloud signing service.

Self-signed certs won't help — Windows still blocks them and shows the
publisher as untrusted.

---

## 📁 Structure
```
GameBoost-Electron/
├── main.js                # Electron main process + IPC + auto-elevation
├── preload.js             # contextBridge API
├── afterPack.js           # embeds icon/version via rcedit
├── backend/               # Node.js system backend (no Python)
│   ├── util.js            # exec / PowerShell / registry helpers
│   ├── system.js          # sysinfo, restore point, backup
│   ├── cleaner.js         # junk scan + clean
│   ├── power.js           # power plans
│   ├── telemetry.js       # privacy tweaks
│   ├── gaming.js          # FPS/latency tweaks
│   ├── network.js         # DNS + TCP
│   ├── debloat.js         # bloatware removal
│   └── apps.js            # winget installer
├── renderer/
│   ├── index.html         # single-page UI
│   ├── styles.css         # white neumorphic design system
│   └── app.js             # UI logic
└── build/icon.ico         # app icon
```

---

## 🎨 Design

White neumorphism — soft `#e0e5ec` surface, twin shadows
(`box-shadow: 9px 9px 18px #a3b1c6, -9px -9px 18px #ffffff`) for extruded
cards/buttons; inset shadows for sunken inputs, checkboxes and console.
Accent gradient `#6a86ff → #4f66e0`. The logo/icon is a white neumorphic bolt.

---

## ⚠️ Safety
- AI/one-click flows create a restore point first
- Registry tweaks are reversible (Revert buttons)
- Debloater previews before removal
- Recommend reboot after gaming/network tweaks
- API keys are stored locally & gitignored; the app never sends secrets back

---

## 📜 License
MIT © 2026 GameBoost Studio
