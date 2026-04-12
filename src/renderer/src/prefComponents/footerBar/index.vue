<template>
  <div class="pref-footerbar">
    <h4>Footer Bar</h4>
    <Compound>
      <template #head>
        <h6 class="title">Layout:</h6>
      </template>
      <template #children>
        <TextBox
          description="Footer Bar Layout"
          notes="Define the layout of the footer bar, use 'divider' for splitting groups. Comma separated list of icon IDs (e.g. strong, em, u, mark, blockquote, inline_code, inline_math, divider, pre, mathblock, link, image, table, divider, ul-bullet, ol-order, ul-task)."
          :input="footerBarLayout"
          :onChange="value => onSelectChange('footerBarLayout', value)"
        ></TextBox>
        <div class="reset-container">
          <el-button size="small" @click="resetToDefault">Reset to Default</el-button>
        </div>
      </template>
    </Compound>

    <Compound>
      <template #head>
        <h6 class="title">Custom Icons:</h6>
      </template>
      <template #children>
        <div class="custom-icon-editor">
          <div class="description" style="font-size: 14px; margin-bottom: 10px; color: var(--editorColor);">
            <span>Replace SVG:</span>
          </div>
          <el-select v-model="selectedIcon" size="small" placeholder="Select Icon to Replace">
            <el-option
              v-for="item in availableIcons"
              :key="item"
              :label="item"
              :value="item"
            >
            </el-option>
          </el-select>

          <el-input
            type="textarea"
            :rows="6"
            placeholder="Paste raw <svg>...</svg> code here"
            v-model="customSvgInput"
            style="margin-top: 15px;"
          ></el-input>

          <div style="margin-top: 15px;">
            <el-button size="small" type="primary" @click="saveCustomIcon">Save Custom Icon</el-button>
            <el-button size="small" @click="clearCustomIcon">Clear Custom Icon</el-button>
          </div>
        </div>
      </template>
    </Compound>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePreferencesStore } from '@/store/preferences'
import Compound from '../common/compound/index.vue'
import TextBox from '../common/textBox/index.vue'

const preferencesStore = usePreferencesStore()

const selectedIcon = ref('strong')
const customSvgInput = ref('')
const availableIcons = [
  'strong', 'em', 'u', 'mark', 'blockquote', 'inline_code', 'inline_math',
  'pre', 'mathblock', 'link', 'image', 'table',
  'ul-bullet', 'ol-order', 'ul-task'
]

const footerBarLayout = computed(() => preferencesStore.footerBarLayout)
const footerBarCustomIcons = computed(() => preferencesStore.footerBarCustomIcons)

watch(selectedIcon, (newVal) => {
  customSvgInput.value = (footerBarCustomIcons.value && footerBarCustomIcons.value[newVal]) || ''
}, { immediate: true })

const onSelectChange = (type, value) => {
  preferencesStore.SET_SINGLE_PREFERENCE({ type, value })
}

const resetToDefault = () => {
  const defaultLayout = 'strong, em, u, mark, blockquote, inline_code, inline_math, divider, pre, mathblock, link, image, table, divider, ul-bullet, ol-order, ul-task'
  onSelectChange('footerBarLayout', defaultLayout)
}

const saveCustomIcon = () => {
  const newIcons = { ...footerBarCustomIcons.value, [selectedIcon.value]: customSvgInput.value }
  onSelectChange('footerBarCustomIcons', newIcons)
}

const clearCustomIcon = () => {
  const newIcons = { ...footerBarCustomIcons.value }
  delete newIcons[selectedIcon.value]
  onSelectChange('footerBarCustomIcons', newIcons)
  customSvgInput.value = ''
}
</script>

<style scoped>
.pref-footerbar {
  & h4 {
    text-transform: uppercase;
    margin: 0;
    font-weight: 400;
  }
  & .title {
    margin-top: 0;
  }
  & .reset-container {
    margin-top: 15px;
    margin-bottom: 20px;
  }
  & .custom-icon-editor {
    margin-top: 20px;
    /* Apply theme colors to textarea and select input */
    & :deep(.el-textarea__inner),
    & :deep(.el-input__inner) {
      background: transparent;
      color: var(--editorColor);
      border-color: var(--editorColor10);
      &::placeholder {
        color: var(--editorColor30);
      }
      &:focus {
        border-color: var(--themeColor);
      }
    }
  }
}
</style>
