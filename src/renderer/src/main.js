import './native/setupGlobals'

// -----------------------------------------------

let startupStage = 'initializing'

const writeStartupLog = (entry) => {
  const line = `${new Date().toISOString()} ${entry}`
  console.log(`[Blanks startup] ${entry}`)
  window.__TAURI__?.core
    ?.invoke('startup_log', { entry: line })
    .catch((error) => console.error('[Blanks startup log failed]', error))
}

const setStartupStage = (stage) => {
  startupStage = stage
  writeStartupLog(`stage: ${stage}`)
}

const renderStartupMessage = (message, detail = '') => {
  const target = document.getElementById('app') || document.body
  target.textContent = ''

  const wrapper = document.createElement('main')
  wrapper.style.cssText = [
    'box-sizing:border-box',
    'min-height:100vh',
    'padding:28px',
    'font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    'color:#1f2937',
    'background:#fff'
  ].join(';')

  const title = document.createElement('h1')
  title.textContent = message
  title.style.cssText = 'margin:0 0 12px;font-size:17px;font-weight:600'
  wrapper.appendChild(title)

  if (detail) {
    const pre = document.createElement('pre')
    pre.textContent = detail
    pre.style.cssText = [
      'margin:0',
      'padding:12px',
      'white-space:pre-wrap',
      'word-break:break-word',
      'border:1px solid #d1d5db',
      'border-radius:6px',
      'background:#f9fafb'
    ].join(';')
    wrapper.appendChild(pre)
  }

  target.appendChild(wrapper)
}

const formatStartupError = (error) => {
  const message = error?.message || String(error)
  const stack = error?.stack || ''
  return [`Stage: ${startupStage}`, message, stack].filter(Boolean).join('\n\n')
}

const handleStartupFailure = (error) => {
  console.error('[Blanks startup failed]', error)
  writeStartupLog(`failure: ${formatStartupError(error)}`)
  renderStartupMessage('Blanks failed to start', formatStartupError(error))
}

window.addEventListener('error', (event) => {
  handleStartupFailure(event.error || event.message)
})
window.addEventListener('unhandledrejection', (event) => {
  handleStartupFailure(event.reason)
})

const start = async () => {
  setStartupStage('native bridge')
  const { default: installNativeBridge } = await import('./native')
  globalThis.blanks = {}
  await installNativeBridge()

  setStartupStage('core modules')
  const { createApp } = await import('vue')
  const { createRouter, createWebHashHistory } = await import('vue-router')
  const { default: bootstrapRenderer } = await import('./bootstrap')
  const { default: axios } = await import('./axios')
  const { default: pinia } = await import('./store')
  await import('./assets/symbolIcon')

  setStartupStage('element plus')
  const { default: ElementPlus } = await import('element-plus')
  await import('element-plus/dist/index.css')
  const { default: en } = await import('element-plus/es/locale/lang/en')

  setStartupStage('application modules')
  const { default: i18nPlugin } = await import('./i18n')
  const { default: services } = await import('./services/index')
  const { default: routes } = await import('./router')
  const { default: Main } = await import('./Main.vue')

  setStartupStage('styles')
  await import('./assets/styles/index.css')
  await import('./assets/styles/printService.css')

  setStartupStage('renderer bootstrap')
  await bootstrapRenderer()

  // -----------------------------------------------
  // Be careful when changing code before this line!

  setStartupStage('vue mount')
  const app = createApp(Main)

  app.use(ElementPlus, {
    locale: en
  })

  const router = createRouter({
    history: createWebHashHistory(),
    // it seems like something might have changed in vue-router? it uses the full "file path" instead of
    // links like /editor if we use the old createWebHistory()
    routes: routes(globalThis.blanks.env.type)
  })

  app.use(router)
  app.use(pinia)
  app.use(i18nPlugin)

  app.config.globalProperties.$http = axios

  services.forEach((s) => {
    app.config.globalProperties['$' + s.name] = s[s.name]
  })

  app.mount('#app')
  setStartupStage('mounted')

  window.setTimeout(() => {
    const appElement = document.getElementById('app')
    const bodyText = appElement?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 200) || ''
    const html = appElement?.innerHTML?.replace(/\s+/g, ' ').trim().slice(0, 500) || ''
    writeStartupLog(`dom: children=${appElement?.children.length || 0}; text=${bodyText}; html=${html}`)
  }, 500)
}

try {
  await start()
} catch (error) {
  handleStartupFailure(error)
}
