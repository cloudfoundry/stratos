(function (global) {
  'use strict';

  /**
   * @namespace env
   * @name env
   * @property {string} HELION_UI_FRAMEWORK_BASE_PATH - the Helion UI framework path
   */
  var env = {
    registerApplication: registerApplication,

    HELION_UI_FRAMEWORK_BASE_PATH: '',

    DEFAULT_OEM_CONFIG: {
      PRODUCT_VERSION: '4.0',
      TERMS_OF_USE_HREF: 'http://docs.hpcloud.com/permalink/helion-openstack/3.0/eula',
      PRIVACY_HREF: 'https://www.hpe.com/us/en/legal/privacy.html',
      PRODUCT_FAMILY_HREF: 'http://www.hpe.com/us/en/solutions/cloud.html',
      COMPANY_HREF: 'http://www.hpe.com',
      PRODUCT_CONSOLE: 'Helion Stackato Web Console',
      CONSOLE: 'Console',
      PRODUCT_NAME: 'Helion Stackato',
      COMPANY_NAME: 'Hewlett Packard Enterprise Company, L.P.',
      TERMS_OF_USE: 'Terms of Use',
      PRIVACY: 'Privacy',
      CODE_ENGINE: 'Helion Code Engine',
      CLOUD_FOUNDRY: 'Helion Cloud Foundry',
      COMPANY_LOGO_HREF: 'images/brand_company_logo.png',
      PRODUCT_FAMILY_LOGO_HREF: 'images/brand_product_family_logo.png',
      ABOUT_COMPANY_LOGO_HREF: 'images/brand_company_logo.png',
      ABOUT_PRODUCT_FAMILY_LOGO_HREF: 'images/brand_product_family_logo_rev.png'
    },

    OEM_CONFIG: {}

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
