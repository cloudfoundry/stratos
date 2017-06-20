(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('jsonTreeView', jsonTreeView);

  /**
   * @name jsonTreeView
   * @description A directive that displays JSON.
   * @param {object} RecursionHelper - RecursionHelper
   * @returns {object} The json-tree-view directive definition object
   */
  function jsonTreeView(RecursionHelper) {
    return {
      bindToController: {
        json: '='
      },
      controller: JsonTreeViewController,
      controllerAs: 'jtvCtrl',
      restrict: 'E',
      scope: {},
      templateUrl: 'framework/widgets/json-tree-view/json-tree-view.html',
      compile: function (element) {
        return RecursionHelper.compile(element);
      }
    };
  }

  /**
   * @namespace app.framework.widgets.JsonTreeViewController
   * @memberof app.framework.widgets
   * @name JsonTreeViewController
   * @constructor
   */
  function JsonTreeViewController() {

    var vm = this;

    vm.array = _.isArray(vm.json);

    vm.isArray = isArray;
    vm.getTypeOf = getTypeOf;

    function isArray() {
      return _.isArray(vm.json);
    }

    function getTypeOf(value) {
      if (_.isArray(value)) {
        return 'array';
      } else if (_.isObject(value)) {
        return 'object';
      } else if (_.isBoolean(value)) {
        return 'bool';
      } else if (_.isNumber(value)) {
        return 'number';
      }

      return 'string';
    }
  }

})();
