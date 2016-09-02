(function () {
  'use strict';

  angular
    .module('app.view.endpoints', [
      'app.view.endpoints.clusters',
      'app.view.endpoints.dashboard',
      'app.view.endpoints.hce'
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

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      var stacakatoInfoPromise;
      // Check if StackatoInfo is uninitialised
      if (Object.keys(stackatoInfo.info).length === 0) {
        stacakatoInfoPromise = stackatoInfo.getStackatoInfo();
      } else {
        stacakatoInfoPromise = $q.resolve;
      }

      return stacakatoInfoPromise.then(function () {
        return that.initialized.promise;
      });
    }

    eventService.$on(eventService.events.LOGIN, function () {
      that.onLoggedIn();
    });

    utils.chainStateResolve('endpoint', $state, init);
  }

  angular.extend(Endpoints.prototype, {

    onLoggedIn: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('endpoints', 'endpoint.dashboard', gettext('Endpoints'), 1);
      this.initialized.resolve();
    }

  });

})();
