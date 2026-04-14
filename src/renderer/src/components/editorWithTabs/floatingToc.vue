<template>
<div ref="tocContainerRef" class="floating-toc-outer">
  <div
    v-for="item in filteredListToc"
    :key="item.slug"
    :ref="el => setCapsuleRef(el, item.slug)"
    class="toc-capsule"
    :class="[`level-${item.lvl}`, { active: isActive(item.slug) }]"
    :style="{ width: getCapsuleWidth(item.lvl) + 'px' }"
    @click="handleClick(item.slug)"
  >
    <span class="toc-label">{{ truncateTitle(item.content) }}</span>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useEditorStore } from '@/store/editor'
import { storeToRefs } from 'pinia'
import bus from '@/bus'

const editorStore = useEditorStore()
const { listToc, currentFile, tabs, tabIdToIndex } = storeToRefs(editorStore)

const activeSlug = ref('')
const activePath = ref([]) // Store all parent slugs of the active heading
const tocContainerRef = ref(null)
const capsuleRefs = ref({})
const BASE_WIDTH = 40
const USER_SCROLL_COOLDOWN = 1000 // ms to wait after user stops scrolling before auto-scroll

let isUserScrolling = false
let userScrollTimeout = null

const setCapsuleRef = (el, slug) => {
  if (el) capsuleRefs.value[slug] = el
}

// Handle user scroll on TOC container
const handleTocScroll = () => {
  isUserScrolling = true
  if (userScrollTimeout) clearTimeout(userScrollTimeout)
  userScrollTimeout = setTimeout(() => {
    isUserScrolling = false
    // Re-trigger auto-scroll after cooldown
    if (activeSlug.value) {
      scrollTocToActive(activeSlug.value)
    }
  }, USER_SCROLL_COOLDOWN)
}

// Truncate to 11 Chinese chars (English=0.5 each, ellipsis=0.5)
const truncateTitle = (title) => {
  if (!title) return ''
  const isCJK = (c) => /[\u4e00-\u9fa5]/.test(c)
  let w = 0, i = 0
  for (; i < title.length; i++) {
    const cw = isCJK(title[i]) ? 1 : 0.5
    if (w + cw > 10.5) break
    w += cw
  }
  return i >= title.length ? title : title.slice(0, i) + '…'
}

// Filter out level 1 headings (h1)
const filteredListToc = computed(() => {
  return listToc.value.filter(item => item.lvl >= 2)
})

const getCapsuleWidth = (lvl) => BASE_WIDTH / Math.pow(2, lvl - 1)
const handleClick = (slug) => bus.emit('scroll-to-header', slug)

// Check if a capsule should be active (itself or any of its descendants)
const isActive = (slug) => {
  return activeSlug.value === slug || activePath.value.includes(slug)
}

// Find parent headings for a given slug in the TOC hierarchy
const findParentPath = (targetSlug) => {
  const parents = []
  let targetIndex = -1
  let targetLevel = 0
  
  // Find the target heading index and its level
  for (let i = 0; i < listToc.value.length; i++) {
    if (listToc.value[i].slug === targetSlug) {
      targetIndex = i
      targetLevel = listToc.value[i].lvl
      break
    }
  }
  
  if (targetIndex < 0 || targetLevel <= 2) return parents
  
  // Scan backwards from target to find all ancestors
  let lastParentLevel = targetLevel
  for (let i = targetIndex - 1; i >= 0; i--) {
    const item = listToc.value[i]
    // Find the closest heading at each parent level
    if (item.lvl < lastParentLevel && item.lvl >= 2) {
      parents.unshift(item.slug)
      lastParentLevel = item.lvl
      if (item.lvl <= 2) break // Reached top level
    }
  }
  
  return parents
}

const OFFSET_Y = 300

const updateActiveHeader = () => {
  const { id } = currentFile.value
  if (!id || !(id in tabIdToIndex.value)) return
  const tab = tabs.value[tabIdToIndex.value[id]]
  if (!tab || !tab.scrollTop) return

  const editorEl = document.querySelector('.editor-component')
  if (!editorEl) return

  const headings = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length === 0) return

  const scrollTop = tab.scrollTop
  const editorHeight = editorEl.clientHeight
  const scrollProgress = scrollTop / (editorEl.scrollHeight - editorHeight)

  // Find the last heading that passed the offset threshold
  let currentHeading = null
  for (const heading of headings) {
    const rect = heading.getBoundingClientRect()
    const editorRect = editorEl.getBoundingClientRect()
    const relativeTop = rect.top - editorRect.top + scrollTop
    if (relativeTop <= scrollTop + OFFSET_Y) {
      currentHeading = heading
    } else {
      break
    }
  }
  
  // When at top of document (< 10% scrolled) and no heading passed offset, use first visible
  if (!currentHeading && scrollProgress < 0.1) {
    for (const heading of headings) {
      const item = listToc.value.find(t => t.slug === heading.id)
      if (item && item.lvl >= 2) {
        currentHeading = heading
        break
      }
    }
  }
  
  if (currentHeading) {
    activeSlug.value = currentHeading.id
    activePath.value = findParentPath(currentHeading.id)
    
  // Auto-scroll TOC to keep active heading visible (but not during user scroll)
  if (!isUserScrolling) {
    scrollTocToActive(currentHeading.id)
  }
  }
}

