(function (global) {
  'use strict';

  expose({
    gettext: gettext
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
