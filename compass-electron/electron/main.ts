import {
  app, BrowserWindow, globalShortcut, ipcMain,
  screen, desktopCapturer, Tray, Menu, nativeImage,
  dialog, systemPreferences
} from 'electron'
import path from 'path'
import https from 'https'
import Store from 'electron-store'

// ── Config store ──────────────────────────────────────────────────
interface StoreSchema {
  shortcut: string
  voiceGender: 'male' | 'female'
  compassUrl: string
  edgeFnUrl: string
}

const store = new Store<StoreSchema>({
  defaults: {
    shortcut:    'CommandOrControl+Shift+Space',
    voiceGender: 'female',
    compassUrl:  'http://localhost:5173',
    edgeFnUrl:   'https://njetilhbprvvazalcxrs.supabase.co/functions/v1/voice-companion',
  },
})

// ── State ─────────────────────────────────────────────────────────
let mainWindow:       BrowserWindow | null = null
let overlayWindow:    BrowserWindow | null = null
let annotationWindow: BrowserWindow | null = null
let tray:             Tray | null = null
let cursorInterval:   ReturnType<typeof setInterval> | null = null
let companionActive   = false
let currentStudentId  = ''

// ── App lifecycle ─────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Request screen capture permission on macOS
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('screen')
    if (status !== 'granted') {
      await systemPreferences.askForMediaAccess('microphone')
    }
  }

  createMainWindow()
  createOverlayWindow()
  createAnnotationWindow()
  createTray()
  registerShortcut(store.get('shortcut'))
  setupIPC()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (cursorInterval) clearInterval(cursorInterval)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Main window (Compass web app) ─────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  // Try 5173 then 5174 so dev restarts don't break things
  const base = store.get('compassUrl')
  const alts = [base, base.replace('5173','5174'), base.replace('5174','5173')]
  const tryLoad = (urls: string[]): Promise<void> => {
    const [next, ...rest] = urls
    if (!next) {
      mainWindow!.loadFile(path.join(__dirname, '..', 'overlay', 'offline.html'))
      return Promise.resolve()
    }
    return mainWindow!.loadURL(next).catch(() => tryLoad(rest))
  }
  tryLoad(alts)

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── Overlay window — cursor companion bubble ──────────────────────
function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width:       80,
    height:      80,
    frame:       false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable:   false,
    movable:     false,
    hasShadow:   false,
    show:        false,
    focusable:   false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  overlayWindow.loadFile(path.join(__dirname, '..', 'overlay', 'companion.html'))
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
}

// ── Annotation window — full-screen SVG overlay ───────────────────
function createAnnotationWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  annotationWindow = new BrowserWindow({
    width,
    height,
    x:           0,
    y:           0,
    frame:       false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable:   false,
    movable:     false,
    hasShadow:   false,
    show:        false,
    focusable:   false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  annotationWindow.loadFile(path.join(__dirname, '..', 'overlay', 'annotations.html'))
  annotationWindow.setIgnoreMouseEvents(true, { forward: true })
  annotationWindow.setAlwaysOnTop(true, 'screen-saver')
}

// ── Tray icon ─────────────────────────────────────────────────────
function createTray() {
  // Create a simple 16x16 circle icon
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const buildMenu = () => Menu.buildFromTemplate([
    { label: 'Compass Companion', enabled: false },
    { type: 'separator' },
    {
      label: companionActive ? '◉  Companion ON  (click to turn off)' : '◎  Companion OFF (click to turn on)',
      click: toggleCompanion,
    },
    { type: 'separator' },
    {
      label: `Shortcut: ${store.get('shortcut')}`,
      click: promptChangeShortcut,
    },
    { type: 'separator' },
    { label: 'Open Compass', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])

  tray.setContextMenu(buildMenu())
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus() })

  // Refresh menu on toggle
  ipcMain.on('companion:refreshTray', () => tray?.setContextMenu(buildMenu()))
}

// ── Global shortcut ───────────────────────────────────────────────
function registerShortcut(accelerator: string) {
  try {
    globalShortcut.unregisterAll()
    globalShortcut.register(accelerator, activateVoice)
  } catch (e) {
    console.error('Failed to register shortcut:', e)
  }
}

function promptChangeShortcut() {
  if (!mainWindow) return
  mainWindow.webContents.send('companion:promptShortcut', store.get('shortcut'))
  mainWindow.show()
  mainWindow.focus()
}

