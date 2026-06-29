/// Check whether the package is updatable at runtime.
export const isUpdatable = async () => {
  // TODO: t('commands.utils.todoUpdateCheck')

  const resFile = await window.fileUtils.isFile(window.path.join(process.resourcesPath, 'app-update.yml'))
  if (!resFile) {
    // t('commands.utils.noUpdateResourceFile')
    return false
  } else if (process.env.APPIMAGE) {
    // We are running as AppImage.
    return true
  } else if (process.platform === 'win32') {
    // Windows is a little bit tricky; packaged builds may include updater metadata even
    // when the current artifact is not updatable. Keep the setup-marker check.
    return await window.fileUtils.isFile(window.path.join(process.resourcesPath, 'md.ico'))
  }

  // Otherwise assume that we cannot perform an auto update (standalone binary, archives,
  // packed for package manager).
  return false
}
