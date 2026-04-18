import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { ensureDirSync } from 'common/filesystem'

/**
 * Get the source directory for preset themes.
 * In dev mode: project root static/themes/
 * In production: resources/static/themes/
 */
const getPresetThemesDir = () => {
  if (!app.isPackaged) {
    // Dev mode: relative to project root (cwd is project root when running electron-vite)
    return path.join(process.cwd(), 'static', 'themes')
  }
  // Production: inside app resources
  return path.join(process.resourcesPath, 'static', 'themes')
}

const copyDirRecursive = (src, dest) => {
  ensureDirSync(dest)
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * Copy preset themes to user data directory on first launch.
 * Only copies if userDataPath/themes/ doesn't exist yet.
 */
export const copyPresetsIfNeeded = (userDataPath) => {
  const userThemesDir = path.join(userDataPath, 'themes')

  // If user themes directory already exists, skip
  // (respect user's customizations - user may have deleted/modified presets)
  if (fs.existsSync(userThemesDir)) {
    return
  }

  const presetDir = getPresetThemesDir()
  if (!fs.existsSync(presetDir)) {
    console.warn('Preset themes directory not found:', presetDir)
    return
  }

  try {
    copyDirRecursive(presetDir, userThemesDir)
    console.log('Copied preset themes to:', userThemesDir)
  } catch (err) {
    console.error('Failed to copy preset themes:', err)
  }
}
