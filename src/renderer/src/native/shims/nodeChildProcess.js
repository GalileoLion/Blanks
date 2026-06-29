class MiniEmitter {
  constructor() {
    this.listeners = new Map()
  }

  on(event, listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(listener)
    return this
  }

  emit(event, ...args) {
    for (const listener of this.listeners.get(event) || []) listener(...args)
  }
}

const runCommand = (program, args = [], options = {}) =>
  window.__blanksNative?.invoke?.('exec_command', {
    program,
    args,
    cwd: options.cwd || '',
    env: options.env || {}
  })

export const exec = (command, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  const [program, ...args] = command.split(/\s+/).filter(Boolean)
  runCommand(program, args, options || {})
    .then((result) => callback?.(null, result.stdout || '', result.stderr || ''))
    .catch((error) => callback?.(error))
}

export const execFile = (program, args = [], options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  runCommand(program, args, options || {})
    .then((result) => callback?.(null, result.stdout || '', result.stderr || ''))
    .catch((error) => callback?.(error))
}

export const spawn = (program, args = [], options = {}) => {
  const child = new MiniEmitter()
  child.stdout = new MiniEmitter()
  child.stderr = new MiniEmitter()
  child.kill = () => {
    child.emit('close', null, 'SIGTERM')
  }

  runCommand(program, args, options)
    .then((result) => {
      if (result.stdout) child.stdout.emit('data', result.stdout)
      if (result.stderr) child.stderr.emit('data', result.stderr)
      child.emit('close', result.status || 0, null)
    })
    .catch((error) => child.emit('error', error))

  return child
}

export default {
  exec,
  execFile,
  spawn
}
