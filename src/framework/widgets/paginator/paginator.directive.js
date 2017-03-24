(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('paginator', paginator);

  paginator.$inject = [
    'helion.framework.basePath'
  ];

  /**
   * @namespace helion.framework.widgets.paginator
   * @memberof helion.framework.widgets
   * @name paginator
   * @description A paginator directive
   * For detailed information on UX design: https://app.frontify.com/screen/866758
   * @param {string} path - the framework base path
   * @returns {object} The paginator directive definition object
   * @example
   *
   ```js
   MyPaginatorController.$inject = [
   '$q'
   ];

   function MyPaginatorController($q) {
      var that = this;
      this.$q = $q;
      this.properties = {
        callback: function (page) {
          return that.loadPage(page);
        },
        total: 20,
        text: {
          nextBtn: 'Next',
          prevBtn: 'Previous'
        }
      };
    }

   angular.extend(MyPaginatorController.prototype, {
      loadPage: function (page) {
        console.log(page);
        return this.$q.resolve();
      }
    });
   ```

   ```html
   <paginator
   properties="myPaginatorCtrl.properties">
   </paginator>
   ```
   */
  function paginator(path) {
    return {
      bindToController: {
        properties: '='
      },
      controller: PaginatorController,
      controllerAs: 'paginatorCtrl',
      templateUrl: path + 'widgets/paginator/paginator.html',
      scope: {}
    };
  }

  PaginatorController.$inject = [
    '$scope'
  ];

  /**
   * @namespace helion.framework.widgets.paginator.PaginatorController
   * @memberof helion.framework.widgets
   * @name PaginatorController
   * @constructor
   * @param {object} $scope - the $scope
   * @property {object} $scope - the $scope
   * @property {array} range - the visible pagination range
   * @property {boolean} isLoading - a flag indicating if it is loading
   */
  function PaginatorController($scope) {
    this.$scope = $scope;
    this.range = [];
    this.isLoading = false;
    this.init();
  }

  angular.extend(PaginatorController.prototype, {
    /**
     * @function init
     * @memberof helion.framework.widgets.wizard.PaginatorController
     * @description initialize the widget
     * @returns {void}
     */
    init: function () {
      var that = this;
      this.$scope.$watch(function () {
        return that.properties.total;
      }, function () {
        that.calculateRange();
      });

      this.$scope.$watch(function () {
        return that.properties.pageNumber;
      }, function () {
        that.loadPage(that.properties.pageNumber, true);
      });
    },

    /**
     * @function loadPage
     * @memberof helion.framework.widgets.wizard.PaginatorController
     * @description call the callback provided by context
     * @param {number} pageNumber number of the page to load
     * @param {boolean=} skipCallback skip calling the properties.callback function.
     * @returns {void}
     */
    loadPage: function (pageNumber, skipCallback) {
      var that = this;
      if (this.isLoading || pageNumber === this.currentPageNumber || pageNumber < 1 || pageNumber > this.properties.total) {
        return;
      }
      this.currentPageNumber = pageNumber;
      this.properties.pageNumber = pageNumber;
      this.calculateRange();
      if (!skipCallback && this.properties.callback) {
        this.isLoading = true;
        this.properties.callback(this.currentPageNumber)
          .finally(function () {
            that.isLoading = false;
          });
      }
    },

    /**
     * @function calculateRange
     * @memberof helion.framework.widgets.wizard.PaginatorController
     * @description calculate the pagination range
     * @returns {void}
     */
    calculateRange: function () {
      this.currentPageNumber = Math.min(this.properties.pageNumber || 1, this.properties.total);
      this.properties.pageNumber = this.currentPageNumber;

      var left, right;

      var currentPageNumber = this.currentPageNumber;
      var total = this.properties.total;

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

      this.range.length = 0;
      for (var i = left; i <= right; i++) {
        this.range.push(i);
      }

      this.left = left;
      this.right = right;
    }
  });

})();