// ── Companion toggle ──────────────────────────────────────────────
function toggleCompanion() {
  if (companionActive) {
    companionActive = false
    stopCursorTracking()
    overlayWindow?.hide()
    overlayWindow?.webContents.send('companion:stateChange', 'off')
    mainWindow?.webContents.send('companion:stateChange', 'off')
  } else {
    companionActive = true
    overlayWindow?.show()
    overlayWindow?.webContents.send('companion:stateChange', 'idle')
    mainWindow?.webContents.send('companion:stateChange', 'idle')
    startCursorTracking()
  }
}

// ── Cursor tracking ───────────────────────────────────────────────
function startCursorTracking() {
  if (cursorInterval) clearInterval(cursorInterval)
  cursorInterval = setInterval(() => {
    if (!companionActive || !overlayWindow || overlayWindow.isDestroyed()) return
    const pt = screen.getCursorScreenPoint()
    overlayWindow.setPosition(pt.x + 20, Math.max(0, pt.y - 20))
    overlayWindow.webContents.send('companion:cursorMove', pt)
  }, 16)
}

function stopCursorTracking() {
  if (cursorInterval) { clearInterval(cursorInterval); cursorInterval = null }
}

// ── Voice activation (called by shortcut or IPC) ──────────────────
function activateVoice() {
  if (!companionActive) toggleCompanion()
  overlayWindow?.show()
  overlayWindow?.webContents.send('companion:startListening')
  mainWindow?.webContents.send('companion:startListening')
}

// ── Screen capture ────────────────────────────────────────────────
async function captureScreen(): Promise<string> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 },
    })
    if (!sources.length) return ''
    const thumb = sources[0].thumbnail
    const png   = thumb.toPNG()
    return png.toString('base64')
  } catch (e) {
    console.error('Screen capture failed:', e)
    return ''
  }
}

