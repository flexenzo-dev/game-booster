const path = require('path');

// Embeds the app icon + version metadata into the packaged .exe
// (electron-builder's own edit step is disabled via signAndEditExecutable:false,
//  so we do it here with the bundled rcedit binary — no admin/symlink needed).
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  try {
    const { rcedit } = await import('rcedit');
    const exe = path.join(context.appOutDir, context.packager.appInfo.productFilename + '.exe');
    const ico = path.join(context.packager.projectDir, 'build', 'icon.ico');
    await rcedit(exe, {
      icon: ico,
      'version-string': {
        ProductName: 'GameBoost',
        CompanyName: 'Flexenzo Dev',
        FileDescription: 'GameBoost - neumorphic Windows gaming optimizer',
        LegalCopyright: 'Copyright © 2026 Flexenzo Dev',
        OriginalFilename: 'GameBoost.exe',
        FileVersion: context.packager.appInfo.version,
        ProductVersion: context.packager.appInfo.version,
      },
      'file-version': '1.0.0.0',
      'product-version': '1.0.0.0',
    });
    console.log('  •  embedded icon + version via rcedit');
  } catch (e) {
    console.log('  •  rcedit skipped: ' + e.message);
  }
};
