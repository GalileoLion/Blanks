<template>
  <div class="ai-plugin-settings">
    <h3>AI Assistant Settings</h3>
    <p class="description">Configure your AI assistant and MCP servers.</p>
    
    <div class="setting-item">
      <label>Base URL</label>
      <input type="text" v-model="config.baseUrl" placeholder="https://api.openai.com/v1" />
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
      <textarea v-model="config.mcpServers" placeholder='[{"name":"server","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem"]}]'></textarea>
      <p class="hint">Configure MCP servers to give AI access to external tools.</p>
    </div>
    
    <button class="btn-primary" @click="saveConfig">Save Configuration</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const config = ref({
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  mcpServers: '[{"name":"everything","command":"npx","args":["-y","@modelcontextprotocol/server-everything"]}]'
})

onMounted(() => {
  const saved = localStorage.getItem('ai_assistant_config')
  if (saved) {
    try {
      config.value = Object.assign(config.value, JSON.parse(saved))
    } catch (e) {}
  }
})

const saveConfig = () => {
  localStorage.setItem('ai_assistant_config', JSON.stringify(config.value))
  alert('Configuration saved!')
}
</script>

<style scoped>
.ai-plugin-settings {
  padding: 20px;
  color: var(--sideBarColor);
}

h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.description {
  opacity: 0.7;
  font-size: 13px;
  margin-bottom: 20px;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
  opacity: 0.8;
}

.setting-item input,
.setting-item textarea {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--floatBorderColor);
  background: rgba(127,127,127,0.05);
  color: var(--sideBarColor);
  outline: none;
  font-size: 13px;
  box-sizing: border-box;
}

.setting-item textarea {
  min-height: 80px;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
}

.setting-item input:focus,
.setting-item textarea:focus {
  border-color: var(--themeColor);
}

.hint {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
}

.btn-primary {
  background: var(--themeColor);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.btn-primary:hover {
  opacity: 0.9;
}
</style>
