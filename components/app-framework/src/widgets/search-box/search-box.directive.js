(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .factory('searchBoxCloser', searchBoxCloser)
    .directive('searchBox', searchBox);

  /**
   * @description searchBox Closer Service can auto close the last opened search box
   * Useful when opening a search box using the keyboard alone (no click event involved)
   * @returns {function} searchBox Closer service
   */
  function searchBoxCloser() {

    var lastOpened;

    return {
      notifyOpened: function (searchBoxCtrl) {
        if (lastOpened && lastOpened !== searchBoxCtrl) {
          lastOpened.closeIt();
        }
        lastOpened = searchBoxCtrl;
      },
      notifyClosed: function (searchBoxCtrl) {
        if (lastOpened === searchBoxCtrl) {
          lastOpened = null;
        }
      }
    };
  }

  /**
   * @namespace app.framework.widgets.searchBox
   * @memberof app.framework.widgets
   * @name searchBox
   * @description a searchable input box.
   * @param {object} $document - the Angular $document service
   * @example
   * var options = [
   *   { label: 'Option 1', value: 1 },
   *   { label: 'Option 2', value: 2 }
   * ];
   * var inputModel = null;
   * <search-box ng-model="inputModel" input-options="options">
   * </search-box>
   * @returns {object} the selected result
   */
  function searchBox($document) {
    return {
      bindToController: {
        addAction: '=?',
        inputOptions: '=',
        placeholder: '@?',
        searchIcon: '@?',
        disabled: '=?',
        translateOptionLabels: '=?'
      },
      controller: SearchBoxController,
      controllerAs: 'searchBoxCtrl',
      link: link,
      require: ['searchBox', 'ngModel'],
      restrict: 'E',
      scope: {},
      templateUrl: 'framework/widgets/search-box/search-box.html'
    };

    function link(scope, element, attrs, ctrls) {
      var searchBoxCtrl = ctrls[0];
      var ngModelCtrl = ctrls[1];

      searchBoxCtrl.ngModelCtrl = ngModelCtrl;

      var clickAndNamespace = 'click.' + _.uniqueId('searchBox');
      $document.on(clickAndNamespace, function (event) {
        if (!element[0].contains(event.target) && searchBoxCtrl.open) {
          scope.$apply(function () {
            searchBoxCtrl.closeIt(event);
          });
        }
      });
      scope.$on('$destroy', function () {
        $document.off(clickAndNamespace);
      });

      searchBoxCtrl.reset();
      searchBoxCtrl.setWatchers();
      searchBoxCtrl.makePreselectedVisible = function () {
        if (searchBoxCtrl.preSelected < 0 || searchBoxCtrl.preSelected > searchBoxCtrl.suggestions.length - 1) {
          return;
        }
        var scrollingPanel = element.find('ul')[0];
        var clientHeight = scrollingPanel.clientHeight;
        var selectedOption = element.find('li')[searchBoxCtrl.preSelected];

        if (selectedOption.offsetTop < scrollingPanel.scrollTop) {
          scrollingPanel.scrollTop = selectedOption.offsetTop;
          searchBoxCtrl.skipNextMouseMove = true;
          return;
        }
        if (selectedOption.offsetTop + selectedOption.clientHeight > scrollingPanel.scrollTop + clientHeight) {
          scrollingPanel.scrollTop = selectedOption.offsetTop - clientHeight + selectedOption.clientHeight;
          searchBoxCtrl.skipNextMouseMove = true;
        }

      };

    }
  }

  /**
   * @namespace app.framework.widgets.SearchBoxController
   * @memberof app.framework.widgets
   * @name SelectInputController
   * @constructor
   * @param {object} $scope - the Angular $scope
   * @param {object} $rootScope - the Angular $rootScope
   * @param {object} $filter - the Angular $filter
   * @param {object} searchBoxCloser - searchBox Closer Service
   * @property {object} $scope - the Angular $scope
   * @property {object} ngModelCtrl - the ng-model controller
   */
  function SearchBoxController($scope, $rootScope, $filter, searchBoxCloser) {

    var vm = this;

    vm.searchBoxCloser = searchBoxCloser;
    vm.ngModelCtrl = null;

    vm.reset = reset;
    vm.setWatchers = setWatchers;
    vm.pick = pick;
    vm.autoPick = autoPick;
    vm.onChange = onChange;
    vm.onMouseMove = onMouseMove;
    vm.onKeyDown = onKeyDown;
    vm.openIt = openIt;
    vm.closeIt = closeIt;
    vm.makePreselectedVisible = _.noop;

    /**
     * @function reset
     * @memberof app.framework.widgets.SearchBoxController
     * @description reset widget state
     */
    function reset() {
      vm.open = false;
      vm.isDirty = false;
      vm.searchText = '';
      vm.preSelected = -1;
      vm.suggestions = vm.inputOptions;
      if (vm.lastPick) {
        vm.pick(vm.lastPick);
      }
    }

    /**
     * @function setWatchers
     * @memberof app.framework.widgets.SearchBoxController
     * @description set value watchers
     */
    function setWatchers() {
      $scope.$watch(function () {
        return vm.inputOptions.length;
      }, function () {
        vm.searchText = '';
        makeSuggestions();
        // If we already have a value try to pre-select it. This will be the case if ng-model has a value at
        // initialisation
        var validInitialModelValue = _.find(vm.inputOptions, {value: vm.ngModelCtrl.$modelValue});
        if (validInitialModelValue) {
          vm.pick(validInitialModelValue);
        } else {
          vm.autoPick();
        }
      });

      var $translateChangeSuccess = $rootScope.$on('$translateChangeSuccess', function () {
        vm.searchText = $filter('conditionalTranslate')(vm.lastPick.label, vm.translateOptionLabels || vm.lastPick.translateLabel);
      });

      $scope.$on('$destroy', function () {
        $translateChangeSuccess();
      });
    }

    /**
     * @function makeSuggestions
     * @memberof app.framework.widgets.SearchBoxController
     * @description Make suggestions that matches the search text
     */
    function makeSuggestions() {
      var suggestions;
      if (vm.searchText) {
        var searchRegex = new RegExp(vm.searchText, 'i');
        suggestions = _.filter(vm.inputOptions, function (option) {
          return searchRegex.test($filter('conditionalTranslate')(option.label, vm.translateOptionLabels || option.translateLabel));
        });
      } else {
        suggestions = vm.inputOptions;
      }

      vm.suggestions = suggestions;
    }

    /**
     * @function pick
     * @memberof app.framework.widgets.SearchBoxController
     * @description pick a suggestion
     * @param {object} suggestion - the suggestion to pick
     * @param {object=} $event - optional mouse event that triggered this
     * @returns {boolean} true - we handled the event
     */
    function pick(suggestion, $event) {
      vm.preSelected = vm.suggestions.indexOf(suggestion);
      if (suggestion.disabled) {
        return;
      }
      vm.lastPick = suggestion;
      vm.isDirty = false;
      vm.searchText = $filter('conditionalTranslate')(suggestion.label, vm.translateOptionLabels || suggestion.translateLabel);
      vm.suggestions = vm.inputOptions;
      setValue(suggestion.value);
      return vm.closeIt($event);
    }

    /**
     * @function autoPick
     * @memberof app.framework.widgets.SearchBoxController
     * @description automatically pick the first available suggestion
     */
    function autoPick() {
      var suggestion;
      for (var i = 0; i < vm.suggestions.length; i++) {
        suggestion = vm.suggestions[i];
        if (!suggestion.disabled) {
          vm.pick(suggestion);
          return;
        }
      }
    }

    /**
     * @function setValue
     * @memberof app.framework.widgets.SearchBoxController
     * @description set model value
     * @param {object} value - the value to set as model value
     */
    function setValue(value) {
      vm.ngModelCtrl.$setViewValue(value);
      vm.ngModelCtrl.$render();
    }

    /**
     * @function onChange
     * @memberof app.framework.widgets.SearchBoxController
     * @description input change event handler
     */
    function onChange() {
      if (!vm.open) {
        vm.openIt();
      }
      makeSuggestions();
      vm.isDirty = true;
    }

    function onMouseMove(index) {
      if (vm.skipNextMouseMove) {
        vm.skipNextMouseMove = false;
        return;
      }
      vm.preSelected = index;
    }

    function preSelectNextSuggestion(increment) {
      if (!increment || increment < 1) {
        increment = 1;
      }
      vm.preSelected = Math.min(vm.preSelected + increment, vm.suggestions.length - 1);
      vm.makePreselectedVisible();
    }

    function preSelectPreviousSuggestion(increment) {
      if (!increment || increment > -1) {
        increment = -1;
      }
      vm.preSelected = Math.max(vm.preSelected + increment, 0);
      vm.makePreselectedVisible();
    }

    function pickPreselectedSuggestion() {
      if (vm.preSelected < 0 || vm.preSelected > vm.suggestions.length - 1) {
        // Out of bounds
        return false;
      }
      var suggestion = vm.suggestions[vm.preSelected];
      if (!suggestion.disabled) {
        vm.pick(suggestion);
        return true;
      }
    }

    /* eslint-disable complexity */
    function onKeyDown($event) {
      switch ($event.keyCode) {
        case 27: // escape
          if (vm.open) {
            vm.closeIt();
          } else {
            restoreLastPick();
          }
          $event.preventDefault();
          return true;
        case 40: // down
          if (!vm.open) {
            vm.openIt();
          }
          preSelectNextSuggestion();
          $event.preventDefault();
          return true;
        case 38: // up
          preSelectPreviousSuggestion();
          $event.preventDefault();
          return true;
        case 34: // page-down
          if (!vm.open) {
            vm.openIt();
          }
          preSelectNextSuggestion(5);
          $event.preventDefault();
          return true;
        case 33: // page-up
          preSelectPreviousSuggestion(-5);
          $event.preventDefault();
          return true;
        case 13: //enter
          if (vm.open) {
            pickPreselectedSuggestion();
          } else {
            vm.openIt();
          }
          $event.preventDefault();
          return true;
      }
    }
    /* eslint-enable complexity */

    function openIt() {
      if (vm.open || vm.disabled) {
        return false;
      }
      vm.open = true;
      vm.searchBoxCloser.notifyOpened(vm);
      return true;
    }

    function closeIt($event) {
      if (!vm.open) {
        return false;
      }
      vm.open = false;
      vm.searchBoxCloser.notifyClosed(vm);
      restoreLastPick();
      if ($event) {
        $event.stopPropagation();
      }
      return true;
    }

    /**
     * @function restoreLastPick
     * @memberof app.framework.widgets.SearchBoxController
     * @description if dirty, reset the search-box to the last picked option
     */
    function restoreLastPick() {
      if (vm.isDirty) {
        vm.reset();
      }
    }

  }

})();
