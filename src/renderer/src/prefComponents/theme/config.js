import { lightThemeNames, darkThemeNames } from '../../util/themeColor'

// Dynamically generate theme list from folder structure
// Light themes first, then dark themes (both alphabetical)
export const themes = [
  ...lightThemeNames.map((name) => ({ name })),
  ...darkThemeNames.map((name) => ({ name }))
]

// getAutoSwitchThemeOptions removed - no longer needed
// We now use a boolean toggle for followSystemTheme instead of a dropdown
