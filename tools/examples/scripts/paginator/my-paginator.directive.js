(function () {
  'use strict';

  angular
    .module('helionFrameworkExamples')
    .directive('myPaginator', myPaginator);

  myPaginator.$inject = [
    'helionFrameworkExamples.basePath'
  ];

  function myPaginator(path) {
    return {
      controller: MyPaginatorController,
      controllerAs: 'myPaginatorCtrl',
      templateUrl: path + 'paginator/my-paginator.html'
    };
  }

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
    loadPage: function () {
      return this.$q.resolve();
    }
  });

})();
