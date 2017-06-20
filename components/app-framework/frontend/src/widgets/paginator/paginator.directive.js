(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('paginator', paginator);

  /**
   * @namespace app.framework.widgets.paginator
   * @memberof app.framework.widgets
   * @name paginator
   * @description A paginator directive
   * @returns {object} The paginator directive definition object
   * @example
   *
   ```html
   <paginator
   properties="myPaginatorCtrl.properties">
   </paginator>
   ```
   */
  function paginator() {
    return {
      bindToController: {
        properties: '='
      },
      controller: PaginatorController,
      controllerAs: 'paginatorCtrl',
      templateUrl: 'framework/widgets/paginator/paginator.html',
      scope: {}
    };
  }

  /**
   * @namespace app.framework.widgets.paginator.PaginatorController
   * @memberof app.framework.widgets
   * @name PaginatorController
   * @constructor
   * @param {object} $scope - the $scope
   * @property {object} $scope - the $scope
   * @property {array} range - the visible pagination range
   * @property {boolean} isLoading - a flag indicating if it is loading
   */
  function PaginatorController($scope) {

    var vm = this;

    vm.range = [];
    vm.isLoading = false;

    init();

    vm.loadPage = loadPage;
    vm.calculateRange = calculateRange;

    /**
     * @function init
     * @memberof app.framework.widgets.wizard.PaginatorController
     * @description initialize the widget
     * @returns {void}
     */
    function init() {
      $scope.$watch(function () {
        return vm.properties.total;
      }, function () {
        vm.calculateRange();
      });

      $scope.$watch(function () {
        return vm.properties.pageNumber;
      }, function () {
        vm.loadPage(vm.properties.pageNumber, true);
      });
    }

    /**
     * @function loadPage
     * @memberof app.framework.widgets.wizard.PaginatorController
     * @description call the callback provided by context
     * @param {number} pageNumber number of the page to load
     * @param {boolean=} skipCallback skip calling the properties.callback function.
     * @returns {void}
     */
    function loadPage(pageNumber, skipCallback) {
      if (vm.isLoading || pageNumber === vm.currentPageNumber || pageNumber < 1 || pageNumber > vm.properties.total) {
        return;
      }
      vm.currentPageNumber = pageNumber;
      vm.properties.pageNumber = pageNumber;
      vm.calculateRange();
      if (!skipCallback && vm.properties.callback) {
        vm.isLoading = true;
        vm.properties.callback(vm.currentPageNumber)
          .finally(function () {
            vm.isLoading = false;
          });
      }
    }

    /**
     * @function calculateRange
     * @memberof app.framework.widgets.wizard.PaginatorController
     * @description calculate the pagination range
     * @returns {void}
     */
    function calculateRange() {
      vm.currentPageNumber = Math.min(vm.properties.pageNumber || 1, vm.properties.total);
      vm.properties.pageNumber = vm.currentPageNumber;

      var left, right;

      var currentPageNumber = vm.currentPageNumber;
      var total = vm.properties.total;

      if (total === 7) {
        left = 2;
        right = 6;

      } else {
        left = currentPageNumber - 1;
        right = currentPageNumber + 1;

        if (currentPageNumber <= 4) {
          left = 2;
          right = Math.min(5, total - 1);
        }

        if (currentPageNumber > total - 4) {
          left = Math.max(total - 4, 2);
          right = total - 1;
        }
      }

      vm.range.length = 0;
      for (var i = left; i <= right; i++) {
        vm.range.push(i);
      }

      vm.left = left;
      vm.right = right;
    }
  }

})();
