<template>
  <div class="side-bar-ai">
    <div class="ai-header">
      <span class="title">AI Assistant</span>
      <div class="settings-toggle" @click="showSettings = !showSettings" title="Settings">
        <svg viewBox="0 0 1024 1024" aria-hidden="true" width="16" height="16">
          <path d="M512 85.333333c-235.648 0-426.666667 191.018667-426.666667 426.666667s191.018667 426.666667 426.666667 426.666667 426.666667-191.018667 426.666667-426.666667-191.018667-426.666667-426.666667-426.666667z m0 768c-188.501333 0-341.333333-152.832-341.333333-341.333333s152.832-341.333333 341.333333-341.333333 341.333333 152.832 341.333333 341.333333-152.832 341.333333-341.333333 341.333333z" fill="currentColor"/>
          <path d="M512 341.333333a170.666667 170.666667 0 1 0 0 341.333334 170.666667 170.666667 0 0 0 0-341.333334z m0 256a85.333333 85.333333 0 1 1 0-170.666666 85.333333 85.333333 0 0 1 0 170.666666z" fill="currentColor"/>
        </svg>
      </div>
    </div>

    <!-- Settings Panel -->
    <div class="ai-settings" v-show="showSettings">
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
      <button class="button-primary save-btn" @click="saveConfig">Save Config</button>
    </div>

    <!-- Chat Area -->
    <div class="chat-container" v-show="!showSettings">
      <div class="chat-messages" ref="chatList">
        <div v-if="!currentChatHistory.length" class="empty-chat">
          <p>No conversation yet. Start chatting below!</p>
        </div>
        <div
          v-for="(msg, index) in currentChatHistory"
          :key="index"
          :class="['chat-bubble', msg.role === 'user' ? 'user' : 'assistant']"
        >
          <div class="msg-content">{{ msg.content }}</div>
          <div v-if="msg.role === 'assistant'" class="msg-actions">
            <button class="action-btn" @click="applyChanges(msg.content)">Apply Change</button>
          </div>
        </div>
        <div v-if="isWaiting" class="chat-bubble assistant waiting">
          <span>AI is thinking...</span>
        </div>
      </div>

      <div class="chat-input-area">
        <textarea
          v-model="inputMsg"
          placeholder="Ask AI to modify content..."
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        <button class="send-btn" :disabled="!inputMsg.trim() || isWaiting" @click="sendMessage">
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'AiAssistant',
  data () {
    return {
      showSettings: false,
      config: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-3.5-turbo'
      },
      inputMsg: '',
      isWaiting: false,
      chatHistories: {} // Map: fileId -> [{role, content}]
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
    }
  },
  mounted () {
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
    saveConfig () {
      localStorage.setItem('ai_assistant_config', JSON.stringify(this.config))
      this.showSettings = false
    },
    saveHistories () {
      localStorage.setItem('ai_assistant_histories', JSON.stringify(this.chatHistories))
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
        const response = await this.callAI(this.currentChatHistory)
        this.currentChatHistory.push({ role: 'assistant', content: response })
      } catch (err) {
        this.currentChatHistory.push({ role: 'assistant', content: 'Error: ' + err.message })
      } finally {
        this.isWaiting = false
        this.saveHistories()
        this.scrollToBottom()
      }
    },
    async callAI (messages) {
      // Very basic implementation using fetch, compatible with OpenAI format
      let url = this.config.baseUrl
      if (!url.endsWith('/chat/completions')) {
        url = url.replace(/\/$/, '') + '/chat/completions'
      }

      const payload = {
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
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
      return data.choices[0].message.content
    },
    applyChanges (content) {
      // 提取想要修改的逻辑，目前先仅作 console 提示，防止修改 MarkText 核心逻辑
      console.log('AI proposes change:', content)
      // 这里应该调用底层的方法或者 vuex 的 dispatch 来更新特定的行
      // 但是要求中提到：“与编辑器耦合的部分如果要修改MarkText的原有代码就先不要做，先告诉我”
      alert('尝试替换文本。目前仅为占位功能，由于不希望直接修改核心接口，这里仅作弹窗演示。')
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
  }

  .ai-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid var(--floatBorderColor);
    font-size: 14px;
    font-weight: 600;
  }

  .settings-toggle {
    cursor: pointer;
    opacity: 0.7;
  }
  .settings-toggle:hover {
    opacity: 1;
    color: var(--themeColor);
  }

  .ai-settings {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .setting-item label {
    font-size: 12px;
    color: var(--sideBarColor);
  }

  .setting-item input {
    height: 28px;
    padding: 0 8px;
    border-radius: 4px;
    border: 1px solid var(--floatBorderColor);
    background: var(--inputBgColor);
    color: var(--sideBarColor);
    outline: none;
  }

  .setting-item input:focus {
    border-color: var(--themeColor);
  }

  .save-btn {
    margin-top: 10px;
    background: var(--themeColor);
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 6px 0;
    cursor: pointer;
  }

  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .chat-messages::-webkit-scrollbar:vertical {
    width: 8px;
  }

  .empty-chat {
    text-align: center;
    margin-top: 20px;
    font-size: 13px;
    opacity: 0.6;
  }

  .chat-bubble {
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.4;
    word-break: break-word;
  }

  .chat-bubble.user {
    align-self: flex-end;
    background: var(--themeColor);
    color: #fff;
    border-bottom-right-radius: 2px;
  }

  .chat-bubble.assistant {
    align-self: flex-start;
    background: var(--itemBgColor);
    border: 1px solid var(--floatBorderColor);
    border-bottom-left-radius: 2px;
  }
  .chat-bubble.waiting {
    opacity: 0.6;
    font-style: italic;
  }

  .msg-actions {
    margin-top: 6px;
    text-align: right;
  }

  .action-btn {
    background: var(--buttonBgColor, transparent);
    border: 1px solid var(--themeColor);
    color: var(--themeColor);
    padding: 2px 6px;
    font-size: 11px;
    border-radius: 4px;
    cursor: pointer;
  }
  .action-btn:hover {
    background: var(--themeColor);
    color: #fff;
  }

  .chat-input-area {
    padding: 10px;
    border-top: 1px solid var(--floatBorderColor);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chat-input-area textarea {
    height: 60px;
    resize: none;
    border: 1px solid var(--floatBorderColor);
    border-radius: 4px;
    background: var(--inputBgColor);
    color: var(--sideBarColor);
    padding: 8px;
    outline: none;
    font-size: 13px;
    font-family: inherit;
  }
  .chat-input-area textarea:focus {
    border-color: var(--themeColor);
  }

  .send-btn {
    align-self: flex-end;
    background: var(--themeColor);
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 12px;
  }
  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
