const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta'])
const FUNCTION_KEY_RE = /^F([1-9]|1\d|2[0-4])$/

export const isCompositionEvent = (event) =>
  event?.isComposing || event?.key === 'Process' || event?.keyCode === 229

const normalizeKey = (event) => {
  const { key = '', code = '' } = event
  if (!key || MODIFIER_KEYS.has(key)) return ''
  if (FUNCTION_KEY_RE.test(key)) return key

  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)

  const namedKeys = {
    ' ': 'Space',
    Escape: 'Esc',
    Enter: 'Enter',
    Tab: 'Tab',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right'
  }
  if (namedKeys[key]) return namedKeys[key]

  const punctuationByCode = {
    Backquote: '`',
    Minus: key === '_' ? '_' : '-',
    Equal: key === '+' ? 'Plus' : '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/'
  }
  if (punctuationByCode[code]) return punctuationByCode[code]

  if (key.length === 1) {
    if (key === '+') return 'Plus'
    return key.toUpperCase()
  }
  return key
}

const hasRequiredModifier = (event, key) => {
  if (FUNCTION_KEY_RE.test(key)) return true
  if (['Esc', 'Enter', 'Tab'].includes(key)) return event.ctrlKey || event.metaKey || event.altKey
  return event.ctrlKey || event.metaKey || event.altKey
}

export const getAcceleratorFromKeyboardEvent = (event) => {
  const key = normalizeKey(event)
  const parts = []
  if (event.metaKey) parts.push('Command')
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (key) parts.push(key)

  const accelerator = parts.join('+')
  return {
    accelerator,
    isValid: Boolean(key) && hasRequiredModifier(event, key)
  }
}

export const isValidAccelerator = (accelerator) => {
  if (typeof accelerator !== 'string' || !accelerator.trim()) return false
  const parts = accelerator.split('+').filter(Boolean)
  const key = parts[parts.length - 1]
  if (!key || ['Command', 'Cmd', 'Ctrl', 'Control', 'Alt', 'Option', 'Shift', 'Meta'].includes(key)) {
    return false
  }
  return parts.length > 1 || FUNCTION_KEY_RE.test(key)
}
