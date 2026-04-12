<template>
  <div class="pref-plugins">
    <h4>Plugins</h4>
    <p class="description">
      Manage your installed plugins. Enable or disable plugins as needed.
    </p>
    
    <div v-if="loading" class="loading">
      Loading plugins...
    </div>
    
    <div v-else-if="plugins.length === 0" class="empty">
      No plugins installed.
    </div>
    
    <div v-else class="plugin-list">
      <div 
        v-for="plugin in plugins" 
        :key="plugin.id"
        class="plugin-item"
        :class="{ enabled: plugin.enabled }"
      >
        <div class="plugin-header">
          <div class="plugin-info">
            <h5 class="plugin-name">{{ plugin.name }}</h5>
            <span class="plugin-version">v{{ plugin.version }}</span>
          </div>
          <el-switch
            v-model="plugin.enabled"
            @change="togglePlugin(plugin.id)"
            :loading="toggling[plugin.id]"
          />
        </div>
        
        <p class="plugin-description">{{ plugin.description }}</p>
        
        <div class="plugin-meta">
          <span v-if="plugin.author" class="plugin-author">by {{ plugin.author }}</span>
          <div class="plugin-features">
            <span v-if="plugin.hasSidebar" class="feature-tag" title="Has sidebar component">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
                <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" stroke-width="2"/>
              </svg>
              Sidebar
            </span>
            <span v-if="plugin.hasSettings" class="feature-tag" title="Has settings page">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" stroke-width="2"/>
              </svg>
              Settings
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { pluginManager } from '@extension/pluginManager'

const plugins = ref([])
const loading = ref(true)
const toggling = ref({})

onMounted(async () => {
  // 加载所有插件
  await pluginManager.loadPlugins()
  plugins.value = pluginManager.getAllPlugins()
  loading.value = false
})

const togglePlugin = async (pluginId) => {
  toggling.value[pluginId] = true
  
  try {
    pluginManager.togglePlugin(pluginId)
    // 更新本地状态
    const plugin = plugins.value.find(p => p.id === pluginId)
    if (plugin) {
      plugin.enabled = pluginManager.isPluginEnabled(pluginId)
    }
  } finally {
    toggling.value[pluginId] = false
  }
}
</script>

<style scoped>
.pref-plugins {
  & h4 {
    text-transform: uppercase;
    margin: 0 0 10px 0;
    font-weight: 400;
  }
  
  & .description {
    color: var(--editorColor50);
    font-size: 14px;
    margin-bottom: 20px;
  }
  
  & .loading, & .empty {
    padding: 40px;
    text-align: center;
    color: var(--editorColor50);
  }
  
  & .plugin-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  & .plugin-item {
    padding: 15px;
    border: 1px solid var(--editorColor10);
    border-radius: 4px;
    background: var(--editorBgColor);
    transition: all 0.2s;
    
    &.enabled {
      border-color: var(--themeColor);
      background: var(--themeColor05);
    }
    
    &:hover {
      border-color: var(--editorColor30);
    }
  }
  
  & .plugin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  & .plugin-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  & .plugin-name {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--editorColor);
  }
  
  & .plugin-version {
    font-size: 12px;
    color: var(--editorColor50);
    background: var(--editorColor10);
    padding: 2px 6px;
    border-radius: 3px;
  }
  
  & .plugin-description {
    margin: 0 0 10px 0;
    font-size: 13px;
    color: var(--editorColor70);
    line-height: 1.5;
  }
  
  & .plugin-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }
  
  & .plugin-author {
    color: var(--editorColor50);
  }
  
  & .plugin-features {
    display: flex;
    gap: 10px;
  }
  
  & .feature-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: var(--editorColor10);
    border-radius: 3px;
    color: var(--editorColor70);
    
    & svg {
      stroke-width: 2;
    }
  }
}
</style>
