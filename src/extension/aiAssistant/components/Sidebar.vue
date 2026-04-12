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
          <div v-if="item.type === 'tool'" class="tool-call-wrapper">
            <div v-show="expandedThoughtChains[item.toolCall.id] !== false" class="tool-call-expanded">
              <!-- Diff View for modify_document -->
              <div v-if="item.toolCall.function.name === 'modify_document'" class="diff-view">
                <div class="diff-pane combined" :class="parseToolArgs(item.toolCall).action">
                  <template v-if="parseToolArgs(item.toolCall).action === 'delete'">
                    <div class="diff-title" style="color: #d9534f;">Delete (Line {{ parseToolArgs(item.toolCall).startLine }})</div>
                    <pre class="diff-text delete-text"><code>- {{ getBeforeDiff(item.toolCall) }}</code></pre>
                  </template>
                  <template v-else-if="parseToolArgs(item.toolCall).action === 'add'">
                    <div class="diff-title" style="color: #5cb85c;">Add (Line {{ parseToolArgs(item.toolCall).startLine }})</div>
                    <pre class="diff-text add-text"><code>+ {{ getAfterDiff(item.toolCall) }}</code></pre>
                  </template>
                  <template v-else-if="parseToolArgs(item.toolCall).action === 'replace'">
                    <div class="diff-title" style="color: #f0ad4e;">Replace (Line {{ parseToolArgs(item.toolCall).startLine }})</div>
                    <pre class="diff-text delete-text"><code>- {{ getBeforeDiff(item.toolCall) }}</code></pre>
                    <div class="diff-divider"></div>
                    <pre class="diff-text add-text"><code>+ {{ getAfterDiff(item.toolCall) }}</code></pre>
                  </template>
                </div>
              </div>
              <!-- Raw JSON for other tools -->
              <div v-else class="raw-view">
                <pre><code>{{ item.toolCall.function.arguments }}</code></pre>
              </div>

              <!-- Tool Result if exists -->
              <div v-if="item.toolResult" class="tool-result-container">
                <div class="tool-result-header" @click="toggleToolResult(item.toolCall.id)">
                  <svg viewBox="0 0 24 24" width="12" height="12" :style="{ transform: expandedToolResults[item.toolCall.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }">
                    <path d="M8 5v14l11-7z" fill="currentColor"/>
                  </svg>
                  <span>Result</span>
                </div>
                <div v-show="expandedToolResults[item.toolCall.id]" class="tool-result-body">
                  {{ item.toolResult.content }}
                </div>
              </div>
            </div>

            <div class="tool-call-header-row">
              <div class="tool-call-header-main" @click="toggleThoughtChain(item.toolCall.id)">
                <svg viewBox="0 0 24 24" width="12" height="12" :style="{ transform: expandedThoughtChains[item.toolCall.id] !== false ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }">
                  <path d="M8 5v14l11-7z" fill="currentColor"/>
                </svg>
                <span class="tool-call-title">{{ getToolCallTitle(item.toolCall) }}</span>
              </div>
              <div class="tool-call-actions-mini" v-if="item.toolCall.status !== 'confirmed' && item.toolCall.status !== 'cancelled'">
                <button class="mini-btn confirm" :disabled="isWaiting" @click.stop="handleToolCall(item.toolCall, 'confirmed', item.msgRef)" title="Confirm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button class="mini-btn cancel" :disabled="isWaiting" @click.stop="handleToolCall(item.toolCall, 'cancelled', item.msgRef)" title="Cancel">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div class="tool-call-status-mini" v-else>
                <span :class="['status-icon', item.toolCall.status]" :title="item.toolCall.status === 'confirmed' ? 'Applied' : 'Cancelled'">
                  <svg v-if="item.toolCall.status === 'confirmed'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </span>
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

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/store/editor'
import bus from '@/bus'
import { mcpManager } from '../mcpClient.js'

const editorStore = useEditorStore()
const { currentFile } = storeToRefs(editorStore)

const showSettings = ref(false)
const mcpConnected = ref(false)
const mcpConnecting = ref(false)
const config = ref({
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  mcpServers: '[{"name":"everything","command":"npx","args":["-y","@modelcontextprotocol/server-everything"]}]'
})
const inputMsg = ref('')
const isWaiting = ref(false)
const chatHistories = ref({})
const expandedToolResults = ref({})
const expandedThoughtChains = ref({})
const chatList = ref(null)
const aiFaceText = ref(':AI')
const greetingText = ref('Ask AI to modify content...')

const currentFileId = computed(() => currentFile.value?.id || 'default')

