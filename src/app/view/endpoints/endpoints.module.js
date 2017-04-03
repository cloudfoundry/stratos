(function () {
  'use strict';

  angular
    .module('app.view.endpoints', [
      'app.view.endpoints.clusters',
      'app.view.endpoints.dashboard'
    ])
    .config(registerRoute)
    .run(register);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('endpoint', {
      url: '/endpoint',
      abstract: true,
      template: '<ui-view/>',
      data: {
        activeMenuState: 'endpoints'
      },
      ncyBreadcrumb: {
        label: gettext('Endpoints')
      }
    });
  }

  register.$inject = [
    '$q',
    '$state',
    'modelManager',
    'appEventEventService',
    'appUtilsUtilsService'
  ];

  function register($q, $state, modelManager, appEventEventService, utils) {
    return new Endpoints($q, $state, modelManager, appEventEventService, utils);
  }

  function Endpoints($q, $state, modelManager, appEventEventService, utils) {
    var that = this;

    this.initialized = $q.defer();

    this.modelManager = modelManager;

    function init() {
      return that.initialized.promise;
    }

    appEventEventService.$on(appEventEventService.events.LOGIN, function () {
      that.onLoggedIn();
    });

    utils.chainStateResolve('endpoint', $state, init);
  }

  angular.extend(Endpoints.prototype, {

    onLoggedIn: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('endpoints', 'endpoint.dashboard', gettext('Endpoints'), 2, 'helion-icon-Inherit helion-icon-r270');
      this.initialized.resolve();
    }

  });

})();
