<template>
  <div class="side-bar-ai">
    <!-- Settings Panel -->
    <div class="ai-settings" v-show="showSettings">
      <div class="settings-header">
        <span class="title">Settings</span>
        <div class="settings-toggle close" @click="showSettings = false" title="Close Settings">
          <svg viewBox="0 0 1024 1024" aria-hidden="true" width="16" height="16">
            <path d="M512 85.333333C276.362667 85.333333 85.333333 276.362667 85.333333 512s191.029333 426.666667 426.666667 426.666667 426.666667-191.029333 426.666667-426.666667S747.637333 85.333333 512 85.333333z m166.4 551.253334l-41.813333 41.813333L512 553.813333l-124.586667 124.586667-41.813333-41.813333L470.186667 512 345.6 387.413333l41.813333-41.813333L512 470.186667l124.586667-124.586667 41.813333 41.813333L553.813333 512l124.586667 124.586667z" fill="currentColor"/>
          </svg>
        </div>
      </div>
      <div class="setting-item">
        <label>Base URL</label>
        <input type="text" v-model="config.baseUrl" placeholder="e.g. https://api.openai.com/v1" />
      </div>
      <div class="setting-item">
        <label>API Key</label>
        <input type="password" v-model="config.apiKey" placeholder="sk-..." />
      </div>
      <div class="setting-item">
        <label>Model</label>
        <input type="text" v-model="config.model" placeholder="gpt-3.5-turbo" />
      </div>
      <div class="setting-item">
        <label>MCP Servers (JSON)</label>
        <textarea v-model="config.mcpServers" placeholder='[{"name":"my-server","command":"npx","args":["-y","@modelcontextprotocol/server-everything"]}]' style="height: 60px; font-family: monospace; font-size: 11px;"></textarea>
      </div>
      <button class="button-primary" @click="saveConfig">Save Config & Connect</button>
      <button class="button" @click="clearChat">Clear Chat History</button>
    </div>

    <!-- Chat Area -->
    <div class="chat-container" v-show="!showSettings">
      <div class="chat-messages" ref="chatList">
        <div v-if="!currentChatHistory.length" class="empty-chat">
          <p>No conversation yet. Start chatting below!</p>
        </div>
        <div
          v-for="(item, index) in displayChatHistory"
          :key="index"
          :class="['message-row', item.role]"
        >
          <!-- Normal Chat Bubble -->
          <div v-if="item.type === 'text'" :class="['chat-bubble', item.role]">
            {{ item.content }}
          </div>

          <!-- Individual Tool Call -->
          <div v-if="item.type === 'tool'" class="thought-chain-container">
            <div class="thought-chain-header" @click="toggleThoughtChain(item.toolCall.id)">
              <svg viewBox="0 0 24 24" width="12" height="12" :style="{ transform: expandedThoughtChains[item.toolCall.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
              <span>{{ getToolCallTitle(item.toolCall) }}</span>
            </div>

            <div v-show="expandedThoughtChains[item.toolCall.id]" class="thought-chain-body">
              <div class="tool-call-card">
                <div class="tool-call-info">
                  <div class="tool-call-body" v-if="item.toolCall.function.name === 'modify_document' && parseToolArgs(item.toolCall).content">
                    <pre><code>{{ parseToolArgs(item.toolCall).content }}</code></pre>
                  </div>
                  <div class="tool-call-body" v-else-if="item.toolCall.function.name !== 'modify_document'">
                    <pre><code>{{ item.toolCall.function.arguments }}</code></pre>
                  </div>
                </div>
                <div class="tool-call-actions">
                  <button
                    v-if="item.toolCall.status !== 'confirmed' && item.toolCall.status !== 'cancelled'"
                    class="action-btn cancel"
                    :disabled="isWaiting"
                    @click="handleToolCall(item.toolCall, 'cancelled', item.msgRef)"
                  >Cancel</button>
                  <button
                    v-if="item.toolCall.status !== 'confirmed' && item.toolCall.status !== 'cancelled'"
                    class="action-btn confirm"
                    :disabled="isWaiting"
                    @click="handleToolCall(item.toolCall, 'confirmed', item.msgRef)"
                  >Confirm</button>
                  <span v-if="item.toolCall.status === 'confirmed'" class="status-label confirmed">Applied</span>
                  <span v-if="item.toolCall.status === 'cancelled'" class="status-label cancelled">Cancelled</span>
                </div>
              </div>

              <!-- Render tool result if it exists -->
              <div v-if="item.toolResult" class="tool-result-container">
                <div class="tool-result-header" @click="toggleToolResult(item.toolCall.id)">
                  <svg viewBox="0 0 24 24" width="12" height="12" :style="{ transform: expandedToolResults[item.toolCall.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }">
                    <path d="M8 5v14l11-7z" fill="currentColor"/>
                  </svg>
                  <span>Result</span>
                </div>
                <div v-show="expandedToolResults[item.toolCall.id]" class="tool-result-body">
                  {{ item.toolResult.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isWaiting" class="message-row assistant">
          <div class="chat-bubble assistant waiting">
            <span>AI is thinking...</span>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div class="chat-input-wrapper">
          <div class="settings-toggle face-btn" @click="showSettings = true" title="Settings">
            <span class="face-text">{{ aiFaceText }}</span>
          </div>
          <textarea
            v-model="inputMsg"
            :placeholder="greetingText"
            @keydown.enter.exact.prevent="sendMessage"
            rows="1"
          ></textarea>
          <button class="send-btn" :disabled="!inputMsg.trim() || isWaiting" @click="sendMessage">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { mcpManager } from '../../util/mcpClient.js'
import bus from '../../bus'

export default {
  name: 'AiAssistant',
  filters: {
    uppercase (val) {
      return val ? val.toUpperCase() : ''
    }
  },
  data () {
    return {
      showSettings: false,
      mcpConnected: false,
      mcpConnecting: false,
      config: {
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        model: 'deepseek-chat',
        mcpServers: '[]'
      },
      inputMsg: '',
      isWaiting: false,
      chatHistories: {}, // Map: fileId -> [{role, content, tool_calls?}]
      expandedToolCalls: {},
      expandedToolResults: {},
      expandedThoughtChains: {},
      aiFaceText: ':AI',
      greetingText: 'Ask AI to modify content...'
    }
  },
  computed: {
    ...mapState({
      currentFile: state => state.editor.currentFile
    }),
    currentFileId () {
      return this.currentFile ? this.currentFile.id : 'default'
    },
    currentChatHistory () {
      if (!this.chatHistories[this.currentFileId]) {
        this.$set(this.chatHistories, this.currentFileId, [])
      }
      return this.chatHistories[this.currentFileId]
    },
    displayChatHistory () {
      const display = []

      const toolResultsMap = {}
      this.currentChatHistory.forEach(msg => {
        if (msg.role === 'tool' && msg.tool_call_id) {
          toolResultsMap[msg.tool_call_id] = msg
        }
      })

      this.currentChatHistory.forEach(msg => {
        if (msg.role === 'user') {
          display.push({ type: 'text', role: 'user', content: msg.content })
        } else if (msg.role === 'assistant') {
          if (msg.content) {
            display.push({ type: 'text', role: 'assistant', content: msg.content })
          }
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            msg.tool_calls.forEach(tc => {
              display.push({
                type: 'tool',
                role: 'assistant',
                toolCall: tc,
                toolResult: toolResultsMap[tc.id] || null,
                msgRef: msg
              })
            })
          }
        }
        // messages with role === 'tool' are skipped from pushing here
        // as they are nested inside their corresponding 'tool' type blocks
      })

      return display
    }
  },
  mounted () {
    const faces = [':ai', ':AI', ':aI', ':Ai']
    this.aiFaceText = faces[Math.floor(Math.random() * faces.length)]
    const greetings = ['Halo!!', 'Ciao!!', 'Hello!!', 'Hallo!!', 'Nǐ hǎo']
    this.greetingText = greetings[Math.floor(Math.random() * greetings.length)]

    const savedConfig = localStorage.getItem('ai_assistant_config')
    if (savedConfig) {
      try {
        this.config = Object.assign(this.config, JSON.parse(savedConfig))
      } catch (e) {}
    }
    const savedHistories = localStorage.getItem('ai_assistant_histories')
    if (savedHistories) {
      try {
        this.chatHistories = JSON.parse(savedHistories)
      } catch (e) {}
    }
  },
  methods: {
    async connectMcp () {
      if (this.mcpConnected || this.mcpConnecting) return
      this.mcpConnecting = true
      try {
        const serversConfig = JSON.parse(this.config.mcpServers || '[]')
        if (serversConfig.length > 0) {
          await mcpManager.connectAll(serversConfig)
        }
        this.mcpConnected = true
      } catch (e) {
        console.error('Failed to parse or connect MCP servers:', e)
      } finally {
        this.mcpConnecting = false
      }
    },
    async saveConfig () {
      localStorage.setItem('ai_assistant_config', JSON.stringify(this.config))
      this.showSettings = false
      this.mcpConnected = false
      await this.connectMcp()
    },
    saveHistories () {
      localStorage.setItem('ai_assistant_histories', JSON.stringify(this.chatHistories))
    },
    clearChat () {
      if (confirm('Are you sure you want to clear chat history for the current file?')) {
        this.$set(this.chatHistories, this.currentFileId, [])
        this.saveHistories()
        this.showSettings = false
      }
    },
    parseToolArgs (toolCall) {
      try {
        return JSON.parse(toolCall.function.arguments)
      } catch (e) {
        return {}
      }
    },
    getToolCallTitle (toolCall) {
      if (!toolCall || !toolCall.function) return 'Unknown Tool'
      const name = toolCall.function.name
      if (name === 'modify_document') {
        const args = this.parseToolArgs(toolCall)
        const action = args.action || 'edit'
        if (action === 'add') return `Add content after line ${args.startLine}`
        if (action === 'replace') {
          const end = args.endLine || args.startLine
          if (args.startLine === end) return `Replace line ${args.startLine}`
          return `Replace lines ${args.startLine} to ${end}`
        }
        if (action === 'delete') {
          const end = args.endLine || args.startLine
          if (args.startLine === end) return `Delete line ${args.startLine}`
          return `Delete lines ${args.startLine} to ${end}`
        }
      }
      return `Use tool: ${name}`
    },
    async sendMessage () {
      const msg = this.inputMsg.trim()
      if (!msg || this.isWaiting) return

      this.inputMsg = ''
      this.currentChatHistory.push({ role: 'user', content: msg })
      this.saveHistories()
      this.scrollToBottom()

      if (!this.config.apiKey) {
        this.currentChatHistory.push({ role: 'assistant', content: 'Please configure your API Key in settings first.' })
        this.saveHistories()
        return
      }

      this.isWaiting = true
      try {
        await this.connectMcp()
        const responseMessage = await this.callAI(this.currentChatHistory)
        // initialize status for tool calls
        if (responseMessage.tool_calls) {
          responseMessage.tool_calls.forEach(call => {
            call.status = 'pending'
          })
        }
        this.currentChatHistory.push(responseMessage)
      } catch (err) {
        this.currentChatHistory.push({ role: 'assistant', content: 'Error: ' + err.message, isError: true })
      } finally {
        this.isWaiting = false
        this.saveHistories()
        this.scrollToBottom()
      }
    },
    async callAI (messages) {
      let url = this.config.baseUrl
      if (!url.endsWith('/chat/completions')) {
        url = url.replace(/\/$/, '') + '/chat/completions'
      }

      let docContext = ''
      if (this.currentFile && typeof this.currentFile.markdown === 'string') {
        const numberedLines = this.currentFile.markdown.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n')
        // Truncate if insanely long to save tokens
        const truncated = numberedLines.length > 30000 ? numberedLines.substring(0, 30000) + '\n... (truncated)' : numberedLines
        docContext = `\n\n--- CURRENT DOCUMENT CONTENT WITH LINE NUMBERS ---\n${truncated}\n--- END OF DOCUMENT ---\n`
      }

      // Inject system prompt to enforce extreme conciseness and tool usage
      const systemPrompt = {
        role: 'system',
        content: `You are a powerful AI assistant integrated directly into the MarkText Markdown editor.
YOU HAVE FULL ACCESS TO TOOLS. You MUST use the provided tools to interact with the environment and modify documents. NEVER say you cannot use tools.
If the user wants to modify the document, DO NOT rewrite the entire document. Use the 'modify_document' tool to perform 'add', 'replace', or 'delete' actions on specific lines ONLY. DO NOT output the full modified document in text.
You also have access to external MCP tools. Use them proactively when requested to gather context or perform tasks. Keep your textual responses extremely concise.
CRITICAL RULE: If a tool call fails, errors, or is cancelled by the user, DO NOT attempt to call ANY tool again immediately. Explain the situation and WAIT for new instructions from the user.` + docContext
      }

      // Filter out tool specific internal state and API errors before sending
      const validMessages = messages.filter(m => !m.isError)

      // 1. Collect all initiated tool_call_ids
      const initiatedIds = new Set()
      validMessages.forEach(m => {
        if (m.role === 'assistant' && m.tool_calls) {
          m.tool_calls.forEach(tc => initiatedIds.add(tc.id))
        }
      })

      // 2. Collect all answered tool_call_ids
      const answeredIds = new Set()
      validMessages.forEach(m => {
        if (m.role === 'tool' && m.tool_call_id) {
          answeredIds.add(m.tool_call_id)
        }
      })

      // 3. Keep only intersection
      const validToolCallIds = new Set([...initiatedIds].filter(id => answeredIds.has(id)))

      // 4. Reconstruct clean message chain
      const cleanMessages = []
      for (const m of validMessages) {
        const cleanM = { role: m.role, content: m.content || '' }

        if (m.role === 'assistant') {
          if (m.tool_calls) {
            const validCalls = m.tool_calls.filter(tc => validToolCallIds.has(tc.id))
            if (validCalls.length > 0) {
              cleanM.tool_calls = validCalls.map(tc => ({
                id: tc.id,
                type: tc.type || 'function',
                function: { name: tc.function.name, arguments: tc.function.arguments }
              }))
            } else if (!cleanM.content) {
              cleanM.content = '(Tool calls omitted because they were aborted or incomplete)'
            }
          }
          cleanMessages.push(cleanM)
        } else if (m.role === 'tool') {
          if (validToolCallIds.has(m.tool_call_id)) {
            cleanM.tool_call_id = m.tool_call_id
            if (m.name) cleanM.name = m.name // Keep name for broader compatibility
            cleanMessages.push(cleanM)
          }
        } else {
          cleanMessages.push(cleanM)
        }
      }

      const baseTools = [
        {
          type: 'function',
          function: {
            name: 'modify_document',
            description: 'Modify the document by adding, replacing, or deleting lines.',
            parameters: {
              type: 'object',
              properties: {
                action: { type: 'string', enum: ['add', 'replace', 'delete'] },
                startLine: { type: 'number', description: 'The starting line number (1-indexed) to modify. For "add", it inserts after this line.' },
                endLine: { type: 'number', description: 'The ending line number (1-indexed, inclusive) to replace or delete. Not needed for "add".' },
                content: { type: 'string', description: 'The markdown content to add or replace. Empty for "delete".' }
              },
              required: ['action', 'startLine']
            }
          }
        }
      ]

      const mcpTools = mcpManager.getOpenAITools()
      const tools = [...baseTools, ...mcpTools]

      const payload = {
        model: this.config.model,
        messages: [systemPrompt, ...cleanMessages]
      }
      if (tools.length > 0) {
        payload.tools = tools
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.text()
        throw new Error(errorData || res.statusText)
      }

      const data = await res.json()
      return data.choices[0].message
    },
    async handleToolCall (toolCall, action, msg) {
      this.$set(toolCall, 'status', action)
      this.saveHistories()

      const toolName = toolCall.function.name
      const args = this.parseToolArgs(toolCall)

      if (action === 'confirmed') {
        if (toolName === 'modify_document') {
          console.log('User confirmed action:', args)

          try {
            let currentMarkdown = this.currentFile ? this.currentFile.markdown : ''
            if (typeof currentMarkdown !== 'string') {
              throw new Error('No valid document is open.')
            }

            let lines = currentMarkdown.split('\n')
            const actionType = args.action

            // startLine is 1-indexed in arguments
            const startLine = Math.max(0, parseInt(args.startLine || 1) - 1)
            // endLine is 1-indexed (inclusive). Default to startLine if omitted.
            const endLine = Math.max(startLine, parseInt(args.endLine || args.startLine || 1) - 1)

            const deleteCount = endLine - startLine + 1
            const insertContent = typeof args.content === 'string' ? args.content : ''
            const insertLines = insertContent.length > 0 ? insertContent.split('\n') : []

            if (actionType === 'delete') {
              lines.splice(startLine, deleteCount)
            } else if (actionType === 'replace') {
              lines.splice(startLine, deleteCount, ...insertLines)
            } else if (actionType === 'add') {
              // Add is typically inserting after the specified line
              lines.splice(startLine + 1, 0, ...insertLines)
            }

            const newMarkdown = lines.join('\n')
            bus.$emit('file-changed', { id: this.currentFileId, markdown: newMarkdown, renderCursor: true })

            this.currentChatHistory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: 'Document modification confirmed and executed successfully.'
            })
          } catch (err) {
            this.currentChatHistory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: `Error modifying document: ${err.message}`
            })
          }
          this.saveHistories()
        } else {
          // MCP Tool Call
          try {
            this.isWaiting = true
            const result = await mcpManager.callTool(toolName, args)
            // Extract text from MCP tool result
            let resultText = ''
            if (result.content && result.content.length > 0) {
              resultText = result.content.map(c => c.text).join('\n')
            } else {
              resultText = JSON.stringify(result)
            }

            this.currentChatHistory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: resultText
            })
            this.saveHistories()
          } catch (e) {
            this.currentChatHistory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: `Error: ${e.message}`
            })
            this.saveHistories()
          } finally {
            this.isWaiting = false
          }
        }
      } else if (action === 'cancelled') {
        this.currentChatHistory.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: 'User cancelled the tool execution.'
        })
        this.saveHistories()
      }

      if (msg && msg.tool_calls) {
        const allResolved = msg.tool_calls.every(tc => tc.status === 'confirmed' || tc.status === 'cancelled')
        if (allResolved) {
          await this.resumeChat()
        }
      } else {
        await this.resumeChat()
      }
    },
    async resumeChat () {
      this.isWaiting = true
      try {
        const responseMessage = await this.callAI(this.currentChatHistory)
        if (responseMessage.tool_calls) {
          responseMessage.tool_calls.forEach(call => {
            call.status = 'pending'
          })
        }
        this.currentChatHistory.push(responseMessage)
      } catch (err) {
        this.currentChatHistory.push({ role: 'assistant', content: 'Error: ' + err.message, isError: true })
      } finally {
        this.isWaiting = false
        this.saveHistories()
        this.scrollToBottom()
      }
    },
    toggleToolCall (id) {
      this.$set(this.expandedToolCalls, id, !this.expandedToolCalls[id])
    },
    toggleToolResult (id) {
      this.$set(this.expandedToolResults, id, !this.expandedToolResults[id])
    },
    toggleThoughtChain (id) {
      this.$set(this.expandedThoughtChains, id, !this.expandedThoughtChains[id])
    },
    scrollToBottom () {
      this.$nextTick(() => {
        const container = this.$refs.chatList
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    }
  }
}
</script>

