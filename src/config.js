(function (global) {
  'use strict';

  var env = {
    registerApplication: registerApplication,

    HELION_UI_FRAMEWORK_BASE_PATH: 'lib/helion-ui-framework/'
  };

  expose({
    gettext: gettext,
    env: env
  });

  /**
   * @ngdoc registerApplication {Function} registers a plugin-able application to
   * the platform.
   *
   * @param id, the id to identify the registered application.
   *
   * @param angularModuleName {String} defines the root angular module
   * name of the plugin application. Each plugin app MUST have one and
   * only one angular module name.
   *
   * This module will be added to the system as a dependency for the
   * whole app the be initialized.
   *
   * @param basePath {String} defines the base path to the root folder
   * where the plugin app resides or is installed.  The basePath is
   * relative to the src folder.
   *
   * IMPORTANT: Every plugin-able application should have a plugin.config.js
   * resides with the application and register itself by:

   ```js
    // register this plugin application to the platform:

    env && env.registerApplication && env.env.registerApplication(
      'My Application ID',
      'my-application-angular-module-name',
      'plugins/my-application/'
    );
   ```
   */
  function registerApplication(id, angularModuleName, basePath) {
    env.plugins = env.plugins || {};
    env.plugins[id] = {
      moduleName: angularModuleName,
      basePath: basePath
    }
  }

  function gettext(text) {
    return text;
  }

  function expose(vars) {
    for (var key in vars) {
      global[key] = vars[key];
    }
  }

})(this);
