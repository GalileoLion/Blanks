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
      <div v-if="recentDocuments.length > 0" class="recent-list">
        <h3>{{ t('menu.file.openRecent') }}</h3>
        <ul>
          <li
            v-for="doc in recentDocuments"
            :key="doc"
            :title="doc"
            @click="openDocument(doc)"
          >
            {{ getFileName(doc) }}
          </li>
        </ul>
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
    & .recent-list {
      margin-top: 40px;
      text-align: center;
      & h3 {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 12px;
        opacity: 0.7;
      }
      & ul {
        list-style: none;
        padding: 4px;
        margin: 0;
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--editorColor10);
        border-radius: 6px;
        background: var(--editorColor04);
        &::-webkit-scrollbar {
          width: 6px;
        }
        &::-webkit-scrollbar-track {
          background: transparent;
        }
        &::-webkit-scrollbar-thumb {
          background: var(--editorColor30);
          border-radius: 3px;
        }
        & li {
          font-size: 13px;
          padding: 6px 12px;
          cursor: pointer;
          border-radius: 4px;
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          &:hover {
            background: var(--sideBarBgColor);
          }
        }
      }
    }
  }
}
</style>
