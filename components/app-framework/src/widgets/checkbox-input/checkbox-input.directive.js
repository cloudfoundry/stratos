(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('checkboxInput', checkboxInput);

  /**
   * @namespace app.framework.widgets.checkboxInput
   * @memberof app.framework.widgets
   * @name checkboxInput
   * @description A checkbox input directive with custom style
   * @returns {object} The checkbox-input directive definition object
   */
  function checkboxInput() {
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
      templateUrl: 'framework/widgets/checkbox-input/checkbox-input.html'
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

  /**
   * @namespace app.framework.widgets.CheckboxInputController
   * @memberof app.framework.widgets
   * @name CheckboxInputController
   * @constructor
   */
  function CheckboxInputController() {
  }

})();
