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
    'app.model.modelManager',
    'helion.framework.widgets.detailView'
  ];

  /**
   * @name ApplicationDeliveryLogsController
   * @constructor
   * @param {object} $scope - the controller's $scope
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $interval - the angular $interval service
   * @param {object} moment - the moment timezone component
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {helion.framework.widgets.detailView} detailView - the helion framework detailView widget
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryLogsController($scope, $stateParams, $interval, moment, modelManager, detailView) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.hceModel = {};

    var that = this;

    updateData();

    var updateModelPromise = $interval(updateData, 30 * 1000, 0, true);

    function updateData() {
      /* eslint-disable */
      // TODO: Need to update once https://github.com/hpcloud/stratos-ui/pull/242 | TEAMFOUR-304 is merged.
      // TODO: Bring in data via new HceModel get<x> functions that poke HCE backend
      // TODO: Update data structure to match pipeline/executions/events/etc
      /* eslint-enable */
      that.hceModel.commits = {
        afw342: {
          author: 'GLineker',
          created: momentise(moment().subtract(46, 'seconds').valueOf()),
          message: 'Update lastupdated.txt',
          id: 'afw342'
        },
        gdf543: {
          author: 'BBonden',
          created: momentise(moment().subtract(460, 'seconds').valueOf()),
          message: 'Update lastupdated.txt',
          id: 'gdf543'
        },
        sdf234: {
          author: 'DBalwin',
          created: momentise(moment().subtract(4606, 'seconds').valueOf()),
          message: 'Update lastupdated.txt',
          id: 'sdf234'
        },
        skt753: {
          author: 'TWogan',
          created: momentise(moment().subtract(50064, 'seconds').valueOf()),
          message: 'Change to log in',
          id: 'skt753'
        },
        nbv035: {
          author: 'GNuman',
          created: momentise(moment().subtract(80064, 'seconds').valueOf()),
          message: 'Fixed broken broker',
          id: 'nbv035'
        },
        hyg983: {
          author: 'BAtman',
          created: momentise(moment().subtract(90064, 'seconds').valueOf()),
          message: 'Break the build',
          id: 'hyg983'
        }
      };
      // Populate commit, localise date and transform result BEFORE we send to scope, this will allow any filters that
      // use the data to work
      that.hceModel.builds = [
        {
          buildId: 'build0',
          commit: fetchCommit('sdf234'),
          time: {
            label: momentise(moment().valueOf()),
            value: moment().valueOf()
          },
          reason: 'Manual',
          result: transformResult('Failure')
        },
        {
          buildId: 'build1',
          commit: fetchCommit('sdf234'),
          time: {
            label: momentise(moment().subtract(4694, 'seconds').valueOf()),
            value: moment().subtract(4694, 'seconds').valueOf()
          },
          reason: 'Manual',
          result: transformResult('Success')
        },
        {
          buildId: 'build2',
          commit: fetchCommit('skt753'),
          time: {
            label: momentise(moment().subtract(46064, 'seconds').valueOf()),
            value: moment().subtract(46064, 'seconds').valueOf()
          },
          reason: 'Manual',
          result: transformResult('Deploying')
        },
        {
          buildId: 'build3',
          commit: fetchCommit('nbv035'),
          time: {
            label:  momentise(moment().subtract(40004, 'seconds').valueOf()),
            value: moment().subtract(40004, 'seconds').valueOf()
          },
          reason: 'Because why not',
          result: transformResult('Success')
        },
        {
          buildId: 'build4',
          commit: fetchCommit('hyg983'),
          time: {
            label: momentise(moment().subtract(335643, 'seconds').valueOf()),
            value: moment().subtract(335643, 'seconds').valueOf()
          },
          reason: 'Manual',
          result: transformResult('unknownstatus')
        },
        {
          buildId: 'build5',
          commit: fetchCommit('hyg983'),
          time: {
            label: momentise(moment().subtract(33543, 'seconds').valueOf()),
            value: moment().subtract(33543, 'seconds').valueOf()
          },
          reason: 'Manual',
          result: transformResult('Failure')
        }
      ];

      that.hceModel.delivery = {
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
        builds: that.hceModel.builds
      };

    }

    function fetchCommit(commitId) {
      return that.hceModel.commits[commitId];
    }

    function momentise(epoch) {
      // Ensure we use i18n date/time format
      return moment(epoch).format('L - LTS');
    }

    function transformResult(result) {
      return {
        value: result,
        label: gettext(result)
      };
    }

    $scope.$on("$destroy", function() {
      if (updateModelPromise) {
        $interval.cancel(updateModelPromise);
      }
    });

    this.id = $stateParams.guid;
    this.moment = moment;
    this.detailView = detailView;
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

    viewCommit: function (build) {
      var that = this;

      this.detailView({
        templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/details/commit.html',
        title: build.commit.message
      }, {
        commit: build.commit,
        builds: _.filter(that.hceModel.builds, function(o) { return o.commit.id === build.commit.id; }),
        viewBuild: function () {
          that.viewBuild(build);
        }
      });
    },

    viewBuild: function(build) {
      this.detailView({
        templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/details/build-log.html',
        title: gettext('Build Log')
      }, {
        build: build
      });
    }
  });

})();