// Auto-scroll TOC container to keep active heading and its parents in view
const scrollTocToActive = (slug) => {
  const container = tocContainerRef.value
  const capsule = capsuleRefs.value[slug]
  if (!container || !capsule) return
  
  const containerRect = container.getBoundingClientRect()
  const containerScrollTop = container.scrollTop
  const visibleHeight = containerRect.height
  
  // Get all visible capsules (active + its parents)
  const visibleSlugs = [slug, ...activePath.value]
  let minTop = Infinity
  let maxBottom = -Infinity
  
  for (const s of visibleSlugs) {
    const el = capsuleRefs.value[s]
    if (el) {
      const rect = el.getBoundingClientRect()
      const top = rect.top - containerRect.top + containerScrollTop
      const bottom = top + rect.height
      minTop = Math.min(minTop, top)
      maxBottom = Math.max(maxBottom, bottom)
    }
  }
  
  if (minTop === Infinity) return
  
  const visibleTop = containerScrollTop
  const visibleBottom = containerScrollTop + visibleHeight
  
  // If the range is above visible area, scroll up to show the topmost (parent)
  if (minTop < visibleTop) {
    container.scrollTo({ top: minTop - 20, behavior: 'smooth' })
  }
  // If the range is below visible area, scroll down to show the bottommost (current)
  else if (maxBottom > visibleBottom) {
    container.scrollTo({ top: maxBottom - visibleHeight + 20, behavior: 'smooth' })
  }
}

let animationId = null

onMounted(() => {
  const updateScroll = () => {
    updateActiveHeader()
    animationId = requestAnimationFrame(updateScroll)
  }
  updateScroll()
  
  // Listen for user scroll on TOC container
  if (tocContainerRef.value) {
    tocContainerRef.value.addEventListener('scroll', handleTocScroll)
  }
})
onBeforeUnmount(() => { 
  if (animationId) cancelAnimationFrame(animationId)
  if (userScrollTimeout) clearTimeout(userScrollTimeout)
  if (tocContainerRef.value) {
    tocContainerRef.value.removeEventListener('scroll', handleTocScroll)
  }
})
</script>

<style scoped>
.floating-toc-outer {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 50vh;
  width: 200px; /* Increased width to accommodate titles */
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 99999;
  padding: 20px 16px 20px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

/* Hide scrollbar */
.floating-toc-outer::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

.toc-capsule {
  position: relative;
  height: 4px;
  border-radius: 2px;
  background-color: rgba(128, 128, 128, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

/* Invisible hit area that connects but doesn't overlap */
/* gap is 12px, capsule height is 4px, so center spacing is 16px */
/* extend 6px each side to make hit area 16px total, just touching neighbors */
/* All hit areas have same width (40px = level-2 width) regardless of capsule size */
.toc-capsule::before {
  content: '';
  position: absolute;
  right: 0;
  top: -6px;
  bottom: -6px;
  width: 40px;
  z-index: 1;
}

.toc-capsule:hover {
  background-color: rgba(100, 100, 100, 0.9);
}

/* Title label shown next to capsule - hidden by default */
/* All labels right-aligned at 20px position */
.toc-label {
  position: absolute;
  right: 20px; /* Align all labels to same right edge */
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 12px;
  color: var(--sideBarColor);
  opacity: 0;
  cursor: pointer;
  text-align: right;
  transition: opacity 0.2s ease;
}

/* Show all titles when hovering the TOC container */
.floating-toc-outer:hover .toc-label {
  opacity: 0.5;
}

/* Active capsule title uses theme color and is more visible */
.toc-capsule.active .toc-label {
  color: var(--themeColor);
}

.floating-toc-outer:hover .toc-capsule.active .toc-label {
  opacity: 1;
}

.toc-capsule.active {
  background-color: var(--themeColor);
}

.toc-capsule.level-1 { background-color: rgba(100, 100, 100, 0.4); }
.toc-capsule.level-2,
.toc-capsule.level-3 { background-color: rgba(100, 100, 100, 0.25); }
.toc-capsule.level-4,
.toc-capsule.level-5,
.toc-capsule.level-6 { background-color: rgba(100, 100, 100, 0.15); }

.toc-capsule.active.level-1,
.toc-capsule.active.level-2,
.toc-capsule.active.level-3,
.toc-capsule.active.level-4,
.toc-capsule.active.level-5,
.toc-capsule.active.level-6 { background-color: var(--themeColor); }

.toc-capsule.level-1:hover,
.toc-capsule.level-2:hover,
.toc-capsule.level-3:hover,
.toc-capsule.level-4:hover,
.toc-capsule.level-5:hover,
.toc-capsule.level-6:hover { background-color: rgba(100, 100, 100, 0.9); }
</style>