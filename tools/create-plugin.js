'use strict';

var writeFile = require('fs').writeFile
  , prompt = require('prompt')
  , bash = require('shelljs').exec
  , cd = process.chdir;

/**
 * This script generates a scaffold for a plugin application. For example, if
 * you want to create a plugin with the name 'helion.my-app', run:
 * ```
 * node create-plugin
 * ```
 * You will be prompted for a unique plugin application name. On submit,
 * it will create the following file structure:
 * ```
 * plugins
 *  └── helion.my-app
 *       ├── api
 *       │   └── api.module.js
 *       ├── event
 *       │   └── event.module.js
 *       ├── model
 *       │   └── model.module.js
 *       ├── view
 *       │   └── view.module.js
 *       ├── helion.my-app.module.js
 *       ├── helion.my-app.scss
 *       └── plugin.config.js
 * ```
 * Finally, run the default Gulp task to integrate the plugin with the UI platform:
 * ```
 *   node_modules/.bin/gulp
 * ```
 */

prompt.start();

prompt.get(['Input a unique plugin application name'], function (err, result) {
  var plugininName = result['Input a unique plugin application name'];

  cd('../src/plugins');

  // Create a directory with the plugin application name
  mkdir(plugininName);
  cd(plugininName);

  createPluginConfigFile();

  // Create `helion.my-app.scss`
  createRootScssFile(plugininName + '.scss');

  /**
   * Create directories: `api`, `event`, `model`, `view`
   * Create Angular module files: `api/api.module.js`, `event/event.module.js`,
   * `model/model.module.js`, `view/view.module.js`
   */
  ['api', 'event', 'model', 'view'].forEach(function (one) {
    mkdir(one);
    createModuleFile(one, one, plugininName + '.' + one, null);
  });

  createModuleFile('.', plugininName, plugininName, ['api', 'event', 'model', 'view']);

  function createPluginConfigFile() {
    var code = [
      "  env && env.registerApplication\n      && env.registerApplication(" +
       [plugininName, plugininName, 'plugins/' + plugininName]
         .map(asString).join(', ') + ");"
    ];

    createJavaScriptFile('plugin.config.js', code);
  }

  /**
   * Create an Angular module file, in given folder, with given file name,
   * Angular module name, and dependent sub-module names.
   *
   * @param {string} folderName - the folder name
   * @param {string} fileName - the generated file name, suffixed with `.module.js`
   * @param {string} moduleName - the generated module name
   * @param {Array} [subModules] - if provided, the generated dependency modules
   * will be prefixed with the generated module name
   *
   * @example
   * createModuleFile('api', 'api', 'my-app.api');
   *
   * // Generates api/api.module.js with code:
   * //
   * // (function () {
   * //   'use strict';
   * //
   * //   angular
   * //     .module('my-app.api', []);
   * //
   * // })();
   *
   * createModuleFile('.', 'my-app', 'helion.my-app',
   *   ['api', 'event', 'model', 'view']);
   *
   * // Generates ./my-app.module.js with code:
   * //
   * // (function () {
   * //   'use strict';
   * //
   * //   angular
   * //     .module('helion.my-app', [
   * //       'helion.my-app.api',
   * //       'helion.my-app.event',
   * //       'helion.my-app.model',
   * //       'helion.my-app.view'
   * //     ]);
   * //
   * // })();
   */
  function createModuleFile(folderName, fileName, moduleName, subModules) {
    subModules = subModules || '';
    if (subModules && subModules.length > 0) {
      subModules = subModules.map(function (subModule) {
        return asString(moduleName + '.' + subModule)
      });
      subModules = subModules && '\n      ' + subModules.join(',\n      ') + '\n    ';
    }
    var code = [
      '  angular',
      '    .module(\'' + moduleName + '\', [' + subModules + ']);'
    ];
    createJavaScriptFile(folderName + '/' + fileName + '.module.js', code);
  }

  /**
   * Create a directory using mkdir
   *
   * @param {string} folderName - the name of the folder to create
   */
  function mkdir(folderName) {
    bash('mkdir -p ' + folderName);
  }

  /**
   * Create a root SCSS file with one comment line in it
   *
   * @param {string} fileName - the SCSS file name
   */
  function createRootScssFile(fileName) {
    var commentLine = '// ' + fileName;
    writeFile(fileName, commentLine);
  }

  /**
   * Create a Javascript file with the given file name and code wrapped in an IIFE
   *
   * @param {string} fileName - the Javascript file name
   * @param {string} code - the JavaScript code
   */
  function createJavaScriptFile(fileName, code) {
    writeFile(fileName, wrapCodeAsIIFE(code));
  }

  /**
   * Wrap code with immediately-invoked function expression
   * ```
   * (function () {
   *   'use strict';
   *
   *   // code goes here
   *
   * })();
   * ```
   *
   * @param {string} code - the code to wrap.
   * @returns {string} The wrapped code
   */
  function wrapCodeAsIIFE(code) {
    if (Array.isArray(code)) {
      code = code.join('\n');
    }
    return [
      '(function () {\n  \'use strict\';\n\n',
      '\n\n})();\n'
    ].join(code);
  }

  /**
   * Wrap a string with single quotes
   *
   * @param {string} str - the string to wrap
   * @returns {string} A single-quoted string
   */
  function asString(str) {
    return ['\'',  '\''].join(str);
  }

});
