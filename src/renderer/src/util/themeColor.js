// ==================== Built-in dark theme CSS ====================
const DARK_EDITOR_CSS = `:root {
  /*editor*/
  --themeColor: #409eff;
  --themeColor90: rgba(64, 158, 255, 0.9);
  --themeColor80: rgba(64, 158, 255, 0.8);
  --themeColor70: rgba(64, 158, 255, 0.7);
  --themeColor60: rgba(64, 158, 255, 0.6);
  --themeColor50: rgba(64, 158, 255, 0.5);
  --themeColor40: rgba(64, 158, 255, 0.4);
  --themeColor30: rgba(64, 158, 255, 0.3);
  --themeColor20: rgba(64, 158, 255, 0.2);
  --themeColor10: rgba(64, 158, 255, 0.1);

  --highlightColor: rgba(102, 177, 255, 0.6);
  --selectionColor: rgba(102, 177, 255, 0.3);
  --editorColor: rgba(255, 255, 255, 0.7);
  --editorColor80: rgba(255, 255, 255, 0.8);
  --editorColor60: rgba(255, 255, 255, 0.6);
  --editorColor50: rgba(255, 255, 255, 0.5);
  --editorColor40: rgba(255, 255, 255, 0.4);
  --editorColor30: rgba(255, 255, 255, 0.3);
  --editorColor10: rgba(255, 255, 255, 0.1);
  --editorColor04: rgba(255, 255, 255, 0.04);
  --editorBgColor: #282828;
  --deleteColor: #409eff;
  --iconColor: rgba(255, 255, 255, 0.56);
  --codeBgColor: #424344;
  --codeBlockBgColor: #424344;
  --footnoteBgColor: rgba(66, 67, 68, 0.3);
  --inputBgColor: #2f3336;

  --focusColor: var(--themeColor);

  --buttonFontColor: rgba(255, 255, 255, 0.6);
  --buttonBgColor: #424344;
  --buttonBorder: 1px solid rgba(0, 0, 0, 0.2);
  --buttonShadow: none;
  --buttonFontColorHover: var(--buttonFontColor);
  --buttonBgColorHover: #4f5051;
  --buttonBorderHover: 1px solid rgba(0, 0, 0, 0.3);
  --buttonFontColorActive: var(--buttonFontColor);
  --buttonBgColorActive: #333434;
  --buttonBorderActive: var(--buttonBorder);

  --buttonPrimaryFontColor: #ffffff;
  --buttonPrimaryBgColor: var(--themeColor);
  --buttonPrimaryBorder: none;
  --buttonPrimaryShadow: none;
  --buttonPrimaryFontColorHover: var(--buttonPrimaryFontColor);
  --buttonPrimaryBgColorHover: #5aabff;
  --buttonPrimaryBorderHover: var(--buttonPrimaryBorder);
  --buttonPrimaryFontColorActive: var(--buttonPrimaryFontColor);
  --buttonPrimaryBgColorActive: #2791ff;
  --buttonPrimaryBorderActive: var(--buttonPrimaryBorder);
  --buttonPrimaryFocusBorder: none;
  --buttonPrimaryFocusShadow: inset 0 0 0 1px rgba(24, 26, 31, 0.5), 0 0 0 1px var(--themeColor);
  --tableBorderColor: #363839;

  /* Markdown element colors */
  --headingColor: rgba(255, 255, 255, 0.8);
  --h1Color: var(--editorColor80);
  --h2Color: var(--editorColor80);
  --h3Color: var(--editorColor80);
  --h4Color: var(--editorColor80);
  --h5Color: var(--editorColor80);
  --h6Color: var(--editorColor80);
  --blockquoteTextColor: rgba(255, 255, 255, 0.5);
  --blockquoteBorderColor: #409eff;
  --hrColor: rgba(255, 255, 255, 0.1);
  --linkColor: #409eff;
  --strongColor: rgba(255, 255, 255, 0.8);
  --emColor: #66b1ff;
  --listMarkerColor: #409eff;

  /*marktext*/
  --sideBarColor: rgba(255, 255, 255, 0.6);
  --sideBarIconColor: var(--iconColor);
  --sideBarTitleColor: rgba(255, 255, 255, 0.8);
  --sideBarTextColor: rgba(255, 255, 255, 0.4);
  --sideBarBgColor: #1e1e1e;
  --sideBarItemHoverBgColor: rgba(255, 255, 255, 0.03);
  --itemBgColor: #3f3f3f;

  --floatFontColor: rgba(255, 255, 255, 0.7);
  --floatBgColor: #3f3f3f;
  --floatHoverColor: rgba(255, 255, 255, 0.04);
  --floatBorderColor: rgba(0, 0, 0, 0.05);
  --floatShadow: rgba(0, 0, 0, 0.2);
  --maskColor: rgba(0, 0, 0, 0.7);
  --editorAreaWidth: 750px;
}

::-webkit-scrollbar {
  background: var(--editorBgColor);
}

.ag-front-menu .submenu,
.ag-float-wrapper {
  box-shadow: 0 4px 8px 0 var(--floatShadow) !important;
}

.title-bar .frameless-titlebar-button > div > svg {
  fill: #ffffff;
}
.title-bar .frameless-titlebar-minimize:hover,
.title-bar .frameless-titlebar-toggle:hover {
  background-color: rgb(255, 255, 255, 0.05);
}

.side-bar {
  border-right: 1px solid #1d1d1d !important;
}

.recent-files-projects a,
.open-project a {
  box-shadow: none !important;
}

.editor-tabs {
  box-shadow: none !important;
}
.editor-tabs:after {
  position: absolute;
  content: '';
  border-bottom: 1px solid #1d1d1d;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
}
.editor-tabs ul.tabs-container:after {
  position: absolute;
  content: '';
  border-bottom: 1px solid #1d1d1d;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
}

.tabs-container > li,
.tabs-container > li.active {
  background: var(--editorBgColor) !important;
}

.open-project button,
.recent-files-projects button {
  box-shadow: none !important;
}

/* ------------------------------------ */

:not(pre) > code[class*='language-'],
pre:not(.CodeMirror-line),
pre[class*='language-'],
pre.ag-paragraph {
  background: var(--codeBlockBgColor) !important;
  border: none !important;
}
p:not(.ag-active)[data-role='hr']::before {
  border-top: 2px dashed var(--editorColor10) !important;
  background: none !important;
}
figure.ag-active.ag-container-block > div.ag-container-preview {
  box-shadow: 0 3px 8px 0 var(--floatShadow) !important;
}

/*
 * Prism.js theme (override light theme)
 */

/* @import url("prismjs/dark.theme.css"); */`

