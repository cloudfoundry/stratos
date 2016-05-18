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
    '$scope',
    '$stateParams',
    '$interval',
    'moment',
    'app.model.modelManager'
  ];

  /**
   * @name ApplicationDeliveryLogsController
   * @constructor
   * @param {object} $scope - the controller's $scope
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $interval - the angular $interval service
   * @param {object} moment - the moment timezone component
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryLogsController($scope, $stateParams, $interval, moment, modelManager) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.hceModel = {};

    updateData(this.hceModel);

    var updateModelPromise = $interval(updateData, 30 * 1000, 0, true, this.hceModel);

    function updateData(hceModel) {
      /* eslint-disable */
      // TODO: Need to update once https://github.com/hpcloud/stratos-ui/pull/242 | TEAMFOUR-304 is merged.
      // TODO: Bring in data via new HceModel get<x> functions that poke HCE backend
      // TODO: Update data structure to match pipeline/executions/events/etc
      /* eslint-enable */
      hceModel.delivery = {
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
            time: momentise(moment().valueOf()),
            commitAuthor: 'DBalwin',
            reason: 'Manual'
          },
          {
            message: 'Update lastupdated.txt',
            result: 'deploying',
            time: momentise(moment().subtract(46064, 'seconds').valueOf()),
            commitAuthor: 'TWogan',
            reason: 'Manual'
          },
          {
            message: 'Update lastupdated.txt',
            result: 'success',
            time: momentise(moment().subtract(40004, 'seconds').valueOf()),
            commitAuthor: 'GNuman',
            reason: 'Manual'
          },
          {
            message: 'Update lastupdated.txt',
            result: 'asadsa',
            time: momentise(moment().subtract(335643, 'seconds').valueOf()),
            commitAuthor: 'BAtman',
            reason: 'Because why not'
          }
        ]
      };
    }

    function momentise(epoch) {
      // Convert date to string BEFORE we send to scope, this will allow any filters that use the data to work
      // Ensure we use i18n date/time format
      return moment(epoch).format('L - LTS');
    }

    $scope.$on("$destroy", function() {
      if (updateModelPromise) {
        $interval.cancel(updateModelPromise);
      }
    });

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
