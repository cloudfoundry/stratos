(function () {
  'use strict';

  angular
    .module('app.view.endpoints.clusters', [
      'app.view.endpoints.clusters.cluster',
      'app.view.endpoints.clusters.tiles',
      'app.view.endpoints.clusters.router'
    ])
    .config(registerRoute)
    .run(register);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('clusters', {
      url: '/cluster',
      abstract: true,
      template: '<ui-view/>',
      data: {
        activeMenuState: 'clusters'
      },
      ncyBreadcrumb: {
        label: gettext('Helion Cloud Foundry Endpoints')
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
    return new Clusters($q, $state, modelManager, eventService, utils);
  }

  function Clusters($q, $state, modelManager, eventService, utils) {
    var that = this;

    this.initialized = $q.defer();

    this.modelManager = modelManager;

    function init() {
      return that.initialized.promise;
    }

    eventService.$on(eventService.events.LOGIN, function () {
      that.onLoggedIn();
    });

    utils.chainStateResolve('clusters', $state, init);
  }

  angular.extend(Clusters.prototype, {

    onLoggedIn: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('clusters', 'clusters.router', gettext('Helion Cloud Foundry Endpoints'), 1);
      this.initialized.resolve();
    }
  });

})();
