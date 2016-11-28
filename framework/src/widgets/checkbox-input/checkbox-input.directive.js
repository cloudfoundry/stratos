(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('checkboxInput', checkboxInput);

  checkboxInput.$inject = [
    'helion.framework.basePath'
  ];

  /**
   * @namespace helion.framework.widgets.checkboxInput
   * @memberof helion.framework.widgets
   * @name checkboxInput
   * @description A checkbox input directive with custom style
   * @param {string} path - the framework base path
   * @returns {object} The checkbox-input directive definition object
   */
  function checkboxInput(path) {
    return {
      bindToController: {
        inputDisabled: '=?',
        inputLabel: '@?',
        inputValue: '='
      },
      controller: CheckboxInputController,
      controllerAs: 'checkboxInputCtrl',
      link: link,
      require: ['checkboxInput', 'ngModel'],
      restrict: 'E',
      scope: {},
      templateUrl: path + 'widgets/checkbox-input/checkbox-input.html'
    };

    function link(scope, element, attrs, ctrls) {
      var checkboxInputCtrl = ctrls[0];
      var ngModelCtrl = ctrls[1];

      element.on('click', handleClick);
      element.on('keypress', handleKeypress);

      // watch for model change to set 'checked' class
      scope.$watch(function () {
        return ngModelCtrl.$modelValue;
      }, function (newValue) {
        checkboxInputCtrl.checked = newValue;
      });

      // On click, set the model view value
      function handleClick() {
        scope.$apply(function () {
          if (!checkboxInputCtrl.inputDisabled) {
            ngModelCtrl.$setViewValue(!checkboxInputCtrl.checked);
          }
        });
      }

      // On keypress space, set the model view value
      function handleKeypress(event) {
        var keyCode = event.which || event.keyCode;

        if (keyCode === 32) {
          event.preventDefault();
          handleClick();
        }
      }
    }
  }

  CheckboxInputController.$inject = [];

  /**
   * @namespace helion.framework.widgets.CheckboxInputController
   * @memberof helion.framework.widgets
   * @name CheckboxInputController
   * @constructor
   */
  function CheckboxInputController() {
  }

})();
