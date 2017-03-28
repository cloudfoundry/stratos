(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('radioInput', radioInput);

  radioInput.$inject = [
    'helion.framework.basePath'
  ];

  /**
   * @namespace helion.framework.widgets.radioInput
   * @memberof helion.framework.widgets
   * @name radioInput
   * @description A radio input directive with custom style
   * @param {string} path - the framework base path
   * @returns {object} The radio-input directive definition object
   */
  function radioInput(path) {
    return {
      bindToController: {
        inputDisabled: '=?',
        inputLabel: '@?',
        inputValue: '='
      },
      controller: RadioInputController,
      controllerAs: 'radioInputCtrl',
      link: link,
      require: ['radioInput', 'ngModel'],
      restrict: 'E',
      scope: {},
      templateUrl: path + 'widgets/radio-input/radio-input.html'
    };

    function link(scope, element, attrs, ctrls) {
      var radioInputCtrl = ctrls[0];
      var ngModelCtrl = ctrls[1];

      element.on('click', handleClick);
      element.on('keypress', handleKeypress);

      // watch for model change to set 'checked' class
      scope.$watch(function () {
        return ngModelCtrl.$modelValue;
      }, function (newValue) {
        radioInputCtrl.checked = newValue === radioInputCtrl.inputValue;
      });

      // On click, set the model view value
      function handleClick() {
        scope.$apply(function () {
          if (!radioInputCtrl.inputDisabled) {
            ngModelCtrl.$setViewValue(radioInputCtrl.inputValue);
          }
        });
      }

      // On keypress (space or enter), set the model view value
      function handleKeypress(event) {
        var enterSpaceKeyCodes = [13, 32];
        var keyCode = event.which || event.keyCode;

        if (enterSpaceKeyCodes.indexOf(keyCode) !== -1) {
          event.preventDefault();
          handleClick();
        }
      }
    }
  }

  RadioInputController.$inject = [];

  /**
   * @namespace helion.framework.widgets.RadioInputController
   * @memberof helion.framework.widgets
   * @name RadioInputController
   * @constructor
   */
  function RadioInputController() {
  }

})();
