(function (global) {
  'use strict';

  /**
   * @namespace env
   * @name env
   * @property {string} HELION_UI_FRAMEWORK_BASE_PATH - the Helion UI framework path
   */
  var env = {
    HELION_UI_FRAMEWORK_BASE_PATH: '',

    OEM_CONFIG:{}
  };

  expose({
    gettext: gettext,
    env: env
  });

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
