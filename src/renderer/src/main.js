import './native/setupGlobals'

const start = async () => {
  const { default: installNativeBridge } = await import('./native')
  globalThis.blanks = {}
  await installNativeBridge()

  const { createApp } = await import('vue')
  const { createRouter, createWebHashHistory } = await import('vue-router')
  const { default: bootstrapRenderer } = await import('./bootstrap')
  const { default: axios } = await import('./axios')
  const { default: pinia } = await import('./store')
  await import('./assets/symbolIcon')

  const { default: ElementPlus } = await import('element-plus')
  await import('element-plus/dist/index.css')
  const { default: en } = await import('element-plus/es/locale/lang/en')

  const { default: i18nPlugin } = await import('./i18n')
  const { default: services } = await import('./services/index')
  const { default: routes } = await import('./router')
  const { default: Main } = await import('./Main.vue')

  await import('./assets/styles/index.css')
  await import('./assets/styles/printService.css')

  await bootstrapRenderer()

  // -----------------------------------------------
  // Be careful when changing code before this line!

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
}

try {
  await start()
} catch (error) {
  console.error('[Blanks startup failed]', error)
  throw error
}