const DARK_PRISM_CSS = `/*
 * ------------------------------------
 * Prism.js dark theme
 */

code[class*="language-"],
pre.ag-paragraph {
  color: #f8f8f2;
  /*font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;*/
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  word-wrap: normal;
  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;

  -webkit-hyphens: none;
  -moz-hyphens: none;
  -ms-hyphens: none;
  hyphens: none;
  overflow: visible;
}

/* Code Fence */
pre.ag-paragraph {
  padding: 1em;
  margin: 1em 0;
  border-radius: 0.3em;
}

/* Inline Code */
:not(pre) > code[class*="language-"],
pre.ag-paragraph {
  background: #272822;
}

/* Inline Code */
:not(pre) > code[class*="language-"] {
  padding: .1em;
  border-radius: .3em;
  white-space: normal;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: slategray;
}

.token.punctuation {
  color: #f8f8f2;
}

.namespace {
  opacity: .7;
}
 
.token.property,
.token.tag,
.token.constant,
.token.symbol {
  color: #f92672;
}
 
.token.boolean,
.token.number {
  color: #ae81ff;
}
 
.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin {
  color: #a6e22e;
}

.token.inserted {
  color: #22863a;
  background: #f0fff4;
}

.token.deleted {
  color: #b31d28;
  background: #ffeef0;
}

.token.operator,
.token.entity,
.token.url,
.language-css .token.string,
.style .token.string {
  color: #e67e65;
}

.token.atrule,
.token.attr-value,
.token.function,
.token.class-name {
  color: #e6db74;
}
 
.token.keyword {
  color: #66d9ef;
}
 
.token.regex,
.token.important,
.token.variable {
  color: #fd971f;
}
 
.token.important,
.token.bold {
  font-weight: bold;
}
.token.italic {
  font-style: italic;
}

.token.entity {
  cursor: help;
}`

// ==================== Mutable exports (initialized lazily) ====================