const currentChatHistory = computed(() => {
  if (!chatHistories.value[currentFileId.value]) {
    chatHistories.value[currentFileId.value] = []
  }
  return chatHistories.value[currentFileId.value]
})

const displayChatHistory = computed(() => {
  const display = []
  const toolResultsMap = {}
  
  currentChatHistory.value.forEach(msg => {
    if (msg.role === 'tool' && msg.tool_call_id) {
      toolResultsMap[msg.tool_call_id] = msg
    }
  })

  currentChatHistory.value.forEach(msg => {
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
  })

  return display
})

const scrollToBottom = () => {
  nextTick(() => {
    const container = chatList.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

const connectMcp = async () => {
  if (mcpConnected.value || mcpConnecting.value) return
  mcpConnecting.value = true
  try {
    const serversConfig = JSON.parse(config.value.mcpServers || '[]')
    if (serversConfig.length > 0) {
      await mcpManager.connectAll(serversConfig)
    }
    mcpConnected.value = true
  } catch (e) {
    console.error('Failed to parse or connect MCP servers:', e)
  } finally {
    mcpConnecting.value = false
  }
}

const saveConfig = async () => {
  localStorage.setItem('ai_assistant_config', JSON.stringify(config.value))
  showSettings.value = false
  mcpConnected.value = false
  await connectMcp()
}

const saveHistories = () => {
  localStorage.setItem('ai_assistant_histories', JSON.stringify(chatHistories.value))
}

const clearChat = () => {
  if (confirm('Are you sure you want to clear chat history for the current file?')) {
    chatHistories.value[currentFileId.value] = []
    saveHistories()
    showSettings.value = false
  }
}

const parseToolArgs = (toolCall) => {
  try {
    return JSON.parse(toolCall.function.arguments)
  } catch (e) {
    return {}
  }
}

const getToolCallTitle = (toolCall) => {
  if (!toolCall || !toolCall.function) return 'Unknown Tool'
  const name = toolCall.function.name
  if (name === 'modify_document') {
    const args = parseToolArgs(toolCall)
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
}

const getBeforeDiff = (toolCall) => {
  if (toolCall.function.name !== 'modify_document') return ''
  const args = parseToolArgs(toolCall)
  if (args.action === 'add') return '(No previous content, inserting below...)'
  const md = currentFile.value ? currentFile.value.markdown : ''
  if (typeof md !== 'string') return ''
  const lines = md.split('\n')
  const startLine = Math.max(0, parseInt(args.startLine || 1) - 1)
  const endLine = Math.max(startLine, parseInt(args.endLine || args.startLine || 1) - 1)
  const deleteCount = endLine - startLine + 1
  const deletedLines = lines.slice(startLine, startLine + deleteCount)
  return deletedLines.join('\n')
}

const getAfterDiff = (toolCall) => {
  if (toolCall.function.name !== 'modify_document') return ''
  const args = parseToolArgs(toolCall)
  if (args.action === 'delete') return '(Content deleted)'
  return args.content || ''
}

const sendMessage = async () => {
  const msg = inputMsg.value.trim()
  if (!msg || isWaiting.value) return

  inputMsg.value = ''
  currentChatHistory.value.push({ role: 'user', content: msg })
  saveHistories()
  scrollToBottom()

  if (!config.value.apiKey) {
    currentChatHistory.value.push({ role: 'assistant', content: 'Please configure your API Key in settings first.' })
    saveHistories()
    return
  }

  isWaiting.value = true
  try {
    await connectMcp()
    const responseMessage = await callAI(currentChatHistory.value)
    if (responseMessage.tool_calls) {
      responseMessage.tool_calls.forEach(call => {
        call.status = 'pending'
      })
    }
    currentChatHistory.value.push(responseMessage)
  } catch (err) {
    currentChatHistory.value.push({ role: 'assistant', content: 'Error: ' + err.message, isError: true })
  } finally {
    isWaiting.value = false
    saveHistories()
    scrollToBottom()
  }
}

const callAI = async (messages) => {
  let url = config.value.baseUrl
  if (!url.endsWith('/chat/completions')) {
    url = url.replace(/\/$/, '') + '/chat/completions'
  }

  let docContext = ''
  if (currentFile.value && typeof currentFile.value.markdown === 'string') {
    const numberedLines = currentFile.value.markdown.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n')
    const truncated = numberedLines.length > 30000 ? numberedLines.substring(0, 30000) + '\n... (truncated)' : numberedLines
    docContext = `\n\n--- CURRENT DOCUMENT CONTENT WITH LINE NUMBERS ---\n${truncated}\n--- END OF DOCUMENT ---\n`
  }

  const systemPrompt = {
    role: 'system',
    content: `You are a powerful AI assistant integrated directly into the MarkText Markdown editor.
YOU HAVE FULL ACCESS TO TOOLS. You MUST use the provided tools to interact with the environment and modify documents. NEVER say you cannot use tools.
If the user wants to modify the document, DO NOT rewrite the entire document. Use the 'modify_document' tool to perform 'add', 'replace', or 'delete' actions on specific lines ONLY. DO NOT output the full modified document in text.
When calling a tool, provide ONLY the required arguments and necessary result text. DO NOT output redundant text, explanations, or the rest of the conversation content in your response before or after the tool call.
You also have access to external MCP tools. Use them proactively when requested to gather context or perform tasks. Keep your textual responses extremely concise.
CRITICAL RULE: If a tool call fails, errors, or is cancelled by the user, DO NOT attempt to call ANY tool again immediately. Explain the situation and WAIT for new instructions from the user.` + docContext
  }

  const validMessages = messages.filter(m => !m.isError)

  const initiatedIds = new Set()
  validMessages.forEach(m => {
    if (m.role === 'assistant' && m.tool_calls) {
      m.tool_calls.forEach(tc => initiatedIds.add(tc.id))
    }
  })

  const answeredIds = new Set()
  validMessages.forEach(m => {
    if (m.role === 'tool' && m.tool_call_id) {
      answeredIds.add(m.tool_call_id)
    }
  })

  const validToolCallIds = new Set([...initiatedIds].filter(id => answeredIds.has(id)))

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
        if (m.name) cleanM.name = m.name
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
      name: 'get_document_info',
      description: 'Get document metadata: total line count and character count.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_document',
      description: 'Read document content. Can read specific lines or the entire document.',
      parameters: {
        type: 'object',
        properties: {
          startLine: { type: 'number', description: 'Starting line number (1-indexed). If omitted, starts from line 1.' },
          endLine: { type: 'number', description: 'Ending line number (1-indexed, inclusive). If omitted, reads to the end.' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'modify_document',
      description: 'Modify the document by adding, replacing, or deleting specific lines.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'replace', 'delete'] },
          startLine: { type: 'number', description: 'The starting line number (1-indexed) to modify. For "add", it inserts after this line.' },
          endLine: { type: 'number', description: 'The ending line number (1-indexed, inclusive) to replace or delete. Not needed for "add".' },
          content: { type: 'string', description: 'The EXACT markdown snippet to insert or replace. ONLY include the changed lines, NEVER the full document. Empty for "delete".' }
        },
        required: ['action', 'startLine']
      }
    }
  }
]

  const mcpTools = mcpManager.getOpenAITools()
  const tools = [...baseTools, ...mcpTools]

  const payload = {
    model: config.value.model,
    messages: [systemPrompt, ...cleanMessages]
  }
  if (tools.length > 0) {
    payload.tools = tools
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.value.apiKey}`
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errorData = await res.text()
    throw new Error(errorData || res.statusText)
  }

  const data = await res.json()
  return data.choices[0].message
}

const handleToolCall = async (toolCall, action, msg) => {
  toolCall.status = action
  saveHistories()

  const toolName = toolCall.function.name
  const args = parseToolArgs(toolCall)

  if (action === 'confirmed') {
    // Handle built-in tools
    if (toolName === 'modify_document') {
      console.log('User confirmed action:', args)
      try {
        let currentMarkdown = currentFile.value ? currentFile.value.markdown : ''
        if (typeof currentMarkdown !== 'string') {
          throw new Error('No valid document is open.')
        }

        let lines = currentMarkdown.split('\n')
        const actionType = args.action
        const startLine = Math.max(0, parseInt(args.startLine || 1) - 1)
        const endLine = Math.max(startLine, parseInt(args.endLine || args.startLine || 1) - 1)
        const deleteCount = endLine - startLine + 1
        const insertContent = typeof args.content === 'string' ? args.content : ''
        const insertLines = insertContent.length > 0 ? insertContent.split('\n') : []

        if (actionType === 'delete') {
          lines.splice(startLine, deleteCount)
        } else if (actionType === 'replace') {
          lines.splice(startLine, deleteCount, ...insertLines)
        } else if (actionType === 'add') {
          lines.splice(startLine + 1, 0, ...insertLines)
        }

        const newMarkdown = lines.join('\n')
        bus.emit('file-changed', { id: currentFileId.value, markdown: newMarkdown, renderCursor: true })

        currentChatHistory.value.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: 'Document modification confirmed and executed successfully.'
        })
      } catch (err) {
        currentChatHistory.value.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: `Error modifying document: ${err.message}`
        })
      }
      saveHistories()
    } else if (toolName === 'read_document') {
      try {
        let currentMarkdown = currentFile.value ? currentFile.value.markdown : ''
        if (typeof currentMarkdown !== 'string') {
          throw new Error('No valid document is open.')
        }

        const lines = currentMarkdown.split('\n')
        const startLine = args.startLine ? Math.max(1, parseInt(args.startLine)) : 1
        const endLine = args.endLine ? Math.min(lines.length, parseInt(args.endLine)) : lines.length
        
        const selectedLines = lines.slice(startLine - 1, endLine)
        const result = selectedLines.map((l, i) => `${startLine + i}: ${l}`).join('\n')

        currentChatHistory.value.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: `Lines ${startLine}-${endLine}:\n${result}`
        })
      } catch (err) {
        currentChatHistory.value.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: `Error reading document: ${err.message}`
        })
      }
      saveHistories()
    } else if (toolName === 'get_document_info') {
      try {
        let currentMarkdown = currentFile.value ? currentFile.value.markdown : ''
        if (typeof currentMarkdown !== 'string') {
          throw new Error('No valid document is open.')
        }

        const lines = currentMarkdown.split('\n')
        const totalLines = lines.length
        const totalChars = currentMarkdown.length
        const fileName = currentFile.value?.name || 'Untitled'

        currentChatHistory.value.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: JSON.stringify({
            fileName,
            totalLines,
            totalChars,
            isEmpty: totalChars === 0
          })
        })
      } catch (err) {
        currentChatHistory.value.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: `Error getting document info: ${err.message}`
        })
      }
      saveHistories()
    } else {
      // MCP Tool Call
      try {
        isWaiting.value = true
        const result = await mcpManager.callTool(toolName, args)
        let resultText = ''
        if (result.content && result.content.length > 0) {
          resultText = result.content.map(c => c.text).join('\n')
        } else {
          resultText = JSON.stringify(result)
        }
        currentChatHistory.value.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: resultText
        })
        saveHistories()
      } catch (e) {
        currentChatHistory.value.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: `Error: ${e.message}`
        })
        saveHistories()
      } finally {
        isWaiting.value = false
      }
    }
  } else if (action === 'cancelled') {
    currentChatHistory.value.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolName,
      content: 'User cancelled the tool execution.'
    })
    saveHistories()
  }

  if (msg && msg.tool_calls) {
    const allResolved = msg.tool_calls.every(tc => tc.status === 'confirmed' || tc.status === 'cancelled')
    if (allResolved) {
      await resumeChat()
    }
  } else {
    await resumeChat()
  }
}

const resumeChat = async () => {
  isWaiting.value = true
  try {
    const responseMessage = await callAI(currentChatHistory.value)
    if (responseMessage.tool_calls) {
      responseMessage.tool_calls.forEach(call => {
        call.status = 'pending'
      })
    }
    currentChatHistory.value.push(responseMessage)
  } catch (err) {
    currentChatHistory.value.push({ role: 'assistant', content: 'Error: ' + err.message, isError: true })
  } finally {
    isWaiting.value = false
    saveHistories()
    scrollToBottom()
  }
}

const toggleToolResult = (id) => {
  expandedToolResults.value[id] = !expandedToolResults.value[id]
}

const toggleThoughtChain = (id) => {
  const current = expandedThoughtChains.value[id] !== false
  expandedThoughtChains.value[id] = !current
}

onMounted(() => {
  const faces = [':ai', ':AI', ':aI', ':Ai']
  aiFaceText.value = faces[Math.floor(Math.random() * faces.length)]
  const greetings = ['Halo!!', 'Ciao!!', 'Hello!!', 'Hallo!!', 'Nǐ hǎo']
  greetingText.value = greetings[Math.floor(Math.random() * greetings.length)]

  const savedConfig = localStorage.getItem('ai_assistant_config')
  if (savedConfig) {
    try {
      config.value = Object.assign(config.value, JSON.parse(savedConfig))
    } catch (e) {}
  }
  const savedHistories = localStorage.getItem('ai_assistant_histories')
  if (savedHistories) {
    try {
      chatHistories.value = JSON.parse(savedHistories)
    } catch (e) {}
  }

  scrollToBottom()
})

onUnmounted(() => {
  mcpManager.closeAll()
})
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

.setting-item input, .setting-item textarea {
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

.setting-item input:focus, .setting-item textarea:focus {
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
}

.message-row.user {
  align-items: flex-end;
}

.message-row.assistant, .message-row.tool {
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

/* --- Tool Call (Notion Inline Block Style) --- */
.tool-call-wrapper {
  width: 100%;
  margin: 4px 0;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-call-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: rgba(127,127,127,0.05);
  border: 1px solid rgba(127,127,127,0.15);
  border-radius: 6px;
  padding: 6px 8px;
  width: 100%;
  box-sizing: border-box;
  transition: background 0.2s;
}
.tool-call-header-row:hover {
  background: rgba(127,127,127,0.08);
}

.tool-call-header-main {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  overflow: hidden;
  flex: 1;
  color: var(--sideBarColor);
  user-select: none;
}

.tool-call-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 500;
}

.tool-call-actions-mini {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.mini-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid rgba(127,127,127,0.2);
  background: var(--sideBarBgColor);
  color: var(--sideBarColor);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
  padding: 0;
}
.mini-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.mini-btn.confirm {
  color: var(--themeColor);
}
.mini-btn.confirm:not(:disabled):hover {
  background: var(--themeColor);
  color: #fff;
  border-color: var(--themeColor);
}
.mini-btn.cancel {
  color: #d9534f;
}
.mini-btn.cancel:not(:disabled):hover {
  background: #d9534f;
  color: #fff;
  border-color: #d9534f;
}

.tool-call-status-mini {
  flex-shrink: 0;
}
.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}
.status-icon.confirmed {
  color: var(--themeColor);
}
.status-icon.cancelled {
  color: #d9534f;
}

.tool-call-expanded {
  margin-left: 8px;
  padding-left: 12px;
  border-left: 2px solid rgba(127,127,127,0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: calc(100% - 20px);
  box-sizing: border-box;
  margin-bottom: 6px;
  margin-top: 0;
}

/* Diff View for modifying documents */
.diff-view {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  overflow: hidden;
}

.diff-pane {
  background: rgba(127,127,127,0.05);
  border-radius: 6px;
  padding: 8px;
  border: 1px solid rgba(127,127,127,0.1);
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

.diff-title {
  font-size: 10px;
  opacity: 0.6;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.diff-pane pre, .raw-view pre {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
  color: var(--sideBarColor);
  opacity: 0.9;
}

.diff-text {
  padding: 4px 6px;
  border-radius: 4px;
  display: block;
  overflow-x: hidden;
}
.delete-text {
  background: rgba(217, 83, 79, 0.15);
  color: #d9534f !important;
}
.add-text {
  background: rgba(92, 184, 92, 0.15);
  color: #5cb85c !important;
}
.diff-divider {
  height: 1px;
  background: rgba(127, 127, 127, 0.2);
  margin: 6px 0;
}

.raw-view {
  background: rgba(127,127,127,0.05);
  border-radius: 6px;
  padding: 8px;
  border: 1px solid rgba(127,127,127,0.1);
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

/* Tool Results */
.tool-result-container {
  color: var(--sideBarColor);
  font-size: 12px;
  opacity: 0.85;
  margin-top: 4px;
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

/* --- Input Area (Notion style pill) --- */
.chat-input-area {
  padding: 12px 16px;
  background: var(--sideBarBgColor);
  position: relative;
  z-index: 2;
}

.chat-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0;
  background: var(--inputBgColor);
  border: 1px solid var(--floatBorderColor);
  border-radius: 18px;
  padding: 0;
  min-height: 36px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.chat-input-wrapper:focus-within {
  border-color: var(--themeColor);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.chat-input-wrapper .settings-toggle {
  padding: 0;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: var(--sideBarBgColor);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--themeColor);
  opacity: 0.8;
  transition: all 0.2s;
  box-sizing: border-box;
  margin: 0;
}
.chat-input-wrapper .settings-toggle:hover {
  opacity: 1;
  background: var(--itemBgColor);
}
.chat-input-wrapper .settings-toggle.face-btn .face-text {
  transform: rotate(90deg);
  font-family: Arial, Helvetica, sans-serif;
  font-weight: bold;
  font-size: 14px;
  letter-spacing: -0.5px;
  padding-bottom: 2px;
}

.chat-input-wrapper textarea {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--sideBarColor);
  outline: none;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  box-sizing: border-box;
  min-height: 34px;
  max-height: 120px;
  padding: 8px 6px;
  line-height: 18px;
  margin: 0;
}
.chat-input-wrapper textarea::placeholder {
  color: var(--sideBarColor);
  opacity: 0.4;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  background: var(--themeColor);
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  padding: 0;
  box-sizing: border-box;
  margin: 0;
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
