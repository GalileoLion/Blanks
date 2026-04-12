import Icon from './icon.svg'
import SidebarComponent from './components/Sidebar.vue'
import SettingsComponent from './settings/Settings.vue'

export default {
  id: 'aiAssistant',
  name: 'AI Assistant',
  version: '1.0.0',
  description: 'AI-powered assistant for editing Markdown documents',
  author: 'MarkText+',

  sidebar: {
    enabled: true,
    id: 'aiAssistant',
    name: 'AI Assistant',
    icon: Icon,
    component: SidebarComponent,
    position: 50
  },

  settings: {
    enabled: true,
    name: 'AI Assistant',
    icon: Icon,
    component: SettingsComponent,
    category: 'aiAssistant'
  }
}
