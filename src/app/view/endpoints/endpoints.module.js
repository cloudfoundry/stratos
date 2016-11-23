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
    'app.model.modelManager',
    'app.event.eventService',
    'app.utils.utilsService'
  ];

  function register($q, $state, modelManager, eventService, utils) {
    return new Endpoints($q, $state, modelManager, eventService, utils);
  }

  function Endpoints($q, $state, modelManager, eventService, utils) {
    var that = this;

    this.initialized = $q.defer();

    this.modelManager = modelManager;

    function init() {
      return that.initialized.promise;
    }

    eventService.$on(eventService.events.LOGIN, function () {
      that.onLoggedIn();
    });

    utils.chainStateResolve('endpoint', $state, init);
  }

  angular.extend(Endpoints.prototype, {

    onLoggedIn: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('endpoints', 'endpoint.dashboard', gettext('Endpoints'), 1, 'helion-icon-Networking');
      this.initialized.resolve();
    }

  });

})();
