(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('selectInput', selectInput);

  /**
   * @namespace app.framework.widgets.selectInput
   * @memberof app.framework.widgets
   * @name selectInput
   * @description A select input directive that displays
   * a select input field with a dropdown menu with options.
   * @param {object} $document - the Angular $document service
   * @example
   * var options = [
   *   { label: 'Option 1', value: 1 },
   *   { label: 'Option 2', value: 2 }
   * ];
   * var inputModel = null;
   * <select-input ng-model="inputModel" input-options="options">
   * </select-input>
   * @returns {object} The select-input directive definition object
   */
  function selectInput($document) {
    return {
      bindToController: {
        addAction: '=?',
        inputOptions: '=',
        refreshAction: '=?',
        placeholder: '@?',
        translateOptionLabels: '=?'
      },
      controller: SelectInputController,
      controllerAs: 'selectInputCtrl',
      link: link,
      require: ['selectInput', 'ngModel'],
      restrict: 'E',
      scope: {},
      templateUrl: 'framework/widgets/select-input/select-input.html'
    };

    function link(scope, element, attrs, ctrls) {
      var selectInputCtrl = ctrls[0];
      var ngModelCtrl = ctrls[1];

      ngModelCtrl.$render = function () {
        selectInputCtrl.setLabel(ngModelCtrl.$modelValue);
      };

      selectInputCtrl.ngModelCtrl = ngModelCtrl;

      element.on('click', handleClick);
      element.on('keypress', handleKeypress);

      $document.on('click', function (event) {
        if (!element[0].contains(event.target)) {
          scope.$apply(function () {
            selectInputCtrl.open = false;
          });
        }
      });

      function handleClick() {
        scope.$apply(function () {
          selectInputCtrl.toggleMenu();
        });
      }

      function handleKeypress(event) {
        var enterSpaceKeyCodes = [13, 32];    // enter or space
        var keyCode = event.which || event.keyCode;
        var charStr = String.fromCharCode(keyCode);

        if (keyCode === 27) {
          scope.$apply(function () {
            selectInputCtrl.open = false;
          });
        } else if (enterSpaceKeyCodes.indexOf(keyCode) !== -1) {
          event.preventDefault();

          scope.$apply(function () {
            selectInputCtrl.toggleMenu();
          });
        } else {
          scope.$apply(function () {
            selectInputCtrl.open = false;
            selectInputCtrl.searchAndSetValue(charStr);
          });
        }
      }
    }
  }

  /**
   * @namespace app.framework.widgets.SelectInputController
   * @memberof app.framework.widgets
   * @name SelectInputController
   * @constructor
   * @param {object} $scope - the Angular $scope
   * @param {object} $q - the Angular $q service
   * @property {object} $scope - the Angular $scope
   * @property {object} ngModelCtrl - the ng-model controller
   * @property {string} placeholder - the placeholder text
   * @property {string} modelLabel - the selected options's label
   * @property {boolean} open - flag whether menu should be visible
   * @property {object} optionsMap - the input options map
   */
  function SelectInputController($scope, $q) {

    var vm = this;

    vm.ngModelCtrl = null;
    vm.placeholder = vm.placeholder || 'select-input.placeholder';
    vm.open = false;
    vm.modelLabel = null;

    vm.searchAndSetValue = searchAndSetValue;
    vm.setLabel = setLabel;
    vm.setValue = setValue;
    vm.toggleMenu = toggleMenu;
    vm.refreshActionWrapper = refreshActionWrapper;

    init();

    /**
     * @function init
     * @memberof app.framework.widgets.SelectInputController
     * @description initialize the widget
     * @returns {void}
     */
    function init() {
      $scope.$watch(function () {
        return vm.inputOptions ? vm.inputOptions.length : 0;
      }, function (length) {
        if (length === 1) {
          vm.setValue(vm.inputOptions[0]);
        }
      });

      // If input options is rebuilt, we may show an outdated label (viewValue)
      $scope.$watch(function () {
        return vm.inputOptions;
      }, function (newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        vm.ngModelCtrl.$render();
      });
    }

    /**
     * @function searchAndSetValue
     * @memberof app.framework.widgets.SelectInputController
     * @description Search for option that starts with specified
     * character from key press and set it as the input value.
     * @param {string} searchTerm - the character to search for
     * @returns {void}
     */
    function searchAndSetValue(searchTerm) {
      if (searchTerm) {
        var searchRegex = new RegExp('^' + searchTerm, 'i');

        for (var i = 0; i < vm.inputOptions.length; i++) {
          var option = vm.inputOptions[i];
          if (searchRegex.test(option.label)) {
            if (option.value !== vm.ngModelCtrl.$modelValue) {
              vm.setValue(option);
              return;
            }
          }
        }
      }
    }

    /**
     * @function setLabel
     * @memberof app.framework.widgets.SelectInputController
     * @description Set this input field's label
     * @param {object} modelValue - the input field's value
     * @returns {void}
     */
    function setLabel(modelValue) {
      if (angular.isDefined(modelValue) && modelValue !== null) {
        var initialValue = _.find(vm.inputOptions, {value: modelValue});
        vm.modelLabel = initialValue ? initialValue.label : null;
      } else {
        vm.modelLabel = null;
      }
    }

    /**
     * @function setValue
     * @memberof app.framework.widgets.SelectInputController
     * @description Set this input field's selected value
     * @param {object} option - the option object (label and value)
     * @returns {void}
     */
    function setValue(option) {
      if (!option.disabled) {
        vm.ngModelCtrl.$setViewValue(option.value);
        vm.ngModelCtrl.$render();
      }
    }

    /**
     * @function toggleMenu
     * @memberof app.framework.widgets.SelectInputController
     * @description Toggle the menu
     * @returns {void}
     */
    function toggleMenu() {
      vm.open = !vm.open;
    }

    /**
     * @function refreshActionWrapper
     * @memberof app.framework.widgets.SelectInputController
     * @description Wrapper around the refresh action to manage the spinner and intercept the click event
     * @param {object} $event - click event
     * @returns {boolean} true
     * */
    function refreshActionWrapper($event) {
      $event.stopPropagation();

      if (vm.refreshing) {
        return true;
      }

      vm.refreshing = true;
      $q.when(vm.refreshAction.execute()).finally(function () {
        vm.refreshing = false;
      });
      return true;
    }

  }

})();
