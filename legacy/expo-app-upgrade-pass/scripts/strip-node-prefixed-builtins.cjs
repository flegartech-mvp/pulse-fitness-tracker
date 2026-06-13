const moduleBuiltinModules = require('module').builtinModules;

if (Array.isArray(moduleBuiltinModules)) {
  require('module').builtinModules = moduleBuiltinModules.filter(
    moduleName => !moduleName.startsWith('node:')
  );
}
