const IMAGE_EXT_REG = /\.(apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i

export const guessClipboardFilePath = async () => {
  try {
    const text = await window.electron.clipboard.readText()
    const filePath = String(text || '').trim()
    if (
      filePath &&
      IMAGE_EXT_REG.test(filePath) &&
      window.fileUtils &&
      (await window.fileUtils.isFile(filePath))
    ) {
      return filePath
    }
  } catch (_) {}
  return ''
}
