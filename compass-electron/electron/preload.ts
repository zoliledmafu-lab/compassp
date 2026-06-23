import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Companion state
  toggle:      ()                    => ipcRenderer.send('companion:toggle'),
  getSettings: ()                    => ipcRenderer.invoke('companion:getSettings'),
  getActive:   ()                    => ipcRenderer.invoke('companion:getActive'),
  setShortcut: (acc: string)         => ipcRenderer.invoke('companion:setShortcut', acc),
  saveSettings:(s: object)           => ipcRenderer.send('companion:saveSettings', s),
  setStudentId:(id: string)          => ipcRenderer.send('companion:studentId', id),

  // Voice query — renderer sends transcript, main captures screen + calls Edge Fn
  query:       (transcript: string)  => ipcRenderer.invoke('companion:query', transcript),
  speakDone:   ()                    => ipcRenderer.send('companion:speakDone'),

  // Event listeners (main → renderer)
  onStateChange:     (cb: (s: string)  => void) => {
    ipcRenderer.on('companion:stateChange', (_e, s) => cb(s))
  },
  onStartListening:  (cb: () => void) => {
    ipcRenderer.on('companion:startListening', () => cb())
  },
  onResponse:        (cb: (d: any) => void) => {
    ipcRenderer.on('companion:response', (_e, d) => cb(d))
  },
  onError:           (cb: (msg: string) => void) => {
    ipcRenderer.on('companion:error', (_e, msg) => cb(msg))
  },
  onPromptShortcut:  (cb: (cur: string) => void) => {
    ipcRenderer.on('companion:promptShortcut', (_e, cur) => cb(cur))
  },
  onAnnotate:        (cb: (targets: any[]) => void) => {
    ipcRenderer.on('companion:annotate', (_e, t) => cb(t))
  },
  onClearAnnotations:(cb: () => void) => {
    ipcRenderer.on('companion:clearAnnotations', () => cb())
  },
  onCursorMove:      (cb: (pt: { x: number; y: number }) => void) => {
    ipcRenderer.on('companion:cursorMove', (_e, pt) => cb(pt))
  },

  // Remove listeners on unmount
  removeAllListeners:(channel: string) => ipcRenderer.removeAllListeners(channel),
})
