(function (global) {
  'use strict';

  expose({
    gettext: gettext,

    env: {

      HELION_UI_FRAMEWORK_BASE_PATH: 'lib/helion-ui-framework/',

      plugins: {

        cloudFoundry: {
          moduleName: 'cloud-foundry',
          basePath: 'plugins/cloud-foundry/',
          dependencies: []
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
