(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .factory('searchBoxCloser', searchBoxCloser)
    .directive('searchBox', searchBox);

  searchBoxCloser.$inject = [];

  /**
   * @description searchBox Closer Service can auto close the last opened search box
   * Useful when opening a search box using the keyboard alone (no click event involved)
   * @returns {function} searchBox Closer service
   */
  function searchBoxCloser() {

    var lastOpened;

    return {
      notifyOpened: function opened(searchBoxCtrl) {
        if (lastOpened && lastOpened !== searchBoxCtrl) {
          lastOpened.closeIt();
        }
        lastOpened = searchBoxCtrl;
      },
      notifyClosed: function opened(searchBoxCtrl) {
        if (lastOpened === searchBoxCtrl) {
          lastOpened = null;
        }
      }
    };
  }

  searchBox.$inject = [
    'helion.framework.basePath',
    '$document'
  ];

  /**
   * @namespace helion.framework.widgets.searchBox
   * @memberof helion.framework.widgets
   * @name searchBox
   * @description a searchable input box.
   * @param {string} path - the framework base path
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
  function searchBox(path, $document) {
    return {
      bindToController: {
        addAction: '=?',
        inputOptions: '=',
        placeholder: '@?',
        searchIcon: '@?',
        disabled: '=?'
      },
      controller: SearchBoxController,
      controllerAs: 'searchBoxCtrl',
      link: link,
      require: ['searchBox', 'ngModel'],
      restrict: 'E',
      scope: {},
      templateUrl: path + 'widgets/search-box/search-box.html'
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

  SearchBoxController.$inject = [
    '$scope',
    'searchBoxCloser'
  ];

  /**
   * @namespace helion.framework.widgets.SearchBoxController
   * @memberof helion.framework.widgets
   * @name SelectInputController
   * @constructor
   * @param {object} $scope - the Angular $scope
   * @param {object} searchBoxCloser - searchBox Closer Service
   * @property {object} $scope - the Angular $scope
   * @property {object} ngModelCtrl - the ng-model controller
   */
  function SearchBoxController($scope, searchBoxCloser) {
    this.$scope = $scope;
    this.searchBoxCloser = searchBoxCloser;
    this.ngModelCtrl = null;
  }

  angular.extend(SearchBoxController.prototype, {
    /**
     * @function reset
     * @memberof helion.framework.widgets.SearchBoxController
     * @description reset widget state
     */
    reset: function () {
      this.open = false;
      this.isDirty = false;
      this.searchText = '';
      this.preSelected = -1;
      this.suggestions = this.inputOptions;
      if (this.lastPick) {
        this.pick(this.lastPick);
      }
    },

    /**
     * @function setWatchers
     * @memberof helion.framework.widgets.SearchBoxController
     * @description set value watchers
     */
    setWatchers: function () {
      var that = this;
      this.$scope.$watch(function () {
        return that.inputOptions.length;
      }, function () {
        that.searchText = '';
        that.makeSuggestions();
        // If we already have a value try to pre-select it. This will be the case if ng-model has a value at
        // initialisation
        var validInitialModelValue = _.find(that.inputOptions, {value: that.ngModelCtrl.$modelValue});
        if (validInitialModelValue) {
          that.pick(validInitialModelValue);
        } else {
          that.autoPick();
        }
      });
    },

    /**
     * @function makeSuggestions
     * @memberof helion.framework.widgets.SearchBoxController
     * @description Make suggestions that matches the search text
     */
    makeSuggestions: function () {
      var suggestions;
      if (this.searchText) {
        var searchRegex = new RegExp(this.searchText, 'i');
        suggestions = _.filter(this.inputOptions, function (option) {
          return searchRegex.test(option.label);
        });
      } else {
        suggestions = this.inputOptions;
      }

      this.suggestions = suggestions;
    },

    /**
     * @function pick
     * @memberof helion.framework.widgets.SearchBoxController
     * @description pick a suggestion
     * @param {object} suggestion - the suggestion to pick
     * @param {object=} $event - optional mouse event that triggered this
     * @returns {boolean} true - we handled the event
     */
    pick: function (suggestion, $event) {
      this.preSelected = this.suggestions.indexOf(suggestion);
      if (suggestion.disabled) {
        return;
      }
      this.lastPick = suggestion;
      this.isDirty = false;
      this.searchText = suggestion.label;
      this.suggestions = this.inputOptions;
      this.setValue(suggestion.value);
      return this.closeIt($event);
    },

    /**
     * @function autoPick
     * @memberof helion.framework.widgets.SearchBoxController
     * @description automatically pick the first available suggestion
     */
    autoPick: function () {
      var suggestion;
      for (var i = 0; i < this.suggestions.length; i++) {
        suggestion = this.suggestions[i];
        if (!suggestion.disabled) {
          this.pick(suggestion);
          return;
        }
      }
    },

    /**
     * @function setValue
     * @memberof helion.framework.widgets.SearchBoxController
     * @description set model value
     * @param {object} value - the value to set as model value
     */
    setValue: function (value) {
      this.ngModelCtrl.$setViewValue(value);
      this.ngModelCtrl.$render();
    },

    /**
     * @function onChange
     * @memberof helion.framework.widgets.SearchBoxController
     * @description input change event handler
     */
    onChange: function () {
      if (!this.open) {
        this.openIt();
      }
      this.makeSuggestions();
      this.isDirty = true;
    },

    onMouseMove: function (index) {
      if (this.skipNextMouseMove) {
        this.skipNextMouseMove = false;
        return;
      }
      this.preSelected = index;
    },

    preSelectNextSuggestion: function (increment) {
      if (!increment || increment < 1) {
        increment = 1;
      }
      this.preSelected = Math.min(this.preSelected + increment, this.suggestions.length - 1);
      this.makePreselectedVisible();
    },

    preSelectPreviousSuggestion: function (increment) {
      if (!increment || increment > -1) {
        increment = -1;
      }
      this.preSelected = Math.max(this.preSelected + increment, 0);
      this.makePreselectedVisible();
    },

    pickPreselectedSuggestion: function () {
      if (this.preSelected < 0 || this.preSelected > this.suggestions.length - 1) {
        // Out of bounds
        return false;
      }
      var suggestion = this.suggestions[this.preSelected];
      if (!suggestion.disabled) {
        this.pick(suggestion);
        return true;
      }
    },

    /* eslint-disable complexity */
    onKeyDown: function ($event) {
      switch ($event.keyCode) {
        case 27: // escape
          if (this.open) {
            this.closeIt();
          } else {
            this.restoreLastPick();
          }
          $event.preventDefault();
          return true;
        case 40: // down
          if (!this.open) {
            this.openIt();
          }
          this.preSelectNextSuggestion();
          $event.preventDefault();
          return true;
        case 38: // up
          this.preSelectPreviousSuggestion();
          $event.preventDefault();
          return true;
        case 34: // page-down
          if (!this.open) {
            this.openIt();
          }
          this.preSelectNextSuggestion(5);
          $event.preventDefault();
          return true;
        case 33: // page-up
          this.preSelectPreviousSuggestion(-5);
          $event.preventDefault();
          return true;
        case 13: //enter
          if (this.open) {
            this.pickPreselectedSuggestion();
          } else {
            this.openIt();
          }
          $event.preventDefault();
          return true;
      }
    },
    /* eslint-enable complexity */

    openIt: function () {
      if (this.open || this.disabled) {
        return false;
      }
      this.open = true;
      this.searchBoxCloser.notifyOpened(this);
      return true;
    },

    closeIt: function ($event) {
      if (!this.open) {
        return false;
      }
      this.open = false;
      this.searchBoxCloser.notifyClosed(this);
      this.restoreLastPick();
      if ($event) {
        $event.stopPropagation();
      }
      return true;
    },

    /**
     * @function restoreLastPick
     * @memberof helion.framework.widgets.SearchBoxController
     * @description if dirty, reset the search-box to the last picked option
     */
    restoreLastPick: function () {
      var that = this;
      if (that.isDirty) {
        that.reset();
      }
    }

  });

})();
