import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const themesDir = path.join(rootDir, 'src', 'renderer', 'src', 'assets', 'themes')
const outputFile = path.join(rootDir, 'src', 'common', 'themes.json')

function getThemeNames(subdir) {
  const dir = path.join(themesDir, subdir)
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`)
    return []
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.theme.css'))
    .map((f) => f.replace('.theme.css', ''))
    .sort()
}

const lightThemes = getThemeNames('light')
const darkThemes = getThemeNames('dark')

const config = {
  light: ['light', ...lightThemes],
  dark: darkThemes
}

fs.writeFileSync(outputFile, JSON.stringify(config, null, 2))
console.log(
  `Generated theme config with ${config.light.length} light themes and ${config.dark.length} dark themes`
)
