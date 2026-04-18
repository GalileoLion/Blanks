<template>
  <div
    v-show="showSideBar"
    ref="sideBar"
    class="side-bar"
    :style="[!rightColumn ? { 'min-width': '45px' } : {}, { width: `${finalSideBarWidth}px` }]"
  >
    <div class="top-column">
      <ul>
        <!-- 内置侧边栏图标 -->
        <li
          v-for="(c, index) of sideBarIcons"
          :key="index"
          :class="{ active: c.id === rightColumn }"
          @click="handleLeftIconClick(c.id)"
        >
          <component :is="c.icon" />
        </li>
        <!-- 插件侧边栏图标 -->
        <li
          v-for="plugin in pluginSidebarComponents"
          :key="plugin.id"
          :class="{ active: plugin.id === rightColumn }"
          @click="handleLeftIconClick(plugin.id)"
          :title="plugin.name"
        >
          <component :is="plugin.icon" />
        </li>
      </ul>
    </div>
    <div v-show="rightColumn" class="right-column">
      <!-- 内置组件 -->
      <tree
        v-if="rightColumn === 'files'"
        :projectTree="projectTree"
        :openedFiles="openedFiles"
        :tabs="tabs"
      ></tree>
      <side-bar-search v-else-if="rightColumn === 'search'"></side-bar-search>
      <toc v-else-if="rightColumn === 'toc'"></toc>

      <!-- 插件组件 -->
      <component v-else-if="activePluginComponent" :is="activePluginComponent" />
    </div>
    <div v-show="rightColumn" class="bottom-bar">
      <ul>
        <li
          v-for="(c, index) of sideBarBottomIcons"
          :key="index"
          @click="handleLeftBottomClick(c.id)"
        >
          <component :is="c.icon" />
        </li>
      </ul>
    </div>
    <div v-show="rightColumn" ref="dragBar" class="drag-bar"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, shallowRef, watch } from 'vue'
import { useLayoutStore } from '@/store/layout'
import { useProjectStore } from '@/store/project'
import { useEditorStore } from '@/store/editor'

import { sideBarIcons, sideBarBottomIcons } from './help'
import Tree from './tree.vue'
import SideBarSearch from './search.vue'
import Toc from './toc.vue'
import { storeToRefs } from 'pinia'
import bus from '@/bus'
import { pluginManager } from '@extension/pluginManager'

const layoutStore = useLayoutStore()
const projectStore = useProjectStore()
const editorStore = useEditorStore()

const sideBar = ref(null)
const dragBar = ref(null)

const openedFiles = ref([])
const sideBarViewWidth = ref(280)

// 插件侧边栏组件 - 直接使用 pluginManager 的响应式数据
const pluginSidebarComponents = computed(() => pluginManager.sidebarComponents.value)

const { rightColumn, showSideBar, sideBarWidth } = storeToRefs(layoutStore)

const { projectTree } = storeToRefs(projectStore)
const { tabs, currentFile } = storeToRefs(editorStore)

const finalSideBarWidth = computed(() => {
  if (!showSideBar.value) return 0
  if (rightColumn.value === '') return 45
  if (sideBarViewWidth.value < 220) return 220
  if (sideBarViewWidth.value > 600) return 600
  return sideBarViewWidth.value
})

// 计算当前激活的插件组件
const activePluginComponent = computed(() => {
  const plugin = pluginSidebarComponents.value.find((p) => p.id === rightColumn.value)
  return plugin ? plugin.component : null
})

onMounted(async () => {
  // 加载插件
  await pluginManager.loadPlugins()

  nextTick(() => {
    const dragBarEl = dragBar.value
    let startX = 0
    let currentSideBarWidth = +sideBarWidth.value
    let startWidth = currentSideBarWidth

    sideBarViewWidth.value = currentSideBarWidth

    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler, false)
      document.removeEventListener('mouseup', mouseUpHandler, false)
      let finalWidth = currentSideBarWidth
      if (finalWidth < 220) finalWidth = 220
      if (finalWidth > 600) finalWidth = 600
      layoutStore.CHANGE_SIDE_BAR_WIDTH(finalWidth)
    }

    const mouseMoveHandler = (event) => {
      const offset = event.clientX - startX
      currentSideBarWidth = startWidth + offset
      sideBarViewWidth.value = currentSideBarWidth
      let effectiveWidth = currentSideBarWidth
      if (effectiveWidth < 220) effectiveWidth = 220
      if (effectiveWidth > 600) effectiveWidth = 600
      document.documentElement.style.setProperty('--currentSideBarWidth', `${effectiveWidth}px`)
    }

    const mouseDownHandler = (event) => {
      startX = event.clientX
      startWidth = +sideBarWidth.value
      document.addEventListener('mousemove', mouseMoveHandler, false)
      document.addEventListener('mouseup', mouseUpHandler, false)
    }

    dragBarEl.addEventListener('mousedown', mouseDownHandler, false)
  })
})

