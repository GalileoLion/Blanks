<template>
  <div class="footer-bar">
    <div class="footer-left">
      <!-- Group 0: Toggle Sidebar -->
      <div class="btn-group">
        <button class="footer-btn layout-toggle-btn" @click="toggleSideBar" title="Toggle Sidebar">
          <svg v-if="showSideBar" class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 19 8 12 15 5"></polyline>
          </svg>
          <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 19 16 12 9 5"></polyline>
          </svg>
        </button>
      </div>

      <div class="divider"></div>

      <!-- Customizable Tools Layout -->
      <template v-for="(group, gIdx) in groupedLayout">
        <div class="btn-group" :key="'group-' + gIdx">
          <template v-for="(item, iIdx) in group">
            <button v-if="item === 'strong'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleFormat('strong')" title="Bold (Ctrl+B)">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['strong']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['strong']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            <button v-else-if="item === 'em'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleFormat('em')" title="Italic (Ctrl+I)">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['em']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['em']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button v-else-if="item === 'u'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleFormat('u')" title="Underline (Ctrl+U)">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['u']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['u']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                <line x1="4" y1="21" x2="20" y2="21"></line>
              </svg>
            </button>
            <button v-else-if="item === 'mark'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleFormat('mark')" title="Highlight (Ctrl+H)">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['mark']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['mark']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l-6 6v3h9l3-3"></path>
                <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path>
              </svg>
            </button>
            <button v-else-if="item === 'blockquote'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleParagraph('blockquote')" title="Quote (Ctrl+Q)">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['blockquote']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['blockquote']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
              </svg>
            </button>
            <button v-else-if="item === 'inline_code'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleFormat('inline_code')" title="Inline Code">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['inline_code']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['inline_code']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </button>
            <button v-else-if="item === 'inline_math'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleFormat('inline_math')" title="Inline Math">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['inline_math']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['inline_math']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 7V4H6l6 8-6 8h12v-3"></path>
              </svg>
            </button>
            <button v-else-if="item === 'pre'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleParagraph('pre')" title="Code Block">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['pre']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['pre']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="m10 10-2 2 2 2"></path>
                <path d="m14 14 2-2-2-2"></path>
              </svg>
            </button>
            <button v-else-if="item === 'mathblock'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleParagraph('mathblock')" title="Math Block">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['mathblock']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['mathblock']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M16 8.5V7H8l4 5-4 5h8v-1.5"></path>
              </svg>
            </button>
            <button v-else-if="item === 'link'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleFormat('link')" title="Link">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['link']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['link']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <g transform="translate(4.8, 4.8) scale(0.6)" stroke-width="3.33">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </g>
              </svg>
            </button>
            <button v-else-if="item === 'image'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleFormat('image')" title="Image">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['image']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['image']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
            <button v-else-if="item === 'table'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleParagraph('table')" title="Table">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['table']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['table']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M3 12h18"></path>
                <path d="M9 3v18"></path>
                <path d="M15 3v18"></path>
              </svg>
            </button>
            <button v-else-if="item === 'ul-bullet'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleParagraph('ul-bullet')" title="Unordered List">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['ul-bullet']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['ul-bullet']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g transform="translate(-1.8, -1.8) scale(1.15)" stroke-width="1.74">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </g>
              </svg>
            </button>
            <button v-else-if="item === 'ol-order'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleParagraph('ol-order')" title="Ordered List">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['ol-order']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['ol-order']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g transform="translate(-1.8, -1.8) scale(1.15)" stroke-width="1.74">
                  <line x1="10" y1="6" x2="21" y2="6"></line>
                  <line x1="10" y1="12" x2="21" y2="12"></line>
                  <line x1="10" y1="18" x2="21" y2="18"></line>
                  <path d="M4 6h1v4"></path>
                  <path d="M4 10h2"></path>
                  <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
                </g>
              </svg>
            </button>
            <button v-else-if="item === 'ul-task'" :key="'btn-' + gIdx + '-' + iIdx" class="footer-btn" @click="handleParagraph('ul-task')" title="Todo List">
              <span v-if="footerBarCustomIcons && footerBarCustomIcons['ul-task']" class="custom-svg-wrapper" v-html="footerBarCustomIcons['ul-task']"></span>
              <svg v-else class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <g transform="translate(-1.8, -1.8) scale(1.15)" stroke-width="1.74">
                  <rect x="3" y="5" width="6" height="6" rx="1"></rect>
                  <path d="m3 17 2 2 4-4"></path>
                  <path d="M13 6h8"></path>
                  <path d="M13 12h8"></path>
                  <path d="M13 18h8"></path>
                </g>
              </svg>
            </button>
          </template>
        </div>
        <div class="divider" v-if="gIdx < groupedLayout.length - 1" :key="'divider-' + gIdx"></div>
      </template>
    </div>

    <div class="footer-right">
      <button
        class="footer-btn text-btn"
        @click="handleOpenSettings"
        title="Settings"
      >
        SETTING
      </button>
      <div class="file-dropdown-container">
        <button
          class="footer-btn text-btn"
          @click="toggleFileDropdown"
          title="Opened Files"
        >
          FILE
        </button>
        <div v-show="showFileDropdown" class="file-dropdown">
          <div class="file-dropdown-header">
            <span>OPENED({{ tabs.length }})</span>
            <div class="header-actions">
              <svg class="action-icon" aria-hidden="true" @click.stop="newFile()" title="New Tab">
                <use xlink:href="#icon-plus"></use>
              </svg>
              <svg class="action-icon" aria-hidden="true" @click.stop="saveAll(false)" title="Save All">
                <use xlink:href="#icon-save-all"></use>
              </svg>
              <svg class="action-icon" aria-hidden="true" @click.stop="saveAll(true)" title="Close All">
                <use xlink:href="#icon-close-all"></use>
              </svg>
            </div>
          </div>
          <div class="file-list">
            <div
              v-for="file in tabs"
              :key="file.id"
              class="opened-file"
              :class="{ active: currentFile.id === file.id, unsaved: !file.isSaved }"
              :title="file.pathname"
              @click="selectFile(file)"
            >
              <svg
                class="close-icon"
                aria-hidden="true"
                @click.stop="closeFile(file)"
              >
                <use xlink:href="#icon-close-small"></use>
              </svg>
              <span class="file-name">{{ file.filename }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="word-count">
        {{ wordCountDisplay }}
      </div>
      <button
        class="footer-btn text-btn source-code-btn"
        @click="toggleSourceCode"
        title="Toggle Source Code"
      >
        {{ sourceCode ? 'EDIT' : 'VIEW' }}
      </button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import bus from '@/bus'
import { ipcRenderer } from 'electron'

export default {
  name: 'FooterBar',
  data () {
    return {
      showFileDropdown: false
    }
  },
  computed: {
    ...mapState({
      showSideBar: state => state.layout.showSideBar,
      footerBarLayout: state => state.preferences.footerBarLayout,
      footerBarCustomIcons: state => state.preferences.footerBarCustomIcons,
      wordCount: state => state.editor.currentFile.wordCount,
      sourceCode: state => state.preferences.sourceCode,
      tabs: state => state.editor.tabs,
      currentFile: state => state.editor.currentFile
    }),
    groupedLayout () {
      if (!this.footerBarLayout) return []
      const groups = []
      let currentGroup = []
      this.footerBarLayout.split(',').map(s => s.trim()).forEach(item => {
        if (item === 'divider') {
          if (currentGroup.length > 0) {
            groups.push(currentGroup)
            currentGroup = []
          }
        } else if (item) {
          currentGroup.push(item)
        }
      })
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }
      return groups
    },
    wordCountDisplay () {
      if (!this.wordCount) return '0W / 0C / 0P'
      const word = this.wordCount.word || 0
      const character = this.wordCount.character || 0
      const paragraph = this.wordCount.paragraph || 0
      return `${word}W / ${character}C / ${paragraph}P`
    }
  },
  methods: {
    toggleSideBar () {
      bus.$emit('view:toggle-layout-entry', 'showSideBar')
    },
    handleFormat (type) {
      bus.$emit('format', type)
    },
    handleParagraph (type) {
      if (type === 'table') {
        // 快速插入的方法比弹出插入更符合直觉和易用性
        // bus.$emit('paragraph', type)
        const editorVue = this.$parent.$children.find(c => c.editor && typeof c.editor.updateParagraph === 'function')
        if (editorVue) {
          editorVue.focusEditor() // 确保焦点回到编辑器

          const contentState = editorVue.editor.contentState
          if (contentState) {
            const { start, end } = contentState.cursor
            const block = contentState.getBlock(start.key)
            const isAllowed = contentState.isAllowedTransformation(block, 'table', start.key !== end.key)

            // 如果不允许直接转换（比如当前行有文字），则在下方插入新段落
            if (!isAllowed) {
              editorVue.editor.insertParagraph('after')
            }

            // 稍作延迟，确保 DOM 更新且光标位置计算正确后，再唤起表格选择器
            setTimeout(() => {
              contentState.updateParagraph('table', true)
            }, 50)
          }
        }
      } else {
        bus.$emit('paragraph', type)
      }
    },
    handleOpenSettings () {
      ipcRenderer.send('mt::open-setting-window')
    },
    toggleSourceCode () {
      const newValue = !this.sourceCode
      this.$store.commit('SET_USER_PREFERENCE', { sourceCode: newValue })
    },
    toggleFileDropdown () {
      this.showFileDropdown = !this.showFileDropdown
    },
    selectFile (file) {
      if (file.id !== this.currentFile.id) {
        this.$store.dispatch('UPDATE_CURRENT_FILE', file)
      }
      this.showFileDropdown = false
    },
    closeFile (file) {
      if (file.isSaved) {
        this.$store.dispatch('FORCE_CLOSE_TAB', file)
      } else {
        this.$store.dispatch('CLOSE_UNSAVED_TAB', file)
      }
    },
    newFile () {
      this.$store.dispatch('NEW_UNTITLED_TAB', {})
    },
    saveAll (closeTabs) {
      this.$store.dispatch('ASK_FOR_SAVE_ALL', closeTabs)
    },
    handleClickOutside (event) {
      const dropdown = this.$el.querySelector('.file-dropdown-container')
      if (dropdown && !dropdown.contains(event.target)) {
        this.showFileDropdown = false
      }
    }
  },
  mounted () {
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeDestroy () {
    document.removeEventListener('click', this.handleClickOutside)
  }
}
</script>

<style scoped>
  .footer-bar {
    height: 35px;
    background: var(--sideBarBgColor);
    border-top: 1px solid var(--floatBorderColor);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    color: var(--sideBarColor);
  }

  .footer-left,
  .footer-right {
    display: flex;
    align-items: center;
  }

  .footer-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border: none;
    background: transparent;
    color: var(--sideBarTextColor);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .footer-btn:hover {
    background: var(--sideBarItemHoverBgColor);
    color: var(--sideBarColor);
  }

  .footer-btn.text-btn {
    font-size: 11px;
    letter-spacing: 0.1em;
    font-weight: 500;
    padding: 4px 8px;
  }

  .btn-group {
    display: flex;
    align-items: center;
  }

  .divider {
    width: 1px;
    height: 16px;
    background-color: var(--sideBarTextColor);
    margin: 0 8px;
    opacity: 0.3;
  }

  .footer-icon {
    width: 16px;
    height: 16px;
  }

  .custom-svg-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
  }
  .custom-svg-wrapper >>> svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .word-count {
    padding: 4px 8px;
    font-size: 11px;
    letter-spacing: 0.05em;
    color: var(--sideBarTextColor);
    white-space: nowrap;
  }

  .file-dropdown-container {
    position: relative;
  }

  .file-dropdown {
    position: absolute;
    bottom: 100%;
    left: 0;
    min-width: 180px;
    max-width: 220px;
    max-height: 350px;
    background: var(--floatBgColor);
    border: 1px solid var(--floatBorderColor);
    border-radius: 4px;
    box-shadow: var(--floatShadow);
    z-index: 100;
    margin-bottom: 5px;
    overflow: hidden;
  }

  .file-dropdown-header {
    padding: 8px 12px;
    border-bottom: 1px solid var(--floatBorderColor);
    font-size: 11px;
    font-weight: 600;
    color: var(--sideBarTitleColor);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-icon {
    width: 14px;
    height: 14px;
    fill: var(--sideBarIconColor);
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .action-icon:hover {
    opacity: 1;
    fill: var(--highlightThemeColor);
  }

  .file-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .opened-file {
    display: flex;
    align-items: center;
    height: 28px;
    line-height: 28px;
    padding-left: 30px;
    position: relative;
    color: var(--sideBarColor);
    cursor: pointer;
    user-select: none;
  }

  .opened-file:hover {
    background: var(--sideBarItemHoverBgColor);
  }

  .opened-file.active {
    color: var(--highlightThemeColor);
  }

  .opened-file .close-icon {
    display: none;
    width: 10px;
    height: 10px;
    position: absolute;
    top: 9px;
    left: 10px;
    fill: currentColor;
  }

  .opened-file:hover .close-icon {
    display: inline-block;
  }

  .opened-file.unsaved::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--highlightThemeColor);
    position: absolute;
    top: 11px;
    left: 12px;
  }

  .opened-file.unsaved:hover::before {
    display: none;
  }

  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  .layout-toggle-btn {
    margin-left: -15px;
    margin-right: -8px;
  }

  .source-code-btn {
    margin-right: -15px;
  }
</style>
