<template>
  <div class="recent-files-projects">
    <div class="centered-group">
      <div class="empty-state">
        <div class="empty-header">
          <div class="tab-bg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tab-icon lucide-tab"><path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"/><path d="M22 20H2"/></svg>
          </div>
          <span class="empty-text">{{ t('recent.noTabsOpen') }}</span>
        </div>
        <div class="action-buttons">
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
          <button class="button-primary" @click="openFile">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-file">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005h5z" />
              <path d="M19 7h-4l-.001 -4.001z" />
            </svg>
            {{ t('menu.file.openFile') }}
          </button>
        </div>
      </div>
      <div v-if="recentDocuments.length > 0" class="recent-list">
        <div class="recent-header">
          <div class="history-bg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history-icon lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          </div>
          <h3>{{ t('menu.file.openRecent') }}</h3>
        </div>
        <div class="recent-grid">
          <div
            v-for="doc in recentDocuments"
            :key="doc"
            class="card"
            :title="doc"
            @click="openDocument(doc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
            <span class="filename">{{ getFileName(doc) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

const openFile = () => {
  window.electron.ipcRenderer.send('mt::cmd-open-file')
}

const openDocument = (pathname) => {
  window.electron.ipcRenderer.send('mt::open-file', pathname, {})
}

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
  justify-content: center;
  min-width: 0;
  & .centered-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--editorColor);
    max-width: 100%;
    padding: 0 20px;
      & .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        & .empty-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 20px;
          & .tab-bg {
            opacity: 0.08;
            pointer-events: none;
            line-height: 0;
            & svg {
              width: 120px;
              height: 120px;
              color: var(--editorColor);
            }
          }
          & .empty-text {
            font-size: 14px;
            font-weight: 500;
            margin: 0;
            opacity: 0.7;
            text-align: right;
          }
        }
      & .action-buttons {
        display: flex;
        gap: 12px;
        margin-top: 20px;
        & button.button-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          & svg {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
      & .recent-list {
      text-align: center;
      width: 100%;
      margin-top: 20px;
      & .recent-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 12px;
        & .history-bg {
          opacity: 0.08;
          pointer-events: none;
          line-height: 0;
          & svg {
            width: 120px;
            height: 120px;
            color: var(--editorColor);
          }
        }
        & h3 {
          font-size: 14px;
          font-weight: 500;
          margin: 0;
          opacity: 0.7;
          text-align: right;
        }
      }
      & .recent-grid {
        display: flex;
        gap: 8px;
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 4px;
        max-width: 100%;
        scrollbar-width: none;
        -ms-overflow-style: none;
        &::-webkit-scrollbar {
          display: none;
        }
        & .card {
          width: 90px;
          height: 110px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 6px;
          background: var(--editorColor04);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          & svg {
            width: 32px;
            height: 32px;
          }
          & .filename {
            font-size: 11px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            max-width: 100%;
            padding: 0 4px;
            text-align: center;
            line-height: 1.3;
            max-height: 2.6em;
          }
          &:hover {
            background: var(--sideBarItemHoverBgColor);
          }
        }
      }
    }
  }
}
</style>
