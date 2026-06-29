const write = (level, args) => {
  const fn = console[level] || console.log
  fn('[blanks]', ...args)
}

const log = {
  transports: {
    console: { level: 'info' },
    file: { level: false, resolvePathFn: null, sync: false }
  },
  initialize() {},
  errorHandler: {
    startCatching() {}
  },
  log: (...args) => write('log', args),
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
  debug: (...args) => write('debug', args),
  verbose: (...args) => write('debug', args),
  silly: (...args) => write('debug', args)
}

export default log
export const initialize = log.initialize
export const transports = log.transports
export const errorHandler = log.errorHandler
export const info = log.info
export const warn = log.warn
export const error = log.error
export const debug = log.debug
