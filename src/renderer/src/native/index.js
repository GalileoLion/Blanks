import { purePathUtils } from './setupGlobals'
import keybindingsDarwin from '../../../main/keyboard/keybindingsDarwin'
import keybindingsLinux from '../../../main/keyboard/keybindingsLinux'
import keybindingsWindows from '../../../main/keyboard/keybindingsWindows'

const isTauriRuntime = () => Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__)
const listenerRegistry = new Map()
let activeKeybindingCache = null

const defaultKeybindings = () => {
  switch (window.process?.platform) {
    case 'darwin':
      return new Map(keybindingsDarwin)
    case 'linux':
      return new Map(keybindingsLinux)
    default:
      return new Map(keybindingsWindows)
  }
}

const normalizePayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'undefined' || payload === null) return []
  return [payload]
}

const serializeBytes = (data) => {
  if (data instanceof ArrayBuffer) return Array.from(new Uint8Array(data))
  if (ArrayBuffer.isView(data)) {
    return Array.from(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
  }
  return data
}

const invokeNative = (command, args = {}) => window.__TAURI__.core.invoke(command, args)

const installListener = (channel, listener) => {
  const item = { listener, unlistenPromise: null }
  item.unlistenPromise = window.__TAURI__.event.listen(channel, (event) => {
    listener({ sender: null }, ...normalizePayload(event.payload))
  })

  if (!listenerRegistry.has(channel)) listenerRegistry.set(channel, [])
  listenerRegistry.get(channel).push(item)
  return item
}

const emitLocal = (channel, ...args) => {
  const items = listenerRegistry.get(channel) || []
  for (const item of items) {
    item.listener({ sender: null }, ...args)
  }
}

const removeListener = async (channel, listener) => {
  const items = listenerRegistry.get(channel) || []
  const keep = []
  for (const item of items) {
    if (item.listener === listener) {
      const unlisten = await item.unlistenPromise
      unlisten()
    } else {
      keep.push(item)
    }
  }
  listenerRegistry.set(channel, keep)
}

const removeAllListeners = async (channel) => {
  const items = listenerRegistry.get(channel) || []
  for (const item of items) {
    const unlisten = await item.unlistenPromise
    unlisten()
  }
  listenerRegistry.delete(channel)
}

const ensureBootstrapEvent = (channel, listener) => {
  if (channel === 'mt::bootstrap-editor' && window.__blanksNative?.bootstrapConfig) {
    setTimeout(() => listener({ sender: null }, window.__blanksNative.bootstrapConfig), 0)
  }
}

const mapFromJson = (value) => {
  if (value instanceof Map) return new Map(value)
  if (Array.isArray(value)) return new Map(value)
  if (value && typeof value === 'object') return new Map(Object.entries(value))
  return new Map()
}

const objectFromMapLike = (value) => {
  if (value instanceof Map) return Object.fromEntries(value)
  if (Array.isArray(value)) return Object.fromEntries(value)
  if (value && typeof value === 'object') return value
  return {}
}

const buildActiveKeybindings = async () => {
  const { userKeybindings = {} } = await invokeNative('ipc_invoke', {
    channel: 'mt::keybinding-get-pref-keybindings',
    args: []
  })
  const defaults = defaultKeybindings()
  const user = mapFromJson(userKeybindings)
  const active = new Map(defaults)

  for (const [userKey, userValue] of user) {
    for (const [key, value] of active) {
      if (value && userValue && value.toLowerCase() === userValue.toLowerCase()) {
        active.set(key, '')
        break
      }
    }
    active.set(userKey, userValue)
  }
  activeKeybindingCache = active
  if (window.__blanksNative) {
    window.__blanksNative.activeKeybindingCache = active
  }
  return active
}

const handleLocalSend = async (channel, args) => {
  const rendererChannels = new Set([
    'mt::new-untitled-tab',
    'mt::editor-ask-file-save',
    'mt::editor-ask-file-save-as',
    'mt::editor-close-tab',
    'mt::tabs-cycle-left',
    'mt::tabs-cycle-right',
    'mt::show-command-palette',
    'mt::show-export-dialog',
    'mt::invalidate-image-cache',
    'mt::cm-copy-as-rich',
    'mt::cm-copy-as-html',
    'mt::cm-paste-as-plain-text'
  ])
  if (rendererChannels.has(channel)) {
    emitLocal(channel, ...args)
    return true
  }

  switch (channel) {
    case 'mt::request-keybindings': {
      const active = await buildActiveKeybindings()
      emitLocal('mt::keybindings-response', Object.fromEntries(active))
      return true
    }
    case 'mt::response-print': {
      window.print()
      return true
    }
    case 'mt::window-zoom': {
      const zoomFactor = Number(args[0])
      if (Number.isFinite(zoomFactor)) {
        window.electron.webFrame.setZoomFactor(zoomFactor)
      }
      return true
    }
    default:
      return false
  }
}

const normalizeInvokeResult = (channel, result) => {
  if (channel === 'mt::keybinding-get-pref-keybindings') {
    return {
      defaultKeybindings: defaultKeybindings(),
      userKeybindings: mapFromJson(result?.userKeybindings)
    }
  }
  return result
}

const installFileUtils = () => {
  window.fileUtils = {
    ...purePathUtils,
    emptyDir: (path) => invokeNative('file_empty_dir', { path }),
    copy: (src, dest) => invokeNative('file_copy', { src, dest }),
    ensureDir: (path) => invokeNative('file_ensure_dir', { path }),
    outputFile: (path, data) =>
      invokeNative('file_write', { path, data: serializeBytes(data), append: false }),
    move: (src, dest) => invokeNative('file_move', { src, dest }),
    stat: (path) => invokeNative('file_stat', { path }),
    listDir: (path) => invokeNative('file_list_dir', { path }),
    writeFile: (path, data) =>
      invokeNative('file_write', { path, data: serializeBytes(data), append: false }),
    readFile: async (path) => {
      const bytes = await invokeNative('file_read', { path })
      return Uint8Array.from(bytes)
    },
    readTextFile: (path) => invokeNative('file_read_text', { path }),
    pathExists: (path) => invokeNative('path_exists', { path }),
    isFile: (path) => invokeNative('path_is_file', { path }),
    isDirectory: (path) => invokeNative('path_is_directory', { path }),
    isFileExecutable: (path) => invokeNative('path_is_executable_file', { path })
  }
}

const installDesktopCompat = (bootstrap) => {
  const ipcRenderer = {
    async send(channel, ...args) {
      if (await handleLocalSend(channel, args)) return
      return invokeNative('ipc_send', { channel, args })
    },
    async invoke(channel, ...args) {
      if (channel === 'mt::keybinding-save-user-keybindings') {
        args = [objectFromMapLike(args[0])]
      }
      const result = await invokeNative('ipc_invoke', { channel, args })
      if (channel === 'mt::keybinding-save-user-keybindings' && result) {
        const active = await buildActiveKeybindings()
        emitLocal('mt::keybindings-response', Object.fromEntries(active))
      }
      return normalizeInvokeResult(channel, result)
    },
    on(channel, listener) {
      installListener(channel, listener)
      ensureBootstrapEvent(channel, listener)
    },
    once(channel, listener) {
      const wrapper = (event, ...args) => {
        removeListener(channel, wrapper)
        listener(event, ...args)
      }
      installListener(channel, wrapper)
      ensureBootstrapEvent(channel, wrapper)
    },
    removeListener,
    removeAllListeners,
    emit(channel, event, ...args) {
      return invokeNative('ipc_send', { channel, args: [event, ...args] })
    },
    sendSync(channel) {
      if (channel === 'mt::ask-for-image-path') return ''
      throw new Error(`Synchronous IPC is not available for ${channel} in the Tauri runtime.`)
    }
  }

  window.process.platform = bootstrap.platform
  window.process.resourcesPath = bootstrap.resourcesPath || ''
  window.process.env = {
    ...window.process.env,
    ...bootstrap.env,
    BLANKS_VERSION_STRING: bootstrap.appVersion,
    NODE_ENV: import.meta.env.DEV ? 'development' : 'production'
  }

  window.rgPath = bootstrap.ripgrepPath || 'rg'
  window.electron = {
    ...window.electron,
    process: window.process,
    ipcRenderer,
    shell: {
      openExternal: (url) => invokeNative('shell_open_external', { url }),
      openPath: (path) => invokeNative('shell_open_path', { path }),
      showItemInFolder: (path) => invokeNative('shell_show_item_in_folder', { path }),
      trashItem: (path) => invokeNative('shell_trash_item', { path })
    },
    clipboard: {
      writeText: (text) => invokeNative('clipboard_write_text', { text }),
      readText: () => invokeNative('clipboard_read_text')
    },
    webUtils: {
      getPathForFile: (file) => file?.path || file?.name || ''
    },
    webFrame: {
      setZoomFactor: (zoomFactor) => {
        const value = Number(zoomFactor)
        if (!Number.isFinite(value) || value <= 0) return
        document.documentElement.style.setProperty('--tauri-zoom-factor', String(value))
        document.body.style.zoom = String(value)
      }
    }
  }

  window.commandExists = {
    exists: (command) => invokeNative('command_exists', { command })
  }
}

export const installNativeBridge = async () => {
  if (!isTauriRuntime()) return

  const bootstrap = await invokeNative('get_bootstrap')
  window.__blanksNative = {
    bootstrap,
    bootstrapConfig: bootstrap.editorBootstrap,
    commandCache: new Map(),
    activeKeybindingCache,
    windowState: bootstrap.windowState,
    invoke: invokeNative,
    send: (channel, ...args) => invokeNative('ipc_send', { channel, args }),
    invokeIpc: (channel, ...args) => invokeNative('ipc_invoke', { channel, args }),
    listen: (channel, listener) => {
      installListener(channel, listener)
      ensureBootstrapEvent(channel, listener)
    },
    removeListener,
    removeAllListeners,
    shell: {},
    clipboard: {}
  }

  installFileUtils()
  installDesktopCompat(bootstrap)

  window.__blanksNative.shell = window.electron.shell
  window.__blanksNative.clipboard = window.electron.clipboard

  window.__TAURI__.event.listen('mt::tauri-print', () => {
    window.print()
  })
  window.addEventListener('afterprint', () => {
    emitLocal('mt::print-service-clearup')
  })

  if (bootstrap.initialState) {
    window.__blanksNative.initialState = bootstrap.initialState
  }
}

export default installNativeBridge
