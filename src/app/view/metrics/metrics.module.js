(function () {
  'use strict';

  angular
    .module('app.view.metrics', [
      'app.view.metrics.dashboard',
      'nvd3'
    ])
    .config(registerRoute)
    .run(register);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('metrics', {
      url: '/metrics',
      abstract: true,
      template: '<ui-view/>',
      data: {
        activeMenuState: 'metrics'
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
    return new Metrics($q, $state, modelManager, eventService, utils);
  }

  function Metrics($q, $state, modelManager, eventService, utils) {
    var that = this;

    this.initialized = $q.defer();

    this.modelManager = modelManager;

    function init() {
      return that.initialized.promise;
    }

    eventService.$on(eventService.events.LOGIN, function () {
      that.onLoggedIn();
    });

    utils.chainStateResolve('metrics', $state, init);
  }

  angular.extend(Metrics.prototype, {

    onLoggedIn: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('metrics', 'metrics.dashboard', gettext('Kubernetes'), 4, 'helion-icon-Resources');
      this.initialized.resolve();
    }

  });

})();
