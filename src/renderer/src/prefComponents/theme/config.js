import { lightThemeNames, darkThemeNames } from '../../util/themeColor'

// Generate theme list dynamically (called at runtime after themes are initialized)
export const getThemes = () => [
  ...lightThemeNames.map((name) => ({ name })),
  ...darkThemeNames.map((name) => ({ name }))
]
