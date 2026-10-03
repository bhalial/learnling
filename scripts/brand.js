/**
 * electron-builder afterPack hook: puts the icon and version details into the app's exe.
 *
 * electron-builder's own exe editing is off (signAndEditExecutable: false): it needs a
 * code-signing toolchain whose archive contains symlinks, which Windows only lets you
 * unpack in Developer Mode. rcedit does the same job. Running it here, between packing
 * and building the installer, means the exe inside the installer is the branded one.
 */
const { join } = require('node:path')

exports.default = async function brand(context) {
  if (context.electronPlatformName !== 'win32') return
  const { productName, version } = context.packager.appInfo
  const { rcedit } = await import('rcedit') // rcedit is pure ESM
  await rcedit(join(context.appOutDir, `${productName}.exe`), {
    icon: join(__dirname, '..', 'resources', 'icon.ico'),
    'version-string': {
      ProductName: productName,
      FileDescription: productName,
      CompanyName: 'Jeroen Stengs',
      OriginalFilename: `${productName}.exe`,
      LegalCopyright: `© ${new Date().getFullYear()} Jeroen Stengs`
    },
    'file-version': version,
    'product-version': version
  })
  console.log(`  • branded ${productName}.exe`)
}
