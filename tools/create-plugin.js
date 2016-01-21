'use strict';

var writeFile = require('fs').writeFile
  , prompt = require('prompt')
  , bash = require('shelljs').exec
  , cd = process.chdir;

/**
 * This script scaffolds a plugin application. For example, if you want to
 * create a plugin with the name helion.my-app, run:
 * ```
 *   node create-plugin
 * ```
 * You will be prompted for a unique plugin application name. On submit,
 * it will create the following file structure:
 * ```
 *   plugins
 *   └── helion.my-app
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

  // create a folder with the module name
  mkdir(plugininName);
  cd(plugininName);

  createPluginConfigFile();

  // create `my-app.scss`
  createRootScssFile(plugininName + '.scss');

  // create folders `api`, `event`, `model`, `view` and files
  // `api/api.module.js`, `event/event.module.js`, `model/model.module.js`, `view/view.module.js`,
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
   * @param folderName {String} the folder name
   * @param fileName {String} the generated file name that will be suffixed with `.module.js`
   * @param moduleName {String} the generated module name that will be prefixed with `helion.`
   * @param subModules {Array}, [optional], if provided, the generated dependency
   * modules will be prefixed with the generated module name.
   *
   * @example
   *
    ```js
    createModuleFile('api', 'api', 'my-app.api');

   // creates api/api.module.js with code:

    (function () {
      'use strict';

      angular
        .module('helion.my-app.api', []);

    })();

    createModuleFile('.', 'my-app.module', 'helion.my-app',
        ['api', 'event', 'model', 'view']);

    // creates ./my-app.module.js with code:

    (function () {
      'use strict';

      angular
        .module('helion.my-app', [
          'helion.my-app.api',
          'helion.my-app.event',
          'helion.my-app.model',
          'helion.my-app.view'
        ]);

    })();
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
      '    .module(\'' +moduleName + '\', [' + subModules + ']);'
    ];
    createJavaScriptFile(folderName + '/' + fileName + '.module.js', code);
  }

  /**
   * Run shell command mkdir
   * @param folderName the name of the folder to create.
   */
  function mkdir(folderName) {
    bash('mkdir -p ' + folderName);
  }

  /**
   * Create a root scss file with one comment line in it
   * @param fileName
   */
  function createRootScssFile(fileName) {
    var commentLine = '// ' + fileName;
    writeFile(fileName, commentLine);
  }

  /**
   * Create a Javascript file with the given file name and code wrapped in an IIFE
   * @param filesName, the file name
   * @param code, the JavaScript code.
   */
  function createJavaScriptFile(fileName, code) {
    writeFile(fileName, wrapCodeAsIIFE(code));
  }

  /**
   * Wrap code with immediately-invoked function expression
   * @param code {String} the code to wrap.
   * @returns {String} the wrapped code.
   * @description
   *
   * Wrapped code looks like:
    ```
    (function () {
      'use strict';

       // code goes here

    })();
    ```
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
   * @param str {String} the string to wrap
   * @returns {String} a new wrapped string
   */
  function asString(str) {
    return ['\'',  '\''].join(str);
  }

});
