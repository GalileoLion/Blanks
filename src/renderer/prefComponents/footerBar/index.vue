<template>
  <div class="pref-footerbar">
    <h4>Footer Bar</h4>
    <compound>
      <template #head>
        <h6 class="title">Layout:</h6>
      </template>
      <template #children>
        <text-box
          description="Footer Bar Layout"
          notes="Define the layout of the footer bar, use 'divider' for splitting groups. Comma separated list of icon IDs (e.g. strong, em, u, mark, blockquote, inline_code, inline_math, divider, pre, mathblock, link, image, table, divider, ul-bullet, ol-order, ul-task)."
          :input="footerBarLayout"
          :onChange="value => onSelectChange('footerBarLayout', value)"
        ></text-box>
        <div class="reset-container">
          <el-button size="small" @click="resetToDefault">Reset to Default</el-button>
        </div>
      </template>
    </compound>

    <compound>
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
              :value="item">
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
    </compound>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Compound from '../common/compound'
import TextBox from '../common/textBox'

export default {
  components: {
    Compound,
    TextBox
  },
  data () {
    return {
      selectedIcon: 'strong',
      customSvgInput: '',
      availableIcons: [
        'strong', 'em', 'u', 'mark', 'blockquote', 'inline_code', 'inline_math',
        'pre', 'mathblock', 'link', 'image', 'table',
        'ul-bullet', 'ol-order', 'ul-task'
      ]
    }
  },
  computed: {
    ...mapState({
      footerBarLayout: state => state.preferences.footerBarLayout,
      footerBarCustomIcons: state => state.preferences.footerBarCustomIcons
    })
  },
  watch: {
    selectedIcon: {
      immediate: true,
      handler (newVal) {
        this.customSvgInput = (this.footerBarCustomIcons && this.footerBarCustomIcons[newVal]) || ''
      }
    }
  },
  methods: {
    onSelectChange (type, value) {
      this.$store.dispatch('SET_SINGLE_PREFERENCE', { type, value })
    },
    resetToDefault () {
      const defaultLayout = 'strong, em, u, mark, blockquote, inline_code, inline_math, divider, pre, mathblock, link, image, table, divider, ul-bullet, ol-order, ul-task'
      this.onSelectChange('footerBarLayout', defaultLayout)
    },
    saveCustomIcon () {
      const newIcons = { ...this.footerBarCustomIcons, [this.selectedIcon]: this.customSvgInput }
      this.onSelectChange('footerBarCustomIcons', newIcons)
    },
    clearCustomIcon () {
      const newIcons = { ...this.footerBarCustomIcons }
      delete newIcons[this.selectedIcon]
      this.onSelectChange('footerBarCustomIcons', newIcons)
      this.customSvgInput = ''
    }
  }
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
      & >>> .el-textarea__inner,
      & >>> .el-input__inner {
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
