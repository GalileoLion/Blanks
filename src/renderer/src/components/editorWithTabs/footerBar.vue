<template>
  <div class="footer-bar">
    <div class="footer-left">
      <!-- Group 0: Toggle Sidebar -->
      <div class="btn-group">
        <button class="footer-btn layout-toggle-btn" @click="toggleSideBar" title="Toggle Sidebar">
          <svg
            v-if="showSideBar"
            class="footer-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 19 8 12 15 5"></polyline>
          </svg>
          <svg
            v-else
            class="footer-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 19 16 12 9 5"></polyline>
          </svg>
        </button>
      </div>

      <div class="divider"></div>

      <!-- Customizable Tools Layout -->
      <template v-for="(group, gIdx) in groupedLayout" :key="'group-' + gIdx">
        <div class="btn-group">
          <template v-for="(item, iIdx) in group" :key="'btn-' + gIdx + '-' + iIdx">
            <button
              v-if="item === 'strong'"
              class="footer-btn"
              @click="handleFormat('strong')"
              title="Bold (Ctrl+B)"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['strong']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['strong']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'em'"
              class="footer-btn"
              @click="handleFormat('em')"
              title="Italic (Ctrl+I)"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['em']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['em']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button
              v-else-if="item === 'u'"
              class="footer-btn"
              @click="handleFormat('u')"
              title="Underline (Ctrl+U)"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['u']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['u']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                <line x1="4" y1="21" x2="20" y2="21"></line>
              </svg>
            </button>
            <button
              v-else-if="item === 'mark'"
              class="footer-btn"
              @click="handleFormat('mark')"
              title="Highlight (Ctrl+H)"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['mark']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['mark']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 11l-6 6v3h9l3-3"></path>
                <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'blockquote'"
              class="footer-btn"
              @click="handleParagraph('blockquote')"
              title="Quote (Ctrl+Q)"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['blockquote']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['blockquote']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"
                ></path>
                <path
                  d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"
                ></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'sup'"
              class="footer-btn"
              @click="handleFormat('sup')"
              title="Superscript"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['sup']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['sup']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M23 12h-4c0-1.5.442-2 1.5-2.5S23 8.334 23 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06"
                ></path>
                <path d="M3 4 L17 20"></path>
                <path d="M17 4 L3 20"></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'sub'"
              class="footer-btn"
              @click="handleFormat('sub')"
              title="Subscript"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['sub']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['sub']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M23 19h-4c0-1.5.44-2 1.5-2.5S23 15.33 23 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07"
                ></path>
                <path d="M3 4 L17 20"></path>
                <path d="M17 4 L3 20"></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'html_block'"
              class="footer-btn"
              @click="handleParagraph('html')"
              title="HTML Block"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['html_block']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['html_block']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
                <path d="M14 5 L10 19"></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'inline_code'"
              class="footer-btn"
              @click="handleFormat('inline_code')"
              title="Inline Code"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['inline_code']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['inline_code']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </button>
            <button
              v-else-if="item === 'inline_math'"
              class="footer-btn"
              @click="handleFormat('inline_math')"
              title="Inline Math"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['inline_math']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['inline_math']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 7V4H6l6 8-6 8h12v-3"></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'pre'"
              class="footer-btn"
              @click="handleParagraph('pre')"
              title="Code Block"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['pre']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['pre']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="m10 10-2 2 2 2"></path>
                <path d="m14 14 2-2-2-2"></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'mathblock'"
              class="footer-btn"
              @click="handleParagraph('mathblock')"
              title="Math Block"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['mathblock']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['mathblock']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M16 8.5V7H8l4 5-4 5h8v-1.5"></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'link'"
              class="footer-btn"
              @click="handleFormat('link')"
              title="Link"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['link']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['link']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <g transform="translate(4.8, 4.8) scale(0.6)" stroke-width="3.33">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </g>
              </svg>
            </button>
            <button
              v-else-if="item === 'image'"
              class="footer-btn"
              @click="handleFormat('image')"
              title="Image"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['image']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['image']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
            <button
              v-else-if="item === 'table'"
              class="footer-btn"
              @click="handleParagraph('table')"
              title="Table"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['table']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['table']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M3 12h18"></path>
                <path d="M9 3v18"></path>
                <path d="M15 3v18"></path>
              </svg>
            </button>
            <button
              v-else-if="item === 'ul-bullet'"
              class="footer-btn"
              @click="handleParagraph('ul-bullet')"
              title="Unordered List"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['ul-bullet']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['ul-bullet']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
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
            <button
              v-else-if="item === 'ol-order'"
              class="footer-btn"
              @click="handleParagraph('ol-order')"
              title="Ordered List"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['ol-order']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['ol-order']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
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
            <button
              v-else-if="item === 'ul-task'"
              class="footer-btn"
              @click="handleParagraph('ul-task')"
              title="Todo List"
            >
              <span
                v-if="footerBarCustomIcons && footerBarCustomIcons['ul-task']"
                class="custom-svg-wrapper"
                v-html="footerBarCustomIcons['ul-task']"
              ></span>
              <svg
                v-else
                class="footer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
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
        <div class="divider" v-if="gIdx < groupedLayout.length - 1"></div>
      </template>
    </div>

    <div class="footer-right">
      <!-- Custom word count tooltip using Element Plus el-tooltip component. -->
      <el-tooltip v-if="wordCount" placement="top" :effect="tooltipEffect">
        <template #content>
          <div class="word-count-tooltip-content">
            <!-- Tab Switcher -->
            <div class="tooltip-tab-switcher">
              <button 
                class="tooltip-tab-btn" 
                :class="{ active: activeTooltipTab === 'stats' }"
                @click="activeTooltipTab = 'stats'"
              >
                <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20V10"/>
                  <path d="M18 20V4"/>
                  <path d="M6 20v-4"/>
                </svg>
              </button>
              <button 
                class="tooltip-tab-btn" 
                :class="{ active: activeTooltipTab === 'toc' }"
                @click="activeTooltipTab = 'toc'"
              >
                <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 6h16"/>
                  <path d="M4 12h16"/>
                  <path d="M4 18h16"/>
                </svg>
              </button>
            </div>
            
            <!-- Stats Page -->
            <div v-if="activeTooltipTab === 'stats'" class="tooltip-page">
              <div class="word-count-grid">
                <div class="grid-item">
                  <div class="grid-item-row">
                    <span class="grid-number">{{ wordCount.word || 0 }}</span>
                    <svg class="grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 7V4h3"/>
                      <path d="M20 7V4h-3"/>
                      <path d="M4 17v3h3"/>
                      <path d="M20 17v3h-3"/>
                    </svg>
                  </div>
                  <div class="grid-label">Words</div>
                </div>
                <div class="grid-item">
                  <div class="grid-item-row">
                    <span class="grid-number">{{ wordCount.character || 0 }}</span>
                    <svg class="grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 7V4h16v3"/>
                      <path d="M9 20h6"/>
                      <path d="M12 4v16"/>
                    </svg>
                  </div>
                  <div class="grid-label">Characters</div>
                </div>
                <div class="grid-item">
                  <div class="grid-item-row">
                    <span class="grid-number">{{ wordCount.paragraph || 0 }}</span>
                    <svg class="grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M8 6h13"/>
                      <path d="M8 12h13"/>
                      <path d="M8 18h13"/>
                      <path d="M3 6h.01"/>
                      <path d="M3 12h.01"/>
                      <path d="M3 18h.01"/>
                    </svg>
                  </div>
                  <div class="grid-label">Paragraphs</div>
                </div>
              </div>
              <div class="file-timestamps" v-if="birthTime || mtime">
                <div class="timestamp-item" v-if="birthTime">
                  <span class="timestamp-label">Created:</span>
                  <span class="timestamp-value">{{ formatDate(birthTime) }}</span>
                </div>
                <div class="timestamp-item" v-if="mtime">
                  <span class="timestamp-label">Modified:</span>
                  <span class="timestamp-value">{{ formatDate(mtime) }}</span>
                </div>
              </div>
            </div>
            
            <!-- TOC Page -->
            <div v-else-if="activeTooltipTab === 'toc'" class="tooltip-page toc-page">
              <div v-if="listToc.length" class="toc-list">
                <div 
                  v-for="item in listToc" 
                  :key="item.slug"
                  class="toc-item"
                  :style="{ paddingLeft: (item.lvl - 1) * 12 + 'px' }"
                  @click="handleTocClick(item.slug)"
                >
                  {{ item.content }}
                </div>
              </div>
              <div v-else class="toc-empty">
                No headings found
              </div>
            </div>
          </div>
        </template>
        <div class="word-count">
          {{ wordCountDisplay }}
        </div>
      </el-tooltip>
      <div v-else class="word-count">
        {{ wordCountDisplay }}
      </div>
      <button class="footer-btn text-btn" @click="handleOpenSettings" title="Settings">
        SETTING
      </button>
      <div class="file-dropdown-container" ref="fileDropdownContainer">
        <button class="footer-btn text-btn" @click="toggleFileDropdown" title="Opened Files">
          FILE
        </button>
        <div v-show="showFileDropdown" class="file-dropdown">
          <div class="file-dropdown-header">
            <span>OPENED({{ tabs.length }})</span>
            <div class="header-actions">
              <svg class="action-icon" aria-hidden="true" @click.stop="newFile()" title="New Tab">
                <use xlink:href="#icon-plus"></use>
              </svg>
              <svg
                class="action-icon"
                aria-hidden="true"
                @click.stop="saveAll(false)"
                title="Save All"
              >
                <use xlink:href="#icon-save-all"></use>
              </svg>
              <svg
                class="action-icon"
                aria-hidden="true"
                @click.stop="saveAll(true)"
                title="Close All"
              >
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
              <svg class="close-icon" aria-hidden="true" @click.stop="closeFile(file)">
                <use xlink:href="#icon-close-small"></use>
              </svg>
              <span class="file-name">{{ file.filename }}</span>
            </div>
          </div>
        </div>
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

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLayoutStore } from '@/store/layout'
import { usePreferencesStore } from '@/store/preferences'
import { useEditorStore } from '@/store/editor'
import { railscastsThemes, oneDarkThemes } from '@/util/themeColor'
import bus from '@/bus'

