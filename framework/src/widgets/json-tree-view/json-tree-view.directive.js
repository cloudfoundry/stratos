(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('jsonTreeView', jsonTreeView);

  jsonTreeView.$inject = [
    'RecursionHelper'
  ];

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
      templateUrl: 'widgets/json-tree-view/json-tree-view.html',
      compile: function (element) {
        return RecursionHelper.compile(element);
      }
    };
  }

  JsonTreeViewController.$inject = ['$scope'];

  /**
   * @namespace helion.framework.widgets.ActionsMenuController
   * @memberof helion.framework.widgets
   * @name ActionsMenuController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @property {string} icon - the actions menu icon
   * @property {boolean} position - the actions menu position
   * @property {boolean} open - flag whether actions menu should be visible
   * @property {boolean} buttonMode - do not show the drop down instead the single action as a button
   */
  function JsonTreeViewController() {
    this.array = _.isArray(this.json);
  }

  angular.extend(JsonTreeViewController.prototype, {

    isArray: function () {
      return _.isArray(this.json);
    },

    getTypeOf: function (value) {
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
  });

})();
