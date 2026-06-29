import { defineStore } from 'pinia'
import log from 'electron-log'
import bus from '../bus'
import staticCommands, { RootCommand, getCommandsWithDescriptions } from '../commands'
import { isEqualAccelerator } from 'common/keybinding'
import { getAcceleratorFromKeyboardEvent, isCompositionEvent } from '@/util/accelerator'

let shortcutKeydownHandler = null

export const useCommandCenterStore = defineStore('commandCenter', {
  state: () => ({
    rootCommand: new RootCommand(staticCommands)
  }),
  actions: {
    REGISTER_COMMAND(command) {
      this.rootCommand.subcommands.push(command)
    },
    SORT_COMMANDS() {
      this.rootCommand.subcommands.sort((a, b) => a.description.localeCompare(b.description))
    },
    async LISTEN_COMMAND_CENTER_BUS() {
      this.rootCommand.subcommands = await getCommandsWithDescriptions()
      this.SORT_COMMANDS()

      // Listen for language changes and initialize/update command descriptions
      bus.on('language-changed', async () => {
        // Update all command descriptions when language changes
        this.rootCommand.subcommands = await getCommandsWithDescriptions()
        this.SORT_COMMANDS()
      })

      // Init stuff
      bus.on('cmd::sort-commands', () => {
        this.SORT_COMMANDS()
      })
      window.electron.ipcRenderer.on('mt::keybindings-response', (e, keybindingMap) => {
        const { subcommands } = this.rootCommand
        for (const entry of subcommands) {
          const value = keybindingMap[entry.id]
          if (value) {
            entry.accelerator = value
            entry.shortcut = normalizeAccelerator(value)
          } else {
            entry.accelerator = ''
            entry.shortcut = null
          }
        }
        registerShortcutListener(this)
      })

      // Register commands that are created at runtime.
      bus.on('cmd::register-command', (command) => {
        this.REGISTER_COMMAND(command)
      })

      // Allow other compontents to execute commands with predefined values.
      bus.on('cmd::execute', (commandId) => {
        executeCommand(this, commandId)
      })
      window.electron.ipcRenderer.on('mt::execute-command-by-id', (e, commandId) => {
        executeCommand(this, commandId)
      })
    }
  }
})

const executeCommand = (store, commandId) => {
  const command = findCommandById(store.rootCommand.subcommands, commandId)
  if (!command) {
    const errorMsg = `Cannot execute command "${commandId}" because it's missing.`
    log.error(errorMsg)
    throw new Error(errorMsg)
  }
  command.execute()
}

const findCommandById = (commands, commandId) => {
  for (const command of commands) {
    if (command.id === commandId) return command
    if (command.subcommands) {
      const child = findCommandById(command.subcommands, commandId)
      if (child) return child
    }
  }
  return null
}

const findCommandByAccelerator = (commands, accelerator) => {
  for (const command of commands) {
    if (command.accelerator && isEqualAccelerator(command.accelerator, accelerator)) {
      return command
    }
    if (command.subcommands) {
      const child = findCommandByAccelerator(command.subcommands, accelerator)
      if (child) return child
    }
  }
  return null
}

const EDITABLE_TARGET_SELECTOR = [
  '.key-input-dialog',
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[role="textbox"]',
  '.CodeMirror',
  '.editor-wrapper',
  '.editor-component',
  '#ag-editor-id',
  '.ag-paragraph',
  '.ag-paragraph-content'
].join(',')

const EDITING_CONTROL_KEYS = new Set([
  'Enter',
  'Tab',
  'Backspace',
  'Delete',
  ' ',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight'
])

const isEditableTarget = (target) => Boolean(target?.closest?.(EDITABLE_TARGET_SELECTOR))

const shouldBypassEditorKey = (event) => {
  if (!isEditableTarget(event.target)) return false
  if (EDITING_CONTROL_KEYS.has(event.key)) return true
  return !event.metaKey && !event.ctrlKey && !event.altKey
}

const isEditingShortcut = (event) => {
  const target = event.target
  return shouldBypassEditorKey(event) || Boolean(target?.closest?.('.key-input-dialog'))
}

const registerShortcutListener = (store) => {
  if (shortcutKeydownHandler) return
  shortcutKeydownHandler = (event) => {
    if (event.defaultPrevented || isCompositionEvent(event) || isEditingShortcut(event)) return
    const { accelerator, isValid } = getAcceleratorFromKeyboardEvent(event)
    if (!isValid) return

    const command = findCommandByAccelerator(store.rootCommand.subcommands, accelerator)
    if (!command?.execute) return

    event.preventDefault()
    event.stopPropagation()
    command.execute()
  }
  window.addEventListener('keydown', shortcutKeydownHandler, true)
}

const normalizeAccelerator = (acc) => {
  try {
    return acc
      .replace(/cmdorctrl|cmd/i, 'Cmd')
      .replace(/ctrl/i, 'Ctrl')
      .split('+')
  } catch (_) {
    return [acc]
  }
}
