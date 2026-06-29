import { resolve, dirname } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import postcssPresetEnv from 'postcss-preset-env'
import packageJson from './package.json' with { type: 'json' }
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rendererRoot = resolve(__dirname, 'src/renderer')
const rendererSrc = resolve(rendererRoot, 'src')
const nativeShims = resolve(rendererSrc, 'native/shims')

export default defineConfig({
  root: rendererRoot,
  envPrefix: ['VITE_', 'TAURI_'],
  clearScreen: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.UNSPLASH_ACCESS_KEY': JSON.stringify(process.env.UNSPLASH_ACCESS_KEY || ''),
    'process.env.BLANKS_RIPGREP_PATH': JSON.stringify(process.env.BLANKS_RIPGREP_PATH || ''),
    'process.env.BLANKS_VERSION_STRING': JSON.stringify(`v${packageJson.version}`),
    'process.resourcesPath': JSON.stringify('')
  },
  resolve: {
    alias: {
      '@': rendererSrc,
      '@extension': resolve(__dirname, 'src/extension'),
      common: resolve(__dirname, 'src/common'),
      muya: resolve(__dirname, 'src/muya'),
      main_renderer: resolve(__dirname, 'src/main'),
      '@electron/remote': resolve(nativeShims, 'electronRemote.js'),
      'electron-log/renderer': resolve(nativeShims, 'electronLog.js'),
      'electron-log': resolve(nativeShims, 'electronLog.js'),
      electron: resolve(nativeShims, 'electron.js'),
      child_process: resolve(nativeShims, 'nodeChildProcess.js'),
      crypto: resolve(nativeShims, 'nodeCrypto.js'),
      os: resolve(nativeShims, 'nodeOs.js'),
      path: resolve(nativeShims, 'nodePath.js')
    },
    extensions: ['.mjs', '.js', '.json', '.vue']
  },
  plugins: [vue(), svgLoader()],
  css: {
    postcss: {
      plugins: [
        postcssPresetEnv({
          stage: 0,
          features: { 'nesting-rules': true }
        })
      ]
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist-tauri'),
    emptyOutDir: true,
    target: 'es2022'
  },
  server: {
    strictPort: true,
    host: '127.0.0.1',
    port: 5173
  }
})