export let allThemes = {}
export let lightThemeNames = ['light']
export let darkThemeNames = []
export let oneDarkThemes = Object.freeze(['one-dark'])
export let railscastsThemes = Object.freeze([])

let initialized = false

const bundledThemeModules = import.meta.glob('../../../../static/themes/**/*.theme.css', {
  query: '?inline',
  import: 'default',
  eager: true
})

// ==================== Theme scanning ====================

function scanBundledThemes(subdir) {
  const themes = {}
  const marker = `/static/themes/${subdir}/`
  for (const [modulePath, css] of Object.entries(bundledThemeModules)) {
    if (modulePath.includes(marker)) {
      const filename = modulePath.slice(modulePath.lastIndexOf('/') + 1)
      const name = filename.replace('.theme.css', '')
      themes[name] = css
    }
  }
  return themes
}

async function scanUserThemes(subdir) {
  const userDataPath = global.blanks?.paths?.userDataPath
  if (!userDataPath || !window.fileUtils?.listDir) return {}

  const dir = window.path.join(userDataPath, 'themes', subdir)
  if (!(await window.fileUtils.isDirectory(dir))) return {}

  const themes = {}
  const files = await window.fileUtils.listDir(dir)
  for (const filename of files.filter((f) => f.endsWith('.theme.css'))) {
    const name = filename.replace('.theme.css', '')
    try {
      themes[name] = await window.fileUtils.readTextFile(window.path.join(dir, filename))
    } catch (error) {
      console.error(`Failed to read custom theme file: ${filename}`, error)
    }
  }
  return themes
}

function buildThemeRegistry(editorThemes, prismThemes, fallbackPrism = '') {
  const registry = {}
  for (const [name, editorCss] of Object.entries(editorThemes)) {
    const prismCss = prismThemes[name] || fallbackPrism
    registry[name] = () => editorCss + '\n' + prismCss
  }
  return registry
}

// ==================== Initialization ====================

export function initializeThemes() {
  if (initialized) return

  const lightEditor = scanBundledThemes('light')
  const darkEditor = scanBundledThemes('dark')

  const lightPrism = scanBundledThemes('prismjs/light')
  const darkPrism = scanBundledThemes('prismjs/dark')

  // Build registries
  const lightThemes = buildThemeRegistry(lightEditor, lightPrism, '')
  const darkThemes = buildThemeRegistry(darkEditor, darkPrism, DARK_PRISM_CSS)

  // Add built-in dark theme (editor + prism CSS embedded)
  darkThemes['dark'] = () => DARK_EDITOR_CSS + '\n' + DARK_PRISM_CSS

  // Update exports (ES module live binding)
  allThemes = { ...lightThemes, ...darkThemes }
  lightThemeNames = ['light', ...Object.keys(lightThemes).sort()]
  darkThemeNames = Object.keys(darkThemes).sort()
  railscastsThemes = Object.freeze(
    darkThemeNames.filter((name) => name !== 'one-dark' && name !== 'dark')
  )

  initialized = true
  console.log(
    `[ThemeColor] Initialized ${lightThemeNames.length - 1} light themes and ${darkThemeNames.length} dark themes from bundled assets`
  )
}

export async function initializeUserThemes() {
  initializeThemes()

  const [lightEditor, darkEditor, lightPrism, darkPrism] = await Promise.all([
    scanUserThemes('light'),
    scanUserThemes('dark'),
    scanUserThemes('prismjs/light'),
    scanUserThemes('prismjs/dark')
  ])

  const lightThemes = buildThemeRegistry(lightEditor, lightPrism, '')
  const darkThemes = buildThemeRegistry(darkEditor, darkPrism, DARK_PRISM_CSS)
  allThemes = { ...allThemes, ...lightThemes, ...darkThemes }
  lightThemeNames = ['light', ...new Set([...lightThemeNames.slice(1), ...Object.keys(lightThemes).sort()])]
  darkThemeNames = [...new Set([...darkThemeNames, ...Object.keys(darkThemes).sort()])]
  railscastsThemes = Object.freeze(
    darkThemeNames.filter((name) => name !== 'one-dark' && name !== 'dark')
  )
}

// For backward compatibility: export a function to get theme CSS by name
export const getThemeCss = (name) => {
  if (!initialized) initializeThemes()
  if (name === 'light') return ''
  return allThemes[name] ? allThemes[name]() : ''
}