// ── Edge Function call ────────────────────────────────────────────
async function queryEdgeFunction(transcript: string, screenshotBase64: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url     = new URL(store.get('edgeFnUrl'))
    const body    = JSON.stringify({
      screenshot_base64: screenshotBase64,
      transcript,
      student_id:   currentStudentId,
      mode:         'desktop',
      app_detected: 'Desktop companion',
      voice_gender: store.get('voiceGender'),
    })

    const req = https.request({
      hostname: url.hostname,
      port:     443,
      path:     url.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { reject(new Error('Invalid JSON response')) }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ── Click simulation ──────────────────────────────────────────────
// Uses robotjs when available (needs node-gyp). Falls back to
// platform-native commands (PowerShell on Windows, cliclick on macOS).
import { execSync } from 'child_process'

function nativeClick(x: number, y: number, type: 'left'|'right'|'double' = 'left') {
  const xi = Math.round(x), yi = Math.round(y)

  if (process.platform === 'win32') {
    const flags = type === 'right'
      ? `0x0008, 0, 0, 0, 0); [Mouse]::mouse_event(0x0010`
      : type === 'double'
        ? `0x0002, 0, 0, 0, 0); [Mouse]::mouse_event(0x0004, 0, 0, 0, 0); [Mouse]::mouse_event(0x0002, 0, 0, 0, 0); [Mouse]::mouse_event(0x0004`
        : `0x0002, 0, 0, 0, 0); [Mouse]::mouse_event(0x0004`
    const ps = `
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class Mouse {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(int f,int dx,int dy,int c,int e);
}
"@
[Mouse]::SetCursorPos(${xi}, ${yi})
[Mouse]::mouse_event(${flags}, 0, 0, 0)
`.trim()
    execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`)
  } else if (process.platform === 'darwin') {
    const flag = type === 'right' ? '--right-click' : type === 'double' ? '--double-click' : '--click'
    execSync(`cliclick ${flag} ${xi},${yi}`)
  } else {
    // Linux — xdotool
    if (type === 'double') execSync(`xdotool mousemove ${xi} ${yi} click --clearmodifiers 1 1`)
    else if (type === 'right') execSync(`xdotool mousemove ${xi} ${yi} click --clearmodifiers 3`)
    else execSync(`xdotool mousemove ${xi} ${yi} click --clearmodifiers 1`)
  }
  console.log(`Clicked (${type}) at (${xi}, ${yi})`)
}

function performClick(x: number, y: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const robot = require('robotjs') as any
    robot.moveMouse(Math.round(x), Math.round(y)); robot.mouseClick()
  } catch { nativeClick(x, y, 'left') }
}

function performRightClick(x: number, y: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const robot = require('robotjs') as any
    robot.moveMouse(Math.round(x), Math.round(y)); robot.mouseClick('right')
  } catch { nativeClick(x, y, 'right') }
}

function performDoubleClick(x: number, y: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const robot = require('robotjs') as any
    robot.moveMouse(Math.round(x), Math.round(y)); robot.mouseClick('left', true)
  } catch { nativeClick(x, y, 'double') }
}

// ── IPC handlers ──────────────────────────────────────────────────
function setupIPC() {

  // Renderer tells us a student logged in
  ipcMain.on('companion:studentId', (_e, id: string) => {
    currentStudentId = id
  })

  // Renderer asks to toggle companion
  ipcMain.on('companion:toggle', () => toggleCompanion())

  // Renderer sends transcript after voice recording
  ipcMain.handle('companion:query', async (_e, transcript: string) => {
    overlayWindow?.webContents.send('companion:stateChange', 'thinking')
    mainWindow?.webContents.send('companion:stateChange', 'thinking')

    const screenshot = await captureScreen()
    let result: any

    try {
      result = await queryEdgeFunction(transcript, screenshot)
    } catch (e: any) {
      const msg = `Could not reach Compass AI. ${e.message}`
      overlayWindow?.webContents.send('companion:stateChange', 'idle')
      overlayWindow?.webContents.send('companion:error', msg)
      mainWindow?.webContents.send('companion:stateChange', 'idle')
      return { error: msg }
    }

    // Handle pointer targets — annotate and click
    if (result.pointer_targets) {
      const targets = Array.isArray(result.pointer_targets)
        ? result.pointer_targets
        : tryParse(result.pointer_targets)

      if (targets?.length) {
        const { width, height } = screen.getPrimaryDisplay().size
        annotationWindow?.show()
        annotationWindow?.webContents.send('companion:annotate', targets)

        // Auto-clear annotations after 8s
        setTimeout(() => {
          annotationWindow?.webContents.send('companion:clearAnnotations')
          annotationWindow?.hide()
        }, 8000)

        // Perform clicks with a small delay so user sees annotation first
        targets.forEach((t: any, i: number) => {
          if (t.action === 'click' || t.action === 'double-click' || t.action === 'right-click') {
            const x = t.x <= 1 ? t.x * width  : t.x
            const y = t.y <= 1 ? t.y * height : t.y
            setTimeout(() => {
              if (t.action === 'double-click') performDoubleClick(x, y)
              else if (t.action === 'right-click') performRightClick(x, y)
              else performClick(x, y)
            }, 600 + i * 400)
          }
        })
      }
    }

    overlayWindow?.webContents.send('companion:stateChange', 'speaking')
    mainWindow?.webContents.send('companion:stateChange', 'speaking')
    mainWindow?.webContents.send('companion:response', result)

    return result
  })

  // Renderer tells us speech ended
  ipcMain.on('companion:speakDone', () => {
    overlayWindow?.webContents.send('companion:stateChange', 'idle')
    mainWindow?.webContents.send('companion:stateChange', 'idle')
  })

  // Change shortcut
  ipcMain.handle('companion:setShortcut', (_e, accelerator: string) => {
    try {
      globalShortcut.unregisterAll()
      globalShortcut.register(accelerator, activateVoice)
      store.set('shortcut', accelerator)
      return { ok: true }
    } catch {
      registerShortcut(store.get('shortcut'))
      return { ok: false, error: `Could not register "${accelerator}"` }
    }
  })

  // Get current settings
  ipcMain.handle('companion:getSettings', () => ({
    shortcut:    store.get('shortcut'),
    voiceGender: store.get('voiceGender'),
    compassUrl:  store.get('compassUrl'),
    edgeFnUrl:   store.get('edgeFnUrl'),
    active:      companionActive,
  }))

  // Save settings
  ipcMain.on('companion:saveSettings', (_e, settings: Partial<StoreSchema>) => {
    if (settings.voiceGender) store.set('voiceGender', settings.voiceGender)
    if (settings.compassUrl)  store.set('compassUrl',  settings.compassUrl)
    if (settings.edgeFnUrl)   store.set('edgeFnUrl',   settings.edgeFnUrl)
  })

  // Get state
  ipcMain.handle('companion:getActive', () => companionActive)
}

function tryParse(v: unknown): any[] | null {
  if (!v) return null
  try { return JSON.parse(v as string) }
  catch { return null }
}