<style scoped>
  .side-bar-ai {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: var(--sideBarColor);
    background: var(--sideBarBgColor);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
  }

  /* --- Settings Area --- */
  .ai-settings {
    padding: 30px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-bottom: 1px solid var(--floatBorderColor);
    box-shadow: 0 4px 6px -4px rgba(0,0,0,0.05);
    z-index: 2;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--sideBarTitleColor);
  }

  .settings-toggle {
    cursor: pointer;
    opacity: 0.5;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  .settings-toggle:hover {
    opacity: 1;
    background: rgba(127,127,127,0.1);
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .setting-item label {
    font-size: 12px;
    font-weight: 500;
    color: var(--sideBarColor);
    opacity: 0.8;
  }

  .setting-item input,
  .setting-item textarea {
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid var(--floatBorderColor);
    background: rgba(127,127,127,0.05);
    color: var(--sideBarColor);
    outline: none;
    font-size: 13px;
    font-family: inherit;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .setting-item textarea {
    resize: vertical;
    min-height: 60px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
  }

  .setting-item input:focus,
  .setting-item textarea:focus {
    border-color: var(--themeColor);
    background: var(--inputBgColor);
  }

  .button-primary {
    background: var(--themeColor);
    color: #fff;
    border: none;
    padding: 8px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .button-primary:hover {
    opacity: 0.9;
  }

  .button {
    background: rgba(127,127,127,0.1);
    color: var(--sideBarColor);
    border: 1px solid var(--floatBorderColor);
    padding: 8px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  .button:hover {
    background: rgba(127,127,127,0.2);
  }

  /* --- Chat Area --- */
  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    scroll-behavior: smooth;
  }
  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }
  .chat-messages::-webkit-scrollbar-thumb {
    background: rgba(127,127,127,0.2);
    border-radius: 3px;
  }

  .empty-chat {
    text-align: center;
    margin-top: 40px;
    font-size: 13px;
    color: var(--sideBarColor);
    opacity: 0.5;
  }

  .message-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 100%;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .message-row.user {
    align-items: flex-end;
  }

  .message-row.assistant,
  .message-row.tool {
    align-items: flex-start;
  }

  .chat-bubble {
    flex-shrink: 0;
    max-width: 90%;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
  }

  .chat-bubble.user {
    background: rgba(127,127,127,0.1);
    color: var(--sideBarColor);
    padding: 10px 14px;
    border-radius: 12px;
    border-bottom-right-radius: 4px;
  }

  .chat-bubble.assistant {
    background: transparent;
    border: none;
    color: var(--sideBarColor);
    padding: 2px 0;
    width: 100%;
    max-width: 100%;
  }

  .chat-bubble.waiting {
    opacity: 0.5;
    font-style: italic;
    font-size: 13px;
  }

  /* --- Thought Chain (Notion Toggle Style) --- */
  .thought-chain-container {
    width: 100%;
    margin: 2px 0;
    font-size: 13px;
  }

  .thought-chain-header {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border-radius: 4px;
    color: var(--sideBarColor);
    opacity: 0.7;
    cursor: pointer;
    user-select: none;
    font-weight: 500;
    transition: background 0.2s, opacity 0.2s;
  }
  .thought-chain-header:hover {
    background: rgba(127,127,127,0.1);
    opacity: 1;
  }

  .thought-chain-body {
    margin-top: 4px;
    margin-left: 10px;
    padding-left: 12px;
    border-left: 1px solid rgba(127,127,127,0.2);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* --- Tool Results & Calls --- */
  .tool-result-container {
    color: var(--sideBarColor);
    font-size: 12px;
    opacity: 0.85;
  }

  .tool-result-header {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 600;
    user-select: none;
  }
  .tool-result-header:hover {
    opacity: 0.8;
  }

  .tool-result-body {
    margin-top: 6px;
    max-height: 250px;
    overflow-y: auto;
    overflow-x: hidden;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    background: rgba(127,127,127,0.05);
    padding: 8px;
    border-radius: 6px;
    border: 1px solid rgba(127,127,127,0.1);
  }

  .msg-tool-calls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .tool-call-card {
    background: rgba(127,127,127,0.03);
    border: 1px solid rgba(127,127,127,0.1);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
  }

  .tool-call-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .tool-call-header {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--sideBarColor);
    font-weight: 600;
    user-select: none;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .tool-call-header:hover {
    opacity: 0.8;
  }

  .tool-call-body {
    width: 100%;
    color: var(--sideBarColor);
    opacity: 0.8;
    word-break: break-all;
    white-space: pre-wrap;
    background: rgba(127,127,127,0.05);
    padding: 6px 8px;
    border-radius: 4px;
  }
  .tool-call-body pre {
    margin: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
  }

  .tool-call-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .action-btn {
    background: rgba(127,127,127,0.1);
    border: 1px solid rgba(127,127,127,0.15);
    color: var(--sideBarColor);
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .action-btn.confirm {
    background: var(--themeColor);
    color: #fff;
    border-color: var(--themeColor);
  }
  .action-btn.confirm:hover {
    opacity: 0.9;
  }
  .action-btn.cancel:hover {
    background: rgba(217, 83, 79, 0.1);
    color: #d9534f;
    border-color: rgba(217, 83, 79, 0.3);
  }

  .status-label {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .status-label.confirmed {
    color: var(--themeColor);
    background: rgba(0, 180, 100, 0.1);
  }
  .status-label.cancelled {
    color: #d9534f;
    background: rgba(217, 83, 79, 0.1);
  }

  /* --- Input Area (Notion style pill) --- */
  .chat-input-area {
    padding: 16px;
    background: var(--sideBarBgColor);
    position: relative;
    z-index: 2;
  }

  .chat-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--inputBgColor);
    border: 1px solid var(--floatBorderColor);
    border-radius: 20px;
    padding: 6px 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .chat-input-wrapper:focus-within {
    border-color: var(--themeColor);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  .chat-input-wrapper .settings-toggle {
    padding: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--floatBorderColor);
    background: var(--sideBarBgColor);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--themeColor);
    opacity: 0.8;
    transition: all 0.2s;
  }
  .chat-input-wrapper .settings-toggle:hover {
    opacity: 1;
    background: var(--itemBgColor);
    border-color: var(--themeColor);
  }
  .chat-input-wrapper .settings-toggle.face-btn .face-text {
    transform: rotate(90deg);
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bold;
    font-size: 13px;
    letter-spacing: -0.5px;
    padding-bottom: 1px;
  }

  .chat-input-wrapper textarea {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--sideBarColor);
    outline: none;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    min-height: 24px;
    max-height: 120px;
    padding: 4px 0;
    line-height: 1.4;
  }
  .chat-input-wrapper textarea::placeholder {
    color: var(--sideBarColor);
    opacity: 0.4;
  }

  .send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--themeColor);
    color: #fff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    padding: 0;
  }
  .send-btn:disabled {
    background: rgba(127,127,127,0.2);
    color: var(--sideBarColor);
    opacity: 0.5;
    cursor: not-allowed;
  }
  .send-btn:not(:disabled):active {
    transform: scale(0.95);
  }
</style>
