import { access } from 'fs/promises'
import { existsSync, lstatSync, mkdirSync, readlinkSync } from 'fs'
import { resolve, dirname } from 'path'

/**
 * Test whether or not the given path exists.
 *
 * @param {string} p The path to the file or directory.
 * @returns {boolean}
 */
export const exists = async (p) => {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

/**
 * Ensure that a directory exist.
 *
 * @param {string} dirPath The directory path.
 */
export const ensureDirSync = (dirPath) => {
  try {
    mkdirSync(dirPath, { recursive: true })
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e
    }
  }
}

/**
 * Returns true if the path is a directory with read access.
 *
 * @param {string} dirPath The directory path.
 */
export const isDirectory = (dirPath) => {
  try {
    return existsSync(dirPath) && lstatSync(dirPath).isDirectory()
  } catch {
    return false
  }
}

/**
 * Returns true if the path is a directory or a symbolic link to a directory with read access.
 *
 * @param {string} dirPath The directory path.
 */
export const isDirectory2 = (dirPath) => {
  try {
    if (!existsSync(dirPath)) {
      return false
    }

    const fi = lstatSync(dirPath)
    if (fi.isDirectory()) {
      return true
    } else if (fi.isSymbolicLink()) {
      const targetPath = resolve(dirname(dirPath), readlinkSync(dirPath))
      return isDirectory(targetPath)
    }
    return false
  } catch {
    return false
  }
}

/**
 * Returns true if the path is a file with read access.
 *
 * @param {string} filepath The file path.
 */
export const isFile = (filepath) => {
  try {
    return existsSync(filepath) && lstatSync(filepath).isFile()
  } catch {
    return false
  }
}

/**
 * Returns true if the path is a file or a symbolic link to a file with read access.
 *
 * @param {string} filepath The file path.
 */
export const isFile2 = (filepath) => {
  try {
    if (!existsSync(filepath)) {
      return false
    }

    const fi = lstatSync(filepath)
    if (fi.isFile()) {
      return true
    } else if (fi.isSymbolicLink()) {
      const targetPath = resolve(dirname(filepath), readlinkSync(filepath))
      return isFile(targetPath)
    }
    return false
  } catch {
    return false
  }
}

/**
 * Returns true if the path is a symbolic link with read access.
 *
 * @param {string} filepath The link path.
 */
export const isSymbolicLink = (filepath) => {
  try {
    return existsSync(filepath) && lstatSync(filepath).isSymbolicLink()
  } catch {
    return false
  }
}