const layoutStore = useLayoutStore()
const preferencesStore = usePreferencesStore()
const editorStore = useEditorStore()

const { showSideBar } = storeToRefs(layoutStore)
const { footerBarLayout, footerBarCustomIcons, sourceCode, theme } = storeToRefs(preferencesStore)
const { tabs, currentFile } = storeToRefs(editorStore)

const showFileDropdown = ref(false)
const fileDropdownContainer = ref(null)

const groupedLayout = computed(() => {
  if (!footerBarLayout.value) return []
  const groups = []
  let currentGroup = []
  footerBarLayout.value
    .split(',')
    .map((s) => s.trim())
    .forEach((item) => {
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
})

const wordCount = computed(() => currentFile.value?.wordCount)

const tooltipEffect = computed(() => {
  const currentTheme = theme.value
  const isDarkTheme =
    railscastsThemes.includes(currentTheme) || oneDarkThemes.includes(currentTheme)
  return isDarkTheme ? 'dark' : 'light'
})

const wordCountDisplay = computed(() => {
  if (!wordCount.value) return '0W / 0C / 0P'
  const word = wordCount.value.word || 0
  const character = wordCount.value.character || 0
  const paragraph = wordCount.value.paragraph || 0
  return `${word}W / ${character}C / ${paragraph}P`
})

// File timestamps
const birthTime = computed(() => currentFile.value?.birthTime)
const mtime = computed(() => currentFile.value?.mtime)

// Tooltip tab switching
const activeTooltipTab = ref('stats') // 'stats' or 'toc'
const { toc, listToc } = storeToRefs(editorStore)

const formatDate = (date) => {
  if (!date) return '--'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleTocClick = (slug) => {
  bus.emit('scroll-to-header', slug)
}

const toggleSideBar = () => {
  bus.emit('view:toggle-layout-entry', 'showSideBar')
}

const handleFormat = (type) => {
  bus.emit('format', type)
}

const handleParagraph = (type) => {
  if (type === 'table') {
    // 快速插入的方法比弹出插入更符合直觉和易用性
    // 找到编辑器实例并直接唤起表格选择器
    bus.emit('quick-insert-table')
  } else {
    bus.emit('paragraph', type)
  }
}

const handleOpenSettings = () => {
  window.electron.ipcRenderer.send('mt::open-setting-window')
}

const toggleSourceCode = () => {
  const newValue = !sourceCode.value
  preferencesStore.SET_USER_PREFERENCE({ sourceCode: newValue })
}

const toggleFileDropdown = () => {
  showFileDropdown.value = !showFileDropdown.value
}

const selectFile = (file) => {
  if (file.id !== currentFile.value.id) {
    editorStore.UPDATE_CURRENT_FILE(file)
  }
  showFileDropdown.value = false
}

const closeFile = (file) => {
  if (file.isSaved) {
    editorStore.FORCE_CLOSE_TAB(file)
  } else {
    editorStore.CLOSE_UNSAVED_TAB(file)
  }
}

const newFile = () => {
  editorStore.NEW_UNTITLED_TAB({})
}

const saveAll = (closeTabs) => {
  editorStore.ASK_FOR_SAVE_ALL(closeTabs)
}

const handleClickOutside = (event) => {
  if (fileDropdownContainer.value && !fileDropdownContainer.value.contains(event.target)) {
    showFileDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
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
  box-sizing: border-box;
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

.custom-svg-wrapper :deep(svg) {
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
  left: -90px;
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

/* Word count tooltip styles - Bear-style grid layout */
/* Override Element UI tooltip colors to match theme */

.word-count-tooltip,
.el-tooltip__content {
  padding: 16px !important;
  background: var(--floatBgColor) !important;
  border: 1px solid var(--floatBorderColor);
  border-radius: 8px;
  box-shadow: var(--floatShadow);
}

/* Fixed size for tooltip to prevent jumping between pages */
.word-count-tooltip-content {
  width: 240px;
  height: 160px;
}

/* Three-grid layout for word count statistics */
.word-count-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 16px;
  min-width: 180px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.grid-item-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.grid-number {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}

.grid-icon {
  width: 14px;
  height: 14px;
  color: #999;
  flex-shrink: 0;
}

.grid-label {
  font-size: 12px;
  color: #999;
  line-height: 1.2;
}

/* Dark theme adjustments - Element Plus dark tooltip */
.el-popper.is-dark .grid-number,
.el-tooltip__content.is-dark .grid-number {
  color: #fff;
}

.el-popper.is-dark .grid-icon,
.el-popper.is-dark .grid-label,
.el-tooltip__content.is-dark .grid-icon,
.el-tooltip__content.is-dark .grid-label {
  color: #aaa;
}

/* File timestamps */
.file-timestamps {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--floatBorderColor);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timestamp-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 11px;
}

.timestamp-label {
  color: #999;
}

.timestamp-value {
  color: #1a1a1a;
  font-weight: 500;
}

.el-popper.is-dark .timestamp-value,
.el-tooltip__content.is-dark .timestamp-value {
  color: #fff;
}

.el-popper.is-dark .timestamp-label,
.el-tooltip__content.is-dark .timestamp-label {
  color: #aaa;
}

/* Divider line in dark mode */
.el-popper.is-dark .file-timestamps,
.el-tooltip__content.is-dark .file-timestamps {
  border-top-color: rgba(255, 255, 255, 0.15);
}

/* Tooltip Tab Switcher */
.tooltip-tab-switcher {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--floatBorderColor);
}

.tooltip-tab-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  color: #999;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tooltip-tab-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tooltip-tab-btn.active {
  color: #1a1a1a;
  background: rgba(0, 0, 0, 0.08);
}

.tab-icon {
  width: 16px;
  height: 16px;
}

/* Tooltip Pages */
.tooltip-page {
  height: 110px;
  overflow: hidden;
}

/* TOC Page */
.toc-page {
  overflow-y: auto;
  overflow-x: hidden;
}

.toc-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toc-item {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.2s;
}

.toc-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.toc-empty {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

/* Dark theme for tab switcher */
.el-popper.is-dark .tooltip-tab-btn,
.el-tooltip__content.is-dark .tooltip-tab-btn {
  color: #888;
}

.el-popper.is-dark .tooltip-tab-btn:hover,
.el-tooltip__content.is-dark .tooltip-tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.el-popper.is-dark .tooltip-tab-btn.active,
.el-tooltip__content.is-dark .tooltip-tab-btn.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.el-popper.is-dark .tooltip-tab-switcher,
.el-tooltip__content.is-dark .tooltip-tab-switcher {
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.el-popper.is-dark .toc-item,
.el-tooltip__content.is-dark .toc-item {
  color: #ccc;
}

.el-popper.is-dark .toc-item:hover,
.el-tooltip__content.is-dark .toc-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.el-popper.is-dark .toc-empty,
.el-tooltip__content.is-dark .toc-empty {
  color: #888;
}

/* Ensure tooltip follows theme colors properly */
.el-tooltip__content {
  background: var(--floatBgColor) !important;
  border-color: var(--floatBorderColor) !important;
  color: var(--editorColor) !important;
}
</style>