const handleLeftIconClick = (name) => {
  if (rightColumn.value === name) {
    layoutStore.SET_LAYOUT({ rightColumn: '' })
    layoutStore.CHANGE_SIDE_BAR_WIDTH(finalSideBarWidth.value)
  } else {
    const needDispatch = rightColumn.value === ''
    layoutStore.SET_LAYOUT({ rightColumn: name })
    sideBarViewWidth.value = +sideBarWidth.value
    if (needDispatch) {
      layoutStore.CHANGE_SIDE_BAR_WIDTH(finalSideBarWidth.value)
    }
  }
}

const handleLeftBottomClick = (name) => {
  if (name === 'settings') {
    projectStore.OPEN_SETTING_WINDOW()
  } else if (name === 'close') {
    bus.emit('view:toggle-layout-entry', 'showSideBar')
  }
}

// 监听侧边栏显示/隐藏和宽度变化，同步 CSS 变量
watch(
  [showSideBar, sideBarWidth],
  ([visible, width]) => {
    if (visible) {
      document.documentElement.style.setProperty('--currentSideBarWidth', `${width}px`)
    } else {
      document.documentElement.style.setProperty('--currentSideBarWidth', '0px')
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.side-bar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  flex-grow: 0;
  width: 280px;
  height: 100vh;
  min-width: 220px;
  max-width: 600px;
  position: relative;
  color: var(--sideBarColor);
  user-select: none;
  background: var(--sideBarBgColor);
  border-right: 1px solid var(--itemBgColor);
}

.side-bar .top-column svg {
  fill: none;
}

.top-column {
  width: 100%;
  height: var(--titleBarHeight);
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  padding: 0 5px;
  box-sizing: border-box;
  flex-shrink: 0;
  border-bottom: 1px solid var(--itemBgColor);
  -webkit-app-region: drag;
}

.top-column > ul {
  opacity: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  max-width: 100%;
}

.top-column > ul::-webkit-scrollbar {
  display: none;
}

.top-column ul {
  list-style: none;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
}

.top-column ul > li {
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease-in-out;
  -webkit-app-region: no-drag;
  flex-shrink: 0;
}
.top-column ul > li:hover {
  background: var(--sideBarItemHoverBgColor);
}

.top-column ul > li > svg {
  width: 18px;
  height: 18px;
  color: var(--sideBarIconColor);
  stroke: currentColor;
  stroke-width: 2.5px;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  opacity: 1;
  transition: transform 0.25s ease-in-out;
}

.top-column ul > li.active > svg {
  color: var(--themeColor);
  stroke: currentColor;
}

.side-bar:hover .top-column ul li svg {
  opacity: 1;
}

.right-column {
  flex: 1;
  overflow: hidden;
}

.bottom-bar {
  width: 100%;
  height: 35px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  padding: 0 5px;
  box-sizing: border-box;
  flex-shrink: 0;
  border-top: 1px solid var(--itemBgColor);
}

.bottom-bar ul {
  list-style: none;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
}

.bottom-bar ul > li {
  width: 35px;
  height: 35px;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.bottom-bar ul > li > svg {
  width: 16px;
  height: 16px;
  color: var(--sideBarIconColor);
  stroke: currentColor;
  stroke-width: 2.5px;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  opacity: 1;
  transition: transform 0.25s ease-in-out;
}

.bottom-bar ul > li:hover > svg {
  color: var(--themeColor);
}

.drag-bar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  width: 3px;
  cursor: col-resize;
}

.drag-bar:hover {
  border-right: 2px solid var(--iconColor);
}
</style>
