const invokeWindow = (action, args = {}) =>
  window.__blanksNative?.invoke?.('window_action', { action, args })

const windowState = () => window.__blanksNative?.windowState || { maximized: false, fullscreen: false }

const currentWindow = {
  close: () => invokeWindow('close'),
  minimize: () => invokeWindow('minimize'),
  maximize: async () => {
    await invokeWindow('maximize')
    window.__blanksNative.windowState.maximized = true
  },
  unmaximize: async () => {
    await invokeWindow('unmaximize')
    window.__blanksNative.windowState.maximized = false
  },
  isMaximized: () => windowState().maximized,
  isFullScreen: () => windowState().fullscreen,
  setFullScreen: async (value) => {
    await invokeWindow('set_fullscreen', { value })
    window.__blanksNative.windowState.fullscreen = value
  },
  setAlwaysOnTop: (value) => invokeWindow('set_always_on_top', { value }),
  webContents: {
    send: (channel, ...args) => window.electron?.ipcRenderer?.send(channel, ...args)
  }
}

export const getCurrentWindow = () => currentWindow

export class MenuItem {
  constructor(options = {}) {
    Object.assign(this, options)
  }
}

export class Menu {
  constructor() {
    this.items = []
  }

  append(item) {
    this.items.push(item)
  }

  popup({ x = 0, y = 0 } = {}) {
    const previous = document.querySelector('.blanks-native-context-menu')
    previous?.remove()

    const root = document.createElement('div')
    root.className = 'blanks-native-context-menu'
    root.style.position = 'fixed'
    root.style.left = `${x}px`
    root.style.top = `${y}px`
    root.style.zIndex = '100000'
    root.style.minWidth = '180px'
    root.style.padding = '4px 0'
    root.style.borderRadius = '6px'
    root.style.background = 'var(--floatBgColor, #fff)'
    root.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.24)'
    root.style.color = 'var(--editorColor, #222)'
    root.style.fontSize = '13px'

    const close = () => root.remove()
    for (const item of this.items) {
      if (item.type === 'separator') {
        const separator = document.createElement('div')
        separator.style.height = '1px'
        separator.style.margin = '4px 0'
        separator.style.background = 'var(--floatBorderColor, rgba(0, 0, 0, 0.12))'
        root.append(separator)
        continue
      }

      const row = document.createElement('button')
      row.type = 'button'
      row.textContent = `${item.checked ? '✓ ' : ''}${item.label || ''}`
      row.disabled = item.enabled === false
      row.style.display = 'block'
      row.style.width = '100%'
      row.style.padding = '6px 16px'
      row.style.border = '0'
      row.style.background = 'transparent'
      row.style.color = 'inherit'
      row.style.textAlign = 'left'
      row.style.cursor = row.disabled ? 'default' : 'pointer'
      row.addEventListener('click', () => {
        if (row.disabled) return
        close()
        item.click?.(item, currentWindow)
      })
      root.append(row)
    }

    document.body.append(root)
    setTimeout(() => document.addEventListener('click', close, { once: true }), 0)
  }

  static getApplicationMenu() {
    return {
      popup: ({ x = 0, y = 0 } = {}) => {
        const menu = new Menu()
        menu.append(
          new MenuItem({
            label: 'New File',
            click: () => window.electron?.ipcRenderer?.send('mt::new-untitled-tab')
          })
        )
        menu.append(
          new MenuItem({
            label: 'Open File...',
            click: () => window.electron?.ipcRenderer?.send('mt::cmd-open-file')
          })
        )
        menu.append(
          new MenuItem({
            label: 'Open Folder...',
            click: () => window.electron?.ipcRenderer?.send('mt::cmd-open-folder')
          })
        )
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(
          new MenuItem({
            label: 'Save',
            click: () => window.electron?.ipcRenderer?.send('mt::editor-ask-file-save')
          })
        )
        menu.append(
          new MenuItem({
            label: 'Save As...',
            click: () => window.electron?.ipcRenderer?.send('mt::editor-ask-file-save-as')
          })
        )
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(
          new MenuItem({
            label: 'Preferences',
            click: () => window.electron?.ipcRenderer?.send('mt::open-setting-window')
          })
        )
        menu.append(
          new MenuItem({
            label: 'Quit',
            click: () => window.electron?.ipcRenderer?.send('mt::app-try-quit')
          })
        )
        menu.popup({ x, y })
      }
    }
  }
}

export const clipboard = {
  writeText: (text) => window.electron?.clipboard?.writeText(text),
  readText: () => window.electron?.clipboard?.readText()
}
