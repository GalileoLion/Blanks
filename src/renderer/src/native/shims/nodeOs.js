export const tmpdir = () => window.__blanksNative?.bootstrap?.tmpDir || '/tmp'
export const homedir = () => window.process?.env?.HOME || ''
export const platform = () => window.process?.platform || 'linux'

export default {
  tmpdir,
  homedir,
  platform
}
