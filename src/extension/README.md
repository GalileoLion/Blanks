# MarkText+ Plugin System

## 插件结构

每个插件是一个独立的文件夹，放在 `src/extension/` 目录下。

```
src/extension/
├── myPlugin/                    # 插件文件夹名称
│   ├── index.js                 # 插件入口文件（必需）
│   ├── icon.svg                 # 插件图标（侧边栏按钮用）
│   ├── components/              # 组件目录
│   │   └── Sidebar.vue          # 侧边栏组件（可选）
│   └── settings/                # 设置页面目录
│       └── Settings.vue         # 设置页面组件（可选）
```

## 插件入口文件 (index.js)

```javascript
import MyIcon from './icon.svg'
import SidebarComponent from './components/Sidebar.vue'
import SettingsComponent from './settings/Settings.vue'

export default {
  // 基本信息
  id: 'myPlugin',              // 插件唯一ID
  name: 'My Plugin',           // 显示名称
  version: '1.0.0',           // 版本号
  description: 'Plugin description',
  author: 'Your Name',
  
  // 侧边栏配置（可选）
  sidebar: {
    enabled: true,
    id: 'myPlugin',            // 侧边栏按钮ID
    name: 'My Plugin',         // 按钮显示名称
    icon: MyIcon,              // 按钮图标（必需SVG）
    component: SidebarComponent, // 侧边栏内容组件
    position: 100              // 排序位置（越小越靠前）
  },
  
  // 设置页面配置（可选）
  settings: {
    enabled: true,
    name: 'My Plugin Settings', // 设置页面标题
    icon: MyIcon,               // 设置页面图标
    component: SettingsComponent, // 设置页面组件
    category: 'myPlugin'         // 路由路径
  }
}
```

## 插件开发指南

### 1. 创建新插件

1. 在 `src/extension/` 下创建新文件夹
2. 创建 `index.js` 入口文件
3. 准备 SVG 图标
4. 实现组件（如需）

### 2. 侧边栏组件

侧边栏组件会接收到以下 props:
- 无特定 props，但可以使用全局 store

组件示例：
```vue
<template>
  <div class="my-plugin-sidebar">
    <h3>My Plugin</h3>
    <!-- 你的内容 -->
  </div>
</template>

<script setup>
// 可以使用 Vue 3 组合式 API
import { ref } from 'vue'

const message = ref('Hello from plugin!')
</script>

<style scoped>
.my-plugin-sidebar {
  padding: 15px;
}
</style>
```

### 3. 设置页面组件

设置页面组件可以访问 localStorage 保存配置：

```vue
<template>
  <div class="my-plugin-settings">
    <h4>My Plugin Settings</h4>
    
    <div class="setting-item">
      <label>API Key</label>
      <input v-model="config.apiKey" type="password" />
    </div>
    
    <button @click="saveConfig">Save</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const config = ref({
  apiKey: ''
})

onMounted(() => {
  // 加载保存的配置
  const saved = localStorage.getItem('myPlugin_config')
  if (saved) {
    config.value = JSON.parse(saved)
  }
})

const saveConfig = () => {
  localStorage.setItem('myPlugin_config', JSON.stringify(config.value))
}
</script>
```

### 4. 使用全局 Store

插件可以访问应用的全局 store：

```javascript
import { useEditorStore } from '@/store/editor'

const editorStore = useEditorStore()
const currentFile = computed(() => editorStore.currentFile)
```

## API 参考

### PluginManager

在插件中可以通过以下方式访问插件管理器：

```javascript
import { pluginManager } from '@/extension'

// 检查插件是否启用
const isEnabled = pluginManager.isPluginEnabled('myPlugin')

// 启用/禁用插件
pluginManager.enablePlugin('myPlugin')
pluginManager.disablePlugin('myPlugin')
```

## 示例插件

参考 `src/extension/aiAssistant/` 目录下的 AI 助手插件实现。
