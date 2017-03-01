(function () {
  'use strict';

  angular
    .module('control-plane.view.tiles')
    .directive('controlPlaneTile', ControlPlaneTile);

  ControlPlaneTile.$inject = [];

  function ControlPlaneTile() {
    return {
      bindToController: {
        service: '=',
        connect: '=',
        disconnect: '=',
        unregister: '='
      },
      controller: ControlPlaneTileController,
      controllerAs: 'controlPlaneTileCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/control-plane-tile/control-plane-tile.html'
    };
  }

  ControlPlaneTileController.$inject = [
    '$scope',
    '$state',
    '$q',
    'app.model.modelManager',
    'app.api.apiManager',
    'app.utils.utilsService'
  ];

  /**
   * @name ControlPlaneTileController
   * @constructor
   * @param {object} $scope - the angular $scope service
   * @param {object} $state - the angular $state service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.api.apiManager} apiManager - the API management service
   */
  function ControlPlaneTileController($scope, $state, $q, modelManager, apiManager, utilsService) {
    var that = this;

    this.$state = $state;
    // Need to fetch the total number of organizations and users. To avoid fetching all items, only fetch 1 and read
    // list metadata total_results. In order to do this we must go via the api, not the model.
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.instances = null;
    this.nodes = [];
    this.userService = {};

    var cardData = {};
    var expiredStatus = {
      classes: 'danger',
      icon: 'helion-icon-lg helion-icon helion-icon-Critical_S',
      description: gettext('Token has expired')
    };

    var erroredStatus = {
      classes: 'danger',
      icon: 'helion-icon-lg helion-icon helion-icon-Critical_S',
      description: gettext('Cannot contact endpoint')
    };

    cardData.title = this.service.name;
    this.getCardData = function () {
      if (this.userService.error) {
        cardData.status = erroredStatus;
      } else if (that.service.hasExpired) {
        cardData.status = expiredStatus;
      } else {
        delete cardData.status;
      }
      return cardData;
    };

    function init() {

      $scope.$watch(function () {
        return that.service;
      }, function (newVal) {
        if (!newVal) {
          return;
        }
        that.userService = that.userServiceInstanceModel.serviceInstances[that.service.guid] || {};
      });

      var promises = [];
      promises.push(that.controlPlaneModel.getInstances(that.service.guid), that.controlPlaneModel.getComputeNodes(that.service.guid));

      return $q.all(promises).then(function (data) {
        that.instances = data[0];
        that.nodes = data[1];
        // var nodePromises = [];
        // _.each(nodes, function (node) {
        //   nodePromises.push(that.controlPlaneModel.getComputeNode(that.service.guid, node.id));
        // });
      });

    }

    // Ensure the parent state is fully initialised before we start our own init
    utilsService.chainStateResolve('cp.tiles', $state, init);
  }

  angular.extend(ControlPlaneTileController.prototype, {


    summary: function () {
      this.$state.go('cp.metrics.dashboard.summary', {guid: this.service.guid});
    },

    getKubernetesNodeCount: function () {
      return _.reduce(this.nodes, function (sum, node) {
        return node.spec.profile.indexOf('kubernetes') !== -1 ? sum + 1 : sum;
      }, 0);
    },
    getGlusterFsNodeCount: function () {
      return _.reduce(this.nodes, function (sum, node) {
        return node.spec.profile.indexOf('gluster') !== -1 ? sum + 1 : sum;
      }, 0);
    }
  });

})();
