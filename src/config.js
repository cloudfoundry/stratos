(function (global) {
  'use strict';

  expose({
    gettext: gettext,

    env: {

      HELION_UI_FRAMEWORK_BASE_PATH: 'lib/helion-ui-framework/',

      plugins: {

        cloudFoundry: {
          /**
           * @ngdoc plugins
           * @property moduleName {String} defines a root angular module name of the
           * plugin app.
           *
           * Each plugin app MUST have one and only one angular module name.
           * This module will be added to the system as a dependency for the
           * whole app the be initialized.
           *
           */
          moduleName: 'cloud-foundry'
        }
      }
    }

  });

  function gettext(text) {
    return text;
  }

  function expose(vars) {
    for (var key in vars) {
      global[key] = vars[key];
    }
  }

})(this);
