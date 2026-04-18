// MCP Client for AI Assistant Plugin
// Since nodeIntegration is enabled, we can use child_process directly in renderer

import { spawn } from 'child_process'

class McpClient {
  constructor(name, command, args, env) {
    this.name = name
    this.command = command
    this.args = args
    this.env = env
    this.process = null
    this.messageId = 1
    this.pendingRequests = new Map()
    this.tools = []
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.process = spawn(this.command, this.args, {
          env: { ...process.env, ...this.env },
          stdio: ['pipe', 'pipe', 'inherit']
        })

        let buffer = ''
        this.process.stdout.on('data', (data) => {
          buffer += data.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop()
          for (const line of lines) {
            if (line.trim()) {
              this.handleMessage(JSON.parse(line.trim()))
            }
          }
        })

        this.process.on('error', (err) => {
          console.error(`[MCP ${this.name}] Error:`, err)
          reject(err)
        })

        this.process.on('exit', (code) => {
          console.log(`[MCP ${this.name}] Exited with code ${code}`)
          for (const [, { reject: r }] of this.pendingRequests) {
            r(new Error('Process exited'))
          }
          this.pendingRequests.clear()
        })

        this.sendRequest('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'blanks-client', version: '1.0.0' }
        }).then(async () => {
          await this.sendNotification('notifications/initialized', {})
          const toolsRes = await this.sendRequest('tools/list', {})
          this.tools = (toolsRes.tools || []).map(t => ({
            ...t,
            _serverName: this.name
          }))
          resolve()
        }).catch(reject)
      } catch (err) {
        reject(err)
      }
    })
  }

  handleMessage(msg) {
    if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
      const { resolve, reject } = this.pendingRequests.get(msg.id)
      this.pendingRequests.delete(msg.id)
      if (msg.error) {
        reject(msg.error)
      } else {
        resolve(msg.result)
      }
    }
  }

  sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++
      const msg = { jsonrpc: '2.0', id, method, params }
      this.pendingRequests.set(id, { resolve, reject })
      this.process.stdin.write(JSON.stringify(msg) + '\n')
    })
  }

  sendNotification(method, params) {
    const msg = { jsonrpc: '2.0', method, params }
    this.process.stdin.write(JSON.stringify(msg) + '\n')
    return Promise.resolve()
  }

  close() {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
  }
}

export class McpManager {
  constructor() {
    this.clients = new Map()
  }

  async connectAll(serversConfig) {
    for (const client of this.clients.values()) {
      client.close()
    }
    this.clients.clear()

    if (!Array.isArray(serversConfig)) return

    for (const config of serversConfig) {
      if (!config.name || !config.command) continue
      const client = new McpClient(config.name, config.command, config.args || [], config.env || {})
      try {
        await client.connect()
        this.clients.set(config.name, client)
        console.log(`Connected to MCP server: ${config.name}`)
      } catch (e) {
        console.error(`Failed to connect to MCP server ${config.name}:`, e)
      }
    }
  }

  getTools() {
    let allTools = []
    for (const client of this.clients.values()) {
      allTools.push(...client.tools)
    }
    return allTools
  }

  getOpenAITools() {
    return this.getTools().map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description || '',
        parameters: t.inputSchema || { type: 'object', properties: {} }
      }
    }))
  }

  async callTool(name, args) {
    const tool = this.getTools().find(t => t.name === name)
    if (!tool) throw new Error(`Tool ${name} not found`)

    const client = this.clients.get(tool._serverName)
    if (!client) throw new Error(`Server ${tool._serverName} not connected`)

    const res = await client.sendRequest('tools/call', {
      name,
      arguments: args
    })
    return res
  }

  closeAll() {
    for (const client of this.clients.values()) {
      client.close()
    }
    this.clients.clear()
  }
}

export const mcpManager = new McpManager()
