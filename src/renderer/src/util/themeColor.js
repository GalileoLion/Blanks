// Dynamically load all theme files using Vite's import.meta.glob
const lightThemeModules = import.meta.glob('../assets/themes/light/*.theme.css', {
  eager: true,
  query: '?raw',
  import: 'default'
})
const darkThemeModules = import.meta.glob('../assets/themes/dark/*.theme.css', {
  eager: true,
  query: '?raw',
  import: 'default'
})
const lightPrismModules = import.meta.glob('../assets/themes/prismjs/light/*.theme.css', {
  eager: true,
  query: '?raw',
  import: 'default'
})
const darkPrismModules = import.meta.glob('../assets/themes/prismjs/dark/*.theme.css', {
  eager: true,
  query: '?raw',
  import: 'default'
})

function extractThemeName(path) {
  const match = path.match(/\/([^/]+)\.theme\.css$/)
  return match ? match[1] : null
}

function getCssContent(module) {
  // With `query: '?raw', import: 'default'`, the value is directly the file content as string
  if (typeof module === 'string') return module
  return ''
}

function buildThemeRegistry(themeModules, prismModules, fallbackPrismModule) {
  const registry = {}

  for (const [path, mod] of Object.entries(themeModules)) {
    const name = extractThemeName(path)
    if (!name) continue

    const themeCss = getCssContent(mod)

    // Find matching prism theme by name
    let prismCss = ''
    for (const [prismPath, prismMod] of Object.entries(prismModules)) {
      const prismName = extractThemeName(prismPath)
      if (prismName === name) {
        prismCss = getCssContent(prismMod)
        break
      }
    }

    // Fallback to default prism theme if no matching prism theme found
    if (!prismCss && fallbackPrismModule) {
      prismCss = getCssContent(fallbackPrismModule)
    }

    registry[name] = () => themeCss + '\n' + prismCss
  }

  return registry
}

// Get fallback dark prism theme (dark.theme.css)
const darkPrismFallbackPath = Object.keys(darkPrismModules).find((p) =>
  p.includes('/dark.theme.css')
)
const darkPrismFallback = darkPrismFallbackPath ? darkPrismModules[darkPrismFallbackPath] : null

const lightThemes = buildThemeRegistry(lightThemeModules, lightPrismModules, null)
const darkThemes = buildThemeRegistry(darkThemeModules, darkPrismModules, darkPrismFallback)

// Combine all themes into a single registry
export const allThemes = { ...lightThemes, ...darkThemes }

// Export theme name lists (sorted alphabetically)
// 'light' is a special theme with no CSS file - add it manually
export const lightThemeNames = ['light', ...Object.keys(lightThemes).sort()]
export const darkThemeNames = Object.keys(darkThemes).sort()

// Auto-generate theme classifications for CodeMirror theme switching
export const oneDarkThemes = Object.freeze(['one-dark'])
export const railscastsThemes = Object.freeze(darkThemeNames.filter((name) => name !== 'one-dark'))

// For backward compatibility: export a function to get theme CSS by name
export const getThemeCss = (name) => {
  if (name === 'light') return ''
  return allThemes[name] ? allThemes[name]() : ''
}
