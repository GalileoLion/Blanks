const isWindowsPath = (value = '') => /^[a-zA-Z]:[\\/]/.test(value)
const splitPath = (value = '') => `${value}`.replace(/\\/g, '/').split('/').filter(Boolean)
const toPathString = (value) => `${value || ''}`
const sep = navigator.userAgent.includes('Windows') ? '\\' : '/'

const nodePlatform = (() => {
  const platform = navigator.platform.toLowerCase()
  if (platform.includes('mac')) return 'darwin'
  if (platform.includes('win')) return 'win32'
  return 'linux'
})()

if (!globalThis.global) {
  globalThis.global = globalThis
}

const dirname = (value) => {
  const path = toPathString(value).replace(/\\/g, '/')
  const root = path.startsWith('/') ? '/' : isWindowsPath(path) ? path.slice(0, 3) : ''
  const parts = splitPath(path)
  parts.pop()
  if (parts.length === 0) return root || '.'
  return root + parts.join(sep)
}

const basename = (value, ext = '') => {
  const base = splitPath(value).pop() || ''
  return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base
}

const extname = (value) => {
  const base = basename(value)
  const index = base.lastIndexOf('.')
  return index > 0 ? base.slice(index) : ''
}

const normalize = (value) => {
  const raw = toPathString(value).replace(/\\/g, '/')
  const absolute = raw.startsWith('/') || isWindowsPath(raw)
  const root = raw.startsWith('/') ? '/' : isWindowsPath(raw) ? raw.slice(0, 3) : ''
  const parts = []
  for (const part of splitPath(raw)) {
    if (part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  const joined = parts.join(sep)
  return absolute ? root + joined : joined || '.'
}

const join = (...parts) => normalize(parts.filter(Boolean).join(sep))
const resolvePath = (...parts) => {
  const lastAbsolute = [...parts].reverse().find((part) => {
    const value = toPathString(part)
    return value.startsWith('/') || isWindowsPath(value)
  })
  if (lastAbsolute) {
    const index = parts.indexOf(lastAbsolute)
    return normalize(parts.slice(index).join(sep))
  }
  return normalize(parts.join(sep))
}

const relative = (from, to) => {
  const fromParts = splitPath(normalize(from))
  const toParts = splitPath(normalize(to))
  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift()
    toParts.shift()
  }
  return [...fromParts.map(() => '..'), ...toParts].join(sep) || ''
}

const isAbsolute = (value) => toPathString(value).startsWith('/') || isWindowsPath(value)

const toBase64 = (bytes) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const fromBase64 = (value) => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

class SimpleBuffer extends Uint8Array {
  static from(value, encoding) {
    if (value instanceof ArrayBuffer) return new SimpleBuffer(value)
    if (ArrayBuffer.isView(value)) {
      return new SimpleBuffer(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength))
    }
    if (encoding === 'base64') return new SimpleBuffer(fromBase64(value))
    return new SimpleBuffer(new TextEncoder().encode(`${value}`))
  }

  static byteLength(value) {
    return new TextEncoder().encode(`${value}`).byteLength
  }

  toString(encoding = 'utf8') {
    if (encoding === 'base64') return toBase64(this)
    return new TextDecoder().decode(this)
  }
}

if (!globalThis.Buffer) {
  globalThis.Buffer = SimpleBuffer
}

window.path = window.path || {
  sep,
  delimiter: nodePlatform === 'win32' ? ';' : ':',
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve: resolvePath
}

window.process = window.process || {
  platform: nodePlatform,
  env: {
    NODE_ENV: import.meta.env.DEV ? 'development' : 'production'
  },
  resourcesPath: '',
  versions: {}
}

export const MARKDOWN_INCLUSIONS = [
  '*.markdown',
  '*.mdown',
  '*.mkdn',
  '*.mkd',
  '*.md',
  '*.rmd',
  '*.qmd',
  '*.txt'
]

export const purePathUtils = {
  MARKDOWN_INCLUSIONS,
  hasMarkdownExtension: (filename) =>
    MARKDOWN_INCLUSIONS.some((pattern) => filename?.toLowerCase().endsWith(pattern.slice(1))),
  isSamePathSync: (a, b) => window.path.normalize(a).toLowerCase() === window.path.normalize(b).toLowerCase(),
  isChildOfDirectory: (dir, child) => {
    const rel = window.path.relative(dir, child)
    return !!rel && !rel.startsWith('..') && !window.path.isAbsolute(rel)
  },
  isImageFile: (filePath) => /\.(apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(filePath || '')
}
