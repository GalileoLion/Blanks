<template>
  <div class="recent-files-projects">
    <div class="centered-group">
      <div class="empty-state">
        {{ t('recent.noTabsOpen') }}
        <button class="button-primary" @click="newFile">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon icon-tabler icons-tabler-filled icon-tabler-file-plus">
            <defs>
              <mask id="file-plus-mask">
                <rect width="24" height="24" fill="white" />
                <rect x="8" y="12" width="8" height="3" fill="black" />
                <rect x="10" y="10" width="3" height="8" fill="black" />
              </mask>
            </defs>
            <path fill="currentColor" d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005h5z" mask="url(#file-plus-mask)" />
            <path fill="currentColor" d="M19 7h-4l-.001 -4.001z" mask="url(#file-plus-mask)" />
          </svg>
          {{ t('recent.newFile') }}
        </button>
      </div>
      <div v-if="recentDocuments.length > 0" class="history-bg">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history-icon lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
      </div>
      <div v-if="recentDocuments.length > 0" class="recent-list">
        <h3>{{ t('menu.file.openRecent') }}</h3>
        <div class="recent-grid">
          <!-- Large cards (first 2 items) -->
          <div
            v-for="doc in largeCards"
            :key="doc"
            class="card large-card"
            :title="doc"
            @click="openDocument(doc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon icon-tabler icons-tabler-filled icon-tabler-file">
              <path fill="currentColor" d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005h5z" />
              <path fill="currentColor" d="M19 7h-4l-.001 -4.001z" />
            </svg>
            <span class="filename">{{ getFileName(doc) }}</span>
          </div>
          <!-- Small cards container -->
          <div v-if="smallCards.length > 0" class="small-cards-container">
            <div class="small-cards-row">
              <div
                v-for="doc in smallCardsRow1"
                :key="doc"
                class="card small-card"
                :title="doc"
                @click="openDocument(doc)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon icon-tabler icons-tabler-filled icon-tabler-file">
                  <path fill="currentColor" d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005h5z" />
                  <path fill="currentColor" d="M19 7h-4l-.001 -4.001z" />
                </svg>
                <span class="filename">{{ getFileName(doc) }}</span>
              </div>
            </div>
            <div v-if="smallCardsRow2.length > 0" class="small-cards-row">
              <div
                v-for="doc in smallCardsRow2"
                :key="doc"
                class="card small-card"
                :title="doc"
                @click="openDocument(doc)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="icon icon-tabler icons-tabler-filled icon-tabler-file">
                  <path fill="currentColor" d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005h5z" />
                  <path fill="currentColor" d="M19 7h-4l-.001 -4.001z" />
                </svg>
                <span class="filename">{{ getFileName(doc) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useEditorStore } from '@/store/editor'
import { t } from '../../i18n'

const editorStore = useEditorStore()
const recentDocuments = ref([])

const newFile = () => {
  editorStore.NEW_UNTITLED_TAB({})
}

const getFileName = (path) => {
  return path.split(/[/\\]/).pop()
}

const openDocument = (pathname) => {
  window.electron.ipcRenderer.send('mt::open-file', pathname, {})
}

// 限制最多显示10个文件
const displayDocs = computed(() => recentDocuments.value.slice(0, 10))

// 前2个是大卡片
const largeCards = computed(() => displayDocs.value.slice(0, 2))

// 剩余是小卡片
const smallCards = computed(() => displayDocs.value.slice(2))

// 小卡片分2行，每行最多4个
const smallCardsRow1 = computed(() => smallCards.value.slice(0, 4))
const smallCardsRow2 = computed(() => smallCards.value.slice(4, 8))

onMounted(async () => {
  try {
    const docs = await window.electron.ipcRenderer.invoke('mt::get-recently-used-documents')
    recentDocuments.value = docs || []
  } catch (err) {
    console.error('Failed to get recent documents:', err)
  }
})
</script>

<style scoped>
.recent-files-projects {
  background: var(--editorBgColor);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  & .centered-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--editorColor);
    & .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      & button.button-primary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 20px;
        & svg {
          width: 16px;
          height: 16px;
        }
      }
    }
    & .history-bg {
      margin-top: 40px;
      margin-bottom: 16px;
      opacity: 0.08;
      pointer-events: none;
      & svg {
        width: 120px;
        height: 120px;
        color: var(--editorColor);
      }
    }
    & .recent-list {
      text-align: center;
      & h3 {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 12px;
        opacity: 0.7;
      }
      & .recent-grid {
        display: flex;
        gap: 8px;
        align-items: stretch;
        justify-content: center;
        & .card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--editorColor04);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          & .filename {
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
            padding: 0 8px;
          }
          &:hover {
            background: var(--sideBarItemHoverBgColor);
          }
        }
        & .large-card {
          width: 120px;
          min-height: 140px;
          & svg {
            width: 48px;
            height: 48px;
          }
        }
        & .small-cards-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          & .small-cards-row {
            display: flex;
            gap: 8px;
            flex: 1;
            & .small-card {
              flex: 1;
              min-width: 80px;
              max-width: 120px;
              padding: 12px 4px;
              & svg {
                width: 24px;
                height: 24px;
              }
              & .filename {
                font-size: 11px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
