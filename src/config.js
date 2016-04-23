(function (global) {
  'use strict';

  /**
   * @namespace env
   * @name env
   * @property {string} HELION_UI_FRAMEWORK_BASE_PATH - the Helion UI framework path
   */
  var env = {
    registerApplication: registerApplication,

    HELION_UI_FRAMEWORK_BASE_PATH: 'lib/helion-ui-framework/dist/'
  };

  expose({
    gettext: gettext,
    env: env
  });

  /**
   * @function registerApplication
   * @memberof env
   * @description
   * Register a plugin application with the UI platform and include its
   * Angular module as a dependency of the UI platform module.
   *
   * IMPORTANT: Every plugin application MUST include a `plugin.config.js`
   * file at its root directory that will register itself with the UI platform.
   * @example
   * env && env.registerApplication && env.env.registerApplication(
   *   'My Application ID',
   *   'my-application-angular-module-name',
   *   'plugins/my-application/'
   * );
   * @param {string} id - the ID to identify the application being registered
   * @param {string} angularModuleName - the unique Angular module name of the
   * plugin application
   * @param {string} basePath - the base path to the root folder where the
   * plugin application resides or is installed. The basePath is relative to
   * the 'src' folder.
   */
  function registerApplication(id, angularModuleName, basePath) {
    env.plugins = env.plugins || {};
    env.plugins[id] = {
      moduleName: angularModuleName,
      basePath: basePath
    };
  }

  /**
   * @global
   * @function gettext
   * @description Returns the translated text
   * @param {string} text - the text to be translated
   * @returns {string} The translated text
   */
  function gettext(text) {
    return text;
  }

  function expose(vars) {
    for (var key in vars) {
      if (vars.hasOwnProperty(key)) {
        global[key] = vars[key];
      }
    }
  }

})(this);
