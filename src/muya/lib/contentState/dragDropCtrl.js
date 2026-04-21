import { findNearestParagraph, findOutMostParagraph } from '../selection/dom'
import {
  verticalPositionInRect,
  getUniqueId,
  getImageInfo as getImageSrc,
  checkImageContentType
} from '../utils'
import { getImageInfo } from '../utils/getImageInfo'
import { URL_REG, IMAGE_EXT_REG } from '../config'

const GHOST_ID = 'mu-dragover-ghost'
const BLOCK_DROP_INDICATOR_ID = 'mu-block-drop-indicator'
const GHOST_HEIGHT = 3

const dragDropCtrl = (ContentState) => {
  ContentState.prototype.hideGhost = function () {
    this.dropAnchor = null
    const ghost = document.querySelector(`#${GHOST_ID}`)
    ghost && ghost.remove()
  }

  /**
   * Block drag handle: mouse down handler
   */
  ContentState.prototype.blockDragStartHandler = function (event) {
    event.preventDefault()
    const { target } = event
    const dragHandle = target.closest('.ag-drag-handle')
    if (!dragHandle) return

    const frontIcon = dragHandle.closest('.ag-front-icon')
    if (!frontIcon) return

    // Find the paragraph element
    const paragraph = frontIcon.parentElement
    if (!paragraph) return

    const block = this.getBlock(paragraph.id)
    if (!block) return

    const outmostBlock = this.findOutMostBlock(block)
    if (!outmostBlock) return

    // Store drag info
    this.dragBlockInfo = {
      block: outmostBlock,
      startClientY: event.clientY,
      startClientX: event.clientX,
      paragraphEl: paragraph
    }

    // Add dragging style
    paragraph.classList.add('ag-block-dragging')

    // Bind global mousemove and mouseup (same pattern as tableDragBarCtrl)
    const { eventCenter } = this.muya
    const mouseMoveId = eventCenter.attachDOMEvent(
      document,
      'mousemove',
      this.blockDragOverHandler.bind(this)
    )
    const mouseUpId = eventCenter.attachDOMEvent(
      document,
      'mouseup',
      this.blockDragEndHandler.bind(this)
    )
    this.dragBlockEventIds = [mouseMoveId, mouseUpId]
  }

  /**
   * Block drag handle: mouse move handler
   */
  ContentState.prototype.blockDragOverHandler = function (event) {
    if (!this.dragBlockInfo) return

    const { startClientY } = this.dragBlockInfo
    if (Math.abs(event.clientY - startClientY) < 5) return

    // Find target block under cursor
    // Temporarily hide dragging element so elementFromPoint can find elements underneath
    const { paragraphEl } = this.dragBlockInfo
    const originalDisplay = paragraphEl.style.display
    paragraphEl.style.display = 'none'
    let targetEl = document.elementFromPoint(event.clientX, event.clientY)
    paragraphEl.style.display = originalDisplay

    if (!targetEl) {
      this.hideBlockDropIndicator()
      this.dropBlockIndicator = null
      return
    }

    // Find nearest paragraph/outmost block
    const targetParagraph = targetEl.closest('[id^="ag-"]')
    if (!targetParagraph || !targetParagraph.id) {
      this.hideBlockDropIndicator()
      this.dropBlockIndicator = null
      return
    }

    const targetBlock = this.getBlock(targetParagraph.id)
    if (!targetBlock) {
      this.hideBlockDropIndicator()
      this.dropBlockIndicator = null
      return
    }

    const targetOutmost = this.findOutMostBlock(targetBlock)
    if (!targetOutmost || targetOutmost.key === this.dragBlockInfo.block.key) {
      this.hideBlockDropIndicator()
      this.dropBlockIndicator = null
      return
    }

    // Determine position (before or after)
    const rect = targetParagraph.getBoundingClientRect()
    const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'

    this.dropBlockIndicator = {
      targetBlock: targetOutmost,
      position
    }

    this.showBlockDropIndicator(targetParagraph, position)
  }

  /**
   * Show drop indicator line
   */
  ContentState.prototype.showBlockDropIndicator = function (targetEl, position) {
    let indicator = document.querySelector(`#${BLOCK_DROP_INDICATOR_ID}`)
    if (!indicator) {
      indicator = document.createElement('div')
      indicator.id = BLOCK_DROP_INDICATOR_ID
      document.body.appendChild(indicator)
    }

    const rect = targetEl.getBoundingClientRect()
    const containerRect = this.muya.container.getBoundingClientRect()

    Object.assign(indicator.style, {
      width: `${rect.width}px`,
      left: `${rect.left}px`,
      top: position === 'before'
        ? `${rect.top - GHOST_HEIGHT}px`
        : `${rect.top + rect.height}px`,
      display: 'block'
    })
  }

  /**
   * Hide drop indicator line
   */
  ContentState.prototype.hideBlockDropIndicator = function () {
    const indicator = document.querySelector(`#${BLOCK_DROP_INDICATOR_ID}`)
    if (indicator) {
      indicator.style.display = 'none'
    }
  }

  /**
   * Block drag handle: mouse up handler
   */
  ContentState.prototype.blockDragEndHandler = function (event) {
    const { eventCenter } = this.muya

    // Detach global event listeners
    if (this.dragBlockEventIds) {
      for (const id of this.dragBlockEventIds) {
        eventCenter.detachDOMEvent(id)
      }
      this.dragBlockEventIds = []
    }

    // Remove dragging style
    if (this.dragBlockInfo && this.dragBlockInfo.paragraphEl) {
      this.dragBlockInfo.paragraphEl.classList.remove('ag-block-dragging')
    }

    // Hide indicator
    this.hideBlockDropIndicator()

    // Check if we have a valid drop target
    if (!this.dragBlockInfo || !this.dropBlockIndicator) {
      this.dragBlockInfo = null
      this.dropBlockIndicator = null
      return
    }

    const { block: draggedBlock } = this.dragBlockInfo
    const { targetBlock, position } = this.dropBlockIndicator

    // Safety check: don't drop on itself
    if (draggedBlock.key === targetBlock.key) {
      this.dragBlockInfo = null
      this.dropBlockIndicator = null
      return
    }

    // Safety check: don't drop if target is descendant of dragged block
    if (this.isInclude(draggedBlock, targetBlock)) {
      this.dragBlockInfo = null
      this.dropBlockIndicator = null
      return
    }

    // Move block using official APIs
    // 1. Remove from current position
    this.removeBlock(draggedBlock)

    // 2. Insert at new position
    if (position === 'before') {
      this.insertBefore(draggedBlock, targetBlock)
    } else {
      this.insertAfter(draggedBlock, targetBlock)
    }

    // 3. Set cursor to the beginning of the moved block
    const cursorBlock = this.firstInDescendant(draggedBlock)
    this.cursor = {
      start: { key: cursorBlock.key, offset: 0 },
      end: { key: cursorBlock.key, offset: 0 },
      isEdit: false // Non-edit operation, push history immediately
    }

    // 4. Full render
    this.render()

    // 5. Dispatch state change
    this.muya.eventCenter.dispatch('stateChange')

    // Cleanup
    this.dragBlockInfo = null
    this.dropBlockIndicator = null
  }
  /**
   * create the ghost element.
   */
  ContentState.prototype.createGhost = function (event) {
    const target = event.target
    let ghost = null
    const nearestParagraph = findNearestParagraph(target)
    const outmostParagraph = findOutMostParagraph(target)

    if (!outmostParagraph) {
      return this.hideGhost()
    }

    const block = this.getBlock(nearestParagraph.id)
    let anchor = this.getAnchor(block)

    // dragover preview container
    if (!anchor && outmostParagraph) {
      anchor = this.getBlock(outmostParagraph.id)
    }

    if (anchor) {
      const anchorParagraph = this.muya.container.querySelector(`#${anchor.key}`)
      const rect = anchorParagraph.getBoundingClientRect()
      const position = verticalPositionInRect(event, rect)
      this.dropAnchor = {
        position,
        anchor
      }
      // create ghost
      ghost = document.querySelector(`#${GHOST_ID}`)
      if (!ghost) {
        ghost = document.createElement('div')
        ghost.id = GHOST_ID
        document.body.appendChild(ghost)
      }

      Object.assign(ghost.style, {
        width: `${rect.width}px`,
        left: `${rect.left}px`,
        top: position === 'up' ? `${rect.top - GHOST_HEIGHT}px` : `${rect.top + rect.height}px`
      })
    }
  }

  ContentState.prototype.dragoverHandler = function (event) {
    // Cancel to allow tab drag&drop.
    if (!event.dataTransfer.types.length) {
      event.dataTransfer.dropEffect = 'none'
      return
    }

    if (event.dataTransfer.types.includes('text/uri-list')) {
      const items = Array.from(event.dataTransfer.items)
      const hasUriItem = items.some((i) => i.type === 'text/uri-list')
      const hasTextItem = items.some((i) => i.type === 'text/plain')
      const hasHtmlItem = items.some((i) => i.type === 'text/html')
      if (hasUriItem && hasHtmlItem && !hasTextItem) {
        this.createGhost(event)
        event.dataTransfer.dropEffect = 'copy'
      }
    }

    if (event.dataTransfer.types.indexOf('Files') >= 0) {
      if (
        event.dataTransfer.items.length === 1 &&
        event.dataTransfer.items[0].type.indexOf('image') > -1
      ) {
        event.preventDefault()
        this.createGhost(event)
        event.dataTransfer.dropEffect = 'copy'
      }
    } else {
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'none'
    }
  }

  ContentState.prototype.dragleaveHandler = function (event) {
    return this.hideGhost()
  }

  ContentState.prototype.dropHandler = async function (event) {
    event.preventDefault()
    const { dropAnchor } = this
    this.hideGhost()
    // handle drag/drop web link image.
    if (event.dataTransfer.items.length) {
      for (const item of event.dataTransfer.items) {
        if (item.kind === 'string' && item.type === 'text/uri-list') {
          item.getAsString(async (str) => {
            if (URL_REG.test(str) && dropAnchor) {
              let isImage = false
              if (IMAGE_EXT_REG.test(str)) {
                isImage = true
              }
              if (!isImage) {
                isImage = await checkImageContentType(str)
              }
              if (!isImage) return
              const text = `![](${str})`
              const imageBlock = this.createBlockP(text)
              const { anchor, position } = dropAnchor
              if (position === 'up') {
                this.insertBefore(imageBlock, anchor)
              } else {
                this.insertAfter(imageBlock, anchor)
              }

              const key = imageBlock.children[0].key
              const offset = 0
              this.cursor = {
                start: { key, offset },
                end: { key, offset },
                isEdit: true
              }
              this.render()
              this.muya.eventCenter.dispatch('stateChange')
            }
          })
        }
      }
    }

    if (event.dataTransfer.files) {
      const fileList = []
      for (const file of event.dataTransfer.files) {
        fileList.push(file)
      }
      const image = fileList.find((file) => /image/.test(file.type))
      if (image && dropAnchor) {
        const { name } = image
        const path = window.electron.webUtils.getPathForFile(image)
        const id = `loading-${getUniqueId()}`
        const text = `![${id}](${path})`
        const imageBlock = this.createBlockP(text)
        const { anchor, position } = dropAnchor
        if (position === 'up') {
          this.insertBefore(imageBlock, anchor)
        } else {
          this.insertAfter(imageBlock, anchor)
        }

        const key = imageBlock.children[0].key
        const offset = 0
        this.cursor = {
          start: { key, offset },
          end: { key, offset },
          isEdit: true
        }
        this.render()

        try {
          const newSrc = await this.muya.options.imageAction(path, id, name)
          const { src } = getImageSrc(path)
          if (src) {
            this.stateRender.urlMap.set(newSrc, src)
          }
          const imageWrapper = this.muya.container.querySelector(`span[data-id=${id}]`)

          if (imageWrapper) {
            const imageInfo = getImageInfo(imageWrapper)
            this.replaceImage(imageInfo, {
              alt: name,
              src: newSrc
            })
          }
        } catch (error) {
          // TODO: Notify user about an error.
          console.error('Unexpected error on image action:', error)
        }
      }
      this.muya.eventCenter.dispatch('stateChange')
    }
  }
}

export default dragDropCtrl
