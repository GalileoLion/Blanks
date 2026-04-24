<template>
  <div class="recent-files-projects">
    <div class="centered-group">
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
  </div>
</template>

<script setup>
import { useEditorStore } from '@/store/editor'
import { t } from '../../i18n'

const editorStore = useEditorStore()

const newFile = () => {
  editorStore.NEW_UNTITLED_TAB({})
}
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
}
</style>
