<template>
  <div
    class="editor-with-tabs"
    :style="{ 'max-width': showSideBar ? `calc(100vw - ${sideBarWidth}px` : '100vw' }"
  >
    <div class="container">
      <editor
        :markdown="markdown"
        :cursor="cursor"
        :text-direction="textDirection"
        :platform="platform"
      ></editor>
      <source-code
        v-if="sourceCode"
        :markdown="markdown"
        :muyaIndexCursor="muyaIndexCursor"
        :text-direction="textDirection"
      ></source-code>
      <floating-toc v-if="showFloatingToc && isFloatingTocLoaded"></floating-toc>
    </div>
    <tab-notifications></tab-notifications>
    <footer-bar v-if="isFooterLoaded"></footer-bar>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent, computed } from 'vue'
import { useLayoutStore } from '@/store/layout'
import { useEditorStore } from '@/store/editor'
import { storeToRefs } from 'pinia'
import Editor from './editor.vue'
import SourceCode from './sourceCode.vue'
import TabNotifications from './notifications.vue'

const FooterBar = defineAsyncComponent(() => import('./footerBar.vue'))

const FloatingToc = defineAsyncComponent(() => import('./floatingToc.vue'))

defineProps({
  markdown: {
    type: String,
    required: true
  },
  cursor: {
    validator(value) {
      return typeof value === 'object'
    },
    required: true
  },
  muyaIndexCursor: {
    type: Object
  },
  sourceCode: {
    type: Boolean,
    required: true
  },
  showTabBar: {
    type: Boolean,
    required: true
  },
  textDirection: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true
  }
})

const layoutStore = useLayoutStore()
const editorStore = useEditorStore()

const { showSideBar, sideBarWidth } = storeToRefs(layoutStore)
const { listToc } = storeToRefs(editorStore)

const showFloatingToc = computed(() => {
  return listToc.value && listToc.value.length > 0
})

const isFooterLoaded = ref(false)
const isFloatingTocLoaded = ref(false)

onMounted(() => {
  // Load footer bar and floating TOC independently on idle
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      isFooterLoaded.value = true
    })
    requestIdleCallback(() => {
      isFloatingTocLoaded.value = true
    })
  } else {
    setTimeout(() => {
      isFooterLoaded.value = true
    }, 500)
    setTimeout(() => {
      isFloatingTocLoaded.value = true
    }, 500)
  }
})
</script>

<style scoped>
.editor-with-tabs {
  position: relative;
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;

  overflow: hidden;
  background: var(--editorBgColor);
  & > .container {
    flex: 1;
    overflow: hidden;
    position: relative;
  }
}
</style>
