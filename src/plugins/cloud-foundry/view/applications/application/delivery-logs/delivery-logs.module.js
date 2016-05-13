(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-logs', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.delivery-logs', {
      url: '/delivery-logs',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/delivery-logs.html',
      controller: ApplicationDeliveryLogsController,
      controllerAs: 'appDelLogsCtrl'
    });
  }

  ApplicationDeliveryLogsController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  /**
   * @name ApplicationDeliveryLogsController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryLogsController(modelManager, $stateParams) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    /* eslint-disable */
    // TODO: Summary and builds list updates regularly as data updates become available
    // Not sure if there's an existing push model, existing global poll or we should poll here.

    // TODO: Need to update once https://github.com/hpcloud/stratos-ui/pull/242 | TEAMFOUR-304 is merged.
    // TODO: Bring in data via new HceModel get<x> functions that poke HCE backend
    // TODO: Update data structure to match pipeline/executions/events/etc
    /* eslint-enable */
    this.hceModel = {};
    this.hceModel.delivery = {
      lastBuilt: {
        link: 'afw342',
        time: new Date().getTime()
      },
      lastTest: {
        link: 'gdf543',
        time: new Date().getTime() - 1000000
      },
      lastDeployment: {
        link: 'nbv035',
        time: new Date().getTime() - 16400000
      },
      builds: [
        {
          message: 'Update lastupdated.txt',
          result: 'failure',
          time: new Date().getTime() - 495640,
          commitAuthor: 'DBalwin',
          reason: 'Manual'
        },
        {
          message: 'Update lastupdated.txt',
          result: 'deploying',
          time: new Date().getTime() - 460640,
          commitAuthor: 'TWogan',
          reason: 'Manual'
        },
        {
          message: 'Update lastupdated.txt',
          result: 'success',
          time: new Date().getTime() - 400040,
          commitAuthor: 'GNuman',
          reason: 'Manual'
        },
        {
          message: 'Update lastupdated.txt',
          result: 'asadsa',
          time: new Date().getTime() - 3356430,
          commitAuthor: 'BAtman',
          reason: 'Because why not'
        }
      ]
    };

    this.id = $stateParams.guid;
  }

  angular.extend(ApplicationDeliveryLogsController.prototype, {

    triggerBuild: function() {
      /* eslint-disable */
      alert('TODO: trigger build');
      /* eslint-enable */
    },

    viewSummaryItem: function(item) {
      /* eslint-disable */
      alert('TODO: Show.. ' + item.link);
      /* eslint-enable */
    },

    viewBuild: function(build) {
      /* eslint-disable */
      alert('TODO: See TEAMFOUR-296. Show.. ' + build.message);
      /* eslint-enable */
    },

    viewBuildResult: function(build) {
      /* eslint-disable */
      alert('TODO: Show result for.. ' + build.message);
      /* eslint-enable */
    }
  });

})();
