(function () {
  'use strict';

  angular
    .module('service-manager.view.services', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('sm.services', {
      url: '/serviceManager',
      templateUrl: 'plugins/service-manager/view/services/services.html',
      controller: ServicesController,
      controllerAs: 'svcsCtrl',
      data: {
        activeMenuState: 'sm.services'
      }
    });
  }

  ServicesController.$inject = [
    '$scope',
    '$q',
    '$state',
    'app.utils.utilsService',
    'app.model.modelManager',
    'app.event.eventService',
    'app.logged-in.loggedInService',
    'app.api.apiManager'
  ];

  /**
   * @name ServicesController
   * @description   Controller for applications module
   * @param {object} $scope - the angular $scope service
   * @param {object} $q - the angular $q service
   * @param {object} $state - the UI router $state service
   * @param {object} utils - the utils service
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {app.event.eventService} eventService - the event bus service
   * @param {object} loggedInService - Logged In Service
   * @constructor
   */
  function ServicesController($scope, $q, $state, utils, modelManager, eventService, loggedInService, apiManager) {

    var initialized = $q.defer();

    if (loggedInService.isLoggedIn()) {
      initialized.resolve();
    }

    var that = this;

    function init() {
      return initialized.promise
      .then(function () {
        loadModel();
      });
    }

    function loadModel() {
      var hsmModel = modelManager.retrieve('service-manager.model');
      var p = [];
      _.each(hsmModel.getHsmEndpoints(), function (hsm) {
        p.push(hsmModel.getModel(hsm.guid).then(function (model) {
          that.instances = model.instances;
        }));
      });

      $q.all(p).catch(function () {
        that.listError = true;
      }).finally(function () {
        that.initialised = true;
      });
    }

    utils.chainStateResolve('sm.services', $state, init);

    function onLoggedIn() {
      initialized.resolve();
    }

    var logInListener = eventService.$on(eventService.events.LOGIN, function () {
      onLoggedIn();
    });

    $scope.$on('$destroy', logInListener);
  }

})();
