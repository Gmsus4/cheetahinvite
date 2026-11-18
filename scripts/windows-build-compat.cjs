/* eslint-disable @typescript-eslint/no-require-imports -- Windows-only OpenNext build compatibility. */
// OpenNext links traced package directories without specifying their type.
// Windows directory junctions work without Developer Mode/admin symlink privilege.
if (process.platform === 'win32') {
  const fs = require('node:fs'), path = require('node:path');
  const symlink = fs.symlinkSync;
  fs.symlinkSync = function(target, destination, type) {
    const resolved = path.resolve(path.dirname(destination), target);
    if (!type && fs.statSync(resolved).isDirectory()) return symlink(resolved, destination, 'junction');
    return symlink(target, destination, type);
  };
  require('node:module').syncBuiltinESMExports();
}
