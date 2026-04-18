import * as actions from '../actions/theme'
import { t } from '../../i18n'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

/**
 * Convert theme name to translation key (camelCase)
 * e.g., 'ayu-light' -> 'ayuLight', 'catppuccin-latte' -> 'catppuccinLatte'
 */
function themeNameToKey(name) {
  // Special cases for legacy naming
  const specialCases = {
    light: 'cadmiumLight',
    dark: 'cadmiumDark'
  }
  if (specialCases[name]) {
    return specialCases[name]
  }
  return name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
}

function getThemeListFromDisk() {
  const userDataPath = app.getPath('userData')
  const themesDir = path.join(userDataPath, 'themes')

  const getNames = (subdir) => {
    const dir = path.join(themesDir, subdir)
    if (!fs.existsSync(dir)) return []
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.theme.css'))
      .map((f) => f.replace('.theme.css', ''))
      .sort()
  }

  return {
    light: ['light', ...getNames('light')],
    dark: ['dark', ...getNames('dark')]
  }
}

function createThemeMenuItem(themeName, currentTheme, isEnabled) {
  const key = themeNameToKey(themeName)
  const label = t(`menu.theme.${key}`) || themeName
  return {
    label,
    type: 'radio',
    id: themeName,
    enabled: isEnabled,
    checked: currentTheme === themeName,
    click(menuItem, browserWindow) {
      actions.selectTheme(themeName)
    }
  }
}

export default function (userPreference) {
  const { theme, followSystemTheme } = userPreference.getAll()
  const isThemeSelectionEnabled = !followSystemTheme

  const submenu = [
    // Follow System Theme
    {
      label: t('preferences.theme.followSystemTheme'),
      type: 'checkbox',
      id: 'follow-system-theme',
      checked: followSystemTheme,
      click(menuItem, browserWindow) {
        actions.setFollowSystemTheme(menuItem.checked)
      }
    }
  ]

  if (!isThemeSelectionEnabled) {
    submenu.push({
      label: t('menu.theme.followThemDisabled'),
      enabled: false
    })
  }

  submenu.push({ type: 'separator' })

  const themeConfig = getThemeListFromDisk()

  // Light Themes submenu
  const lightThemeItems = themeConfig.light.map((name) =>
    createThemeMenuItem(name, theme, isThemeSelectionEnabled)
  )
  submenu.push({
    label: t('menu.theme.lightThemes'),
    id: 'lightThemesMenu',
    submenu: lightThemeItems
  })

  // Dark Themes submenu
  const darkThemeItems = themeConfig.dark.map((name) =>
    createThemeMenuItem(name, theme, isThemeSelectionEnabled)
  )
  submenu.push({
    label: t('menu.theme.darkThemes'),
    id: 'darkThemesMenu',
    submenu: darkThemeItems
  })

  return {
    label: t('menu.theme.theme'),
    id: 'themeMenu',
    submenu
  }
}
