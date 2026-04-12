/**
 * Plugin System for MarkText+
 * 
 * Automatically scans and loads plugins from the extension/ directory
 */
import { ref, computed, shallowRef } from 'vue'

class PluginManager {
  constructor() {
    // 所有扫描到的插件
    this.plugins = ref([])
    // 启用的插件ID列表（从localStorage读取）
    this.enabledPlugins = ref(this.loadEnabledPlugins())
    // 侧边栏插件组件
    this.sidebarComponents = ref([])
    // 设置页面插件
    this.settingsComponents = ref([])
  }

  /**
   * 从localStorage加载启用的插件列表
   */
  loadEnabledPlugins() {
    try {
      const saved = localStorage.getItem('marktext_enabled_plugins')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Failed to load enabled plugins:', e)
      return []
    }
  }

  /**
   * 保存启用的插件列表到localStorage
   */
  saveEnabledPlugins() {
    localStorage.setItem('marktext_enabled_plugins', JSON.stringify(this.enabledPlugins.value))
  }

  /**
   * 扫描并加载所有插件
   * 在开发环境中需要手动导入，生产环境可以动态导入
   */
  async loadPlugins() {
    const loadedPlugins = []

    try {
      // 使用相对路径匹配插件
      const pluginModules = import.meta.glob('./*/index.js', { eager: true })

      for (const [path, module] of Object.entries(pluginModules)) {
        try {
          const plugin = module.default || module
          if (this.validatePlugin(plugin)) {
            const pluginId = path.match(/\.\/([^/]+)\//)?.[1]
            plugin.id = plugin.id || pluginId
            loadedPlugins.push(plugin)
          }
        } catch (e) {
          console.error(`Failed to load plugin from ${path}:`, e)
        }
      }
    } catch (e) {
      console.error('Failed to scan plugins:', e)
    }

    this.plugins.value = loadedPlugins
    this.updateComponentRegistrations()

    console.log('Loaded plugins:', loadedPlugins.map(p => p.id))
    return loadedPlugins
  }

  /**
   * 验证插件配置是否有效
   */
  validatePlugin(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      console.error('Invalid plugin: must be an object')
      return false
    }

    // 插件必须有id和name
    if (!plugin.name) {
      console.error('Invalid plugin: missing name')
      return false
    }

    // 验证侧边栏配置
    if (plugin.sidebar) {
      if (!plugin.sidebar.component) {
        console.error(`Plugin ${plugin.name}: sidebar enabled but no component provided`)
        return false
      }
      if (!plugin.sidebar.icon) {
        console.error(`Plugin ${plugin.name}: sidebar enabled but no icon provided`)
        return false
      }
    }

    // 验证设置配置
    if (plugin.settings) {
      if (!plugin.settings.component) {
        console.error(`Plugin ${plugin.name}: settings enabled but no component provided`)
        return false
      }
    }

    return true
  }

  /**
   * 检查插件是否启用
   */
  isPluginEnabled(pluginId) {
    return this.enabledPlugins.value.includes(pluginId)
  }

  /**
   * 启用插件
   */
  enablePlugin(pluginId) {
    if (!this.enabledPlugins.value.includes(pluginId)) {
      this.enabledPlugins.value.push(pluginId)
      this.saveEnabledPlugins()
      this.updateComponentRegistrations()
    }
  }

  /**
   * 禁用插件
   */
  disablePlugin(pluginId) {
    const index = this.enabledPlugins.value.indexOf(pluginId)
    if (index > -1) {
      this.enabledPlugins.value.splice(index, 1)
      this.saveEnabledPlugins()
      this.updateComponentRegistrations()
    }
  }

  /**
   * 切换插件启用状态
   */
  togglePlugin(pluginId) {
    if (this.isPluginEnabled(pluginId)) {
      this.disablePlugin(pluginId)
    } else {
      this.enablePlugin(pluginId)
    }
  }

  /**
   * 更新组件注册（侧边栏和设置页面）
   */
  updateComponentRegistrations() {
    const enabled = this.plugins.value.filter(p => this.isPluginEnabled(p.id))

    // 更新侧边栏组件
    this.sidebarComponents.value = enabled
      .filter(p => p.sidebar)
      .map(p => ({
        id: p.sidebar.id || p.id,
        name: p.sidebar.name || p.name,
        icon: p.sidebar.icon,
        component: shallowRef(p.sidebar.component),
        position: p.sidebar.position || 999
      }))
      .sort((a, b) => a.position - b.position)

    // 更新设置页面组件
    this.settingsComponents.value = enabled
      .filter(p => p.settings)
      .map(p => ({
        id: p.id,
        name: p.settings.name || p.name,
        icon: p.settings.icon,
        component: shallowRef(p.settings.component),
        category: p.settings.category || p.id
      }))
  }

  /**
   * 获取插件信息（用于设置页面显示）
   */
  getPluginInfo(pluginId) {
    return this.plugins.value.find(p => p.id === pluginId)
  }

  /**
   * 获取所有插件信息
   */
  getAllPlugins() {
    return this.plugins.value.map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      description: p.description,
      author: p.author,
      enabled: this.isPluginEnabled(p.id),
      hasSidebar: !!p.sidebar,
      hasSettings: !!p.settings
    }))
  }
}

// 创建单例
export const pluginManager = new PluginManager()

export default pluginManager
