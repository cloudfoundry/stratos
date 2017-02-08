(function () {
  'use strict';

  angular
    .module('service-manager.view.service.instance-detail', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {

    // Abstract detail route
    $stateProvider.state('sm.endpoint.instance', {
      url: '/instance/:id',
      templateUrl: 'plugins/service-manager/view/service/instance-detail/instance-detail.html',
      controller: ServiceManagerInstanceDetailController,
      controllerAs: 'instanceCtrl',
      abstract: true,
      ncyBreadcrumb: {
        label: '{{ instanceCtrl.id || "..." }}',
        parent: 'sm.endpoint.detail.instances'
      },
      data: {
        activeMenuState: 'sm.list'
      }
    });

    // Services Tab
    $stateProvider.state('sm.endpoint.instance.services', {
      url: '',
      templateUrl: 'plugins/service-manager/view/service/instance-detail/instance-services.html',
      ncyBreadcrumb: {
        label: '{{ instanceCtrl.id || "..." }}',
        parent: 'sm.endpoint.detail.instances'
      },
      data: {
        activeMenuState: 'sm.list'
      }
    });

    // Components Tab
    $stateProvider.state('sm.endpoint.instance.components', {
      url: '/components',
      templateUrl: 'plugins/service-manager/view/service/instance-detail/instance-components.html',
      ncyBreadcrumb: {
        label: '{{ instanceCtrl.id || "..." }}',
        parent: 'sm.endpoint.detail.instances'
      },
      data: {
        activeMenuState: 'sm.list'
      }
    });

    // Parameters Tab
    $stateProvider.state('sm.endpoint.instance.parameters', {
      url: '/parameters',
      templateUrl: 'plugins/service-manager/view/service/instance-detail/instance-parameters.html',
      ncyBreadcrumb: {
        label: '{{ instanceCtrl.id || "..." }}',
        parent: 'sm.endpoint.detail.instances'
      },
      data: {
        activeMenuState: 'sm.list'
      }
    });

    // Scaling Tab
    $stateProvider.state('sm.endpoint.instance.scaling', {
      url: '/scaling',
      templateUrl: 'plugins/service-manager/view/service/instance-detail/instance-scaling.html',
      ncyBreadcrumb: {
        label: '{{ instanceCtrl.id || "..." }}',
        parent: 'sm.endpoint.detail.instances'
      },
      data: {
        activeMenuState: 'sm.list'
      }
    });

    // Upgrades Tab
    $stateProvider.state('sm.endpoint.instance.versions', {
      url: '/versions',
      templateUrl: 'plugins/service-manager/view/service/instance-detail/instance-versions.html',
      ncyBreadcrumb: {
        label: '{{ instanceCtrl.id || "..." }}',
        parent: 'sm.endpoint.detail.instances'
      },
      controller: UpgradeController,
      controllerAs: 'instanceUpgradeCtrl'
    });
  }

  ServiceManagerInstanceDetailController.$inject = [
    '$scope',
    '$timeout',
    '$stateParams',
    '$log',
    'app.utils.utilsService',
    '$state',
    '$q',
    'app.view.endpoints.clusters.cluster.rolesService',
    'app.model.modelManager',
    'helion.framework.widgets.dialog.confirm',
    'service-manager.view.manage-instance.dialog',
    'service-manager.utils.version'
  ];

  function ServiceManagerInstanceDetailController($scope, $timeout, $stateParams, $log, utils, $state, $q, rolesService, modelManager, confirmDialog, manageInstanceDialog, versionUtils) {
    var that = this;

    this.initialized = false;
    this.guid = $stateParams.guid;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.confirmDialog = confirmDialog;
    this.$timeout = $timeout;
    this.$q = $q;
    this.$state = $state;
    this.versionUtils = versionUtils;

    this.hsmModel = modelManager.retrieve('service-manager.model');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

    this.getEndpoint = function () {
      return utils.getClusterEndpoint(that.endpoint);
    };

    this.guid = $state.params.guid;
    this.id = $state.params.id;

    this.interestingState = false;

    this.cpuUsageData = {};
    this.memoryUsageData = {};

    this.actions = [
      {
        id: 'upgrade', name: 'Upgrade Instance',
        execute: function () {
          return that.upgradeInstance(that.id);
        }
      },
      {
        id: 'configure', name: 'Configure Instance',
        execute: function () {
          return that.configureInstance(that.id);
        }
      },
      {
        id: 'delete', name: 'Delete Instance',
        execute: function () {
          return that.deleteInstance(that.id);
        }
      }
    ];

    this.actionsMap = _.keyBy(this.actions, 'id');

    this.highlight = function (id, on) {
      if (on) {
        angular.element('.hsm-volume-' + id).addClass('hilight');
      } else {
        angular.element('.hsm-volume-' + id).removeClass('hilight');
      }
    };

    // Poll for updates
    $scope.$on('$destroy', function () {
      that.$timeout.cancel(that.pollTimer);
    });

    this.fetch().then(function () {
      that.poll();
    });
  }

  angular.extend(ServiceManagerInstanceDetailController.prototype, {

    updateActions: function () {
      var isBusy = this.deleting || this.deleted || this.interestingState;
      this.actionsMap.configure.disabled = isBusy;
      this.actionsMap.delete.disabled = isBusy;

      var hasUpgrades = this.instance && this.instance.available_upgrades && this.instance.available_upgrades.length > 0;
      this.actionsMap.upgrade.disabled = isBusy || !hasUpgrades;
    },

    poll: function (fetchNow) {
      var that = this;
      if (that.deleted || that.notFound) {
        return;
      }

      // Cancel timer if one is outstanding
      if (this.pollTimer) {
        this.$timeout.cancel(this.pollTimer);
      }

      var pollTime = that.interestingState ? 2500 : 5000;
      pollTime = fetchNow ? 0 : pollTime;

      this.pollTimer = this.$timeout(function () {
        that.fetch().finally(function () {
          delete that.pollTimer;
          that.poll();
        });
      }, pollTime);
    },

    fetch: function () {
      var that = this;
      return this.hsmModel.getInstance(this.guid, this.id).then(function (data) {
        that.instance = data;
        that._fetchInstanceMetrics(that.instance);
        that._setStateIndicator();
        that._sortUpgrades();
      }).catch(function (err) {
        if (that.deleting) {
          that.deleted = true;
          that.instance.state = 'deleted';
          that._setStateIndicator();
        } else if (err.status === 404) {
          that.notFound = true;
          that.instance = that.instance || {};
          that.instance.state = '404';
          that._setStateIndicator();
        }
      });
    },

    _sortUpgrades: function () {
      var that = this;
      this.versionUtils.sortByProperty(this.instance.available_upgrades, 'product_version', true);
      _.each(this.instance.available_upgrades, function (product) {
        that.versionUtils.sortByProperty(product.sdl_versions, 'sdl_version', true);
      });
    },

    _setStateIndicator: function () {
      var that = this;
      that.interestingState = false;
      switch (this.instance.state) {
        case 'running':
          that.stateIndicator = 'ok';
          break;
        case 'creating':
          that.stateIndicator = 'busy';
          that.interestingState = true;
          break;
        case 'deleting':
          that.stateIndicator = 'busy';
          that.interestingState = true;
          break;
        case 'modifying':
          that.stateIndicator = 'busy';
          that.interestingState = true;
          break;
        case 'deleted':
          that.stateIndicator = 'deleted';
          break;
        case 'degraded':
          that.stateIndicator = 'warning';
          break;
        case '404':
          that.stateIndicator = 'error';
          break;
        default:
          that.stateIndicator = 'tentative';
      }
      this.updateActions();
    },

    deleteInstance: function (id) {
      var that = this;
      var dialog = this.confirmDialog({
        title: gettext('Delete Instance'),
        description: function () {
          return 'Are you sure that you want to delete instance "' + id + '" ?';
        },
        moment: moment,
        buttonText: {
          yes: gettext('Delete'),
          no: 'Cancel'
        }
      });
      dialog.result.then(function () {
        that.hsmModel.deleteInstance(that.guid, id).then(function () {
          that.deleting = true;
          that.poll(true);
        });
      });
    },

    upgradeInstance: function () {
      var that = this;
      that.manageInstanceDialog.show('upgrade', that.guid, null, that.instance).result.then(function () {
        that.poll(true);
      });
    },

    configureInstance: function () {
      var that = this;
      that.manageInstanceDialog.show('configure', that.guid, null, that.instance).result.then(function () {
        that.poll(true);
      });
    },

    updateCpuUsage: function (componentName) {
      var that = this;
      return this.metricsModel.getCpuUsageRate(this.metricsModel.makePodFilter(this.id, componentName))
        .then(function (metricsData) {
          if (_.has(metricsData, 'timeSeries')) {
            that.cpuUsageData[componentName] = metricsData.timeSeries;
          }
        });
    },
    updateMemoryUsage: function (componentName) {
      var that = this;
      return this.metricsModel.getMemoryUsage(this.metricsModel.makePodFilter(this.id, componentName))
        .then(function (metricsData) {
          if (_.has(metricsData, 'timeSeries')) {
            that.memoryUsageData[componentName] = metricsData.timeSeries;
          }
        });
    },

    _fetchInstanceMetrics: function (instance) {

      var that = this;
      var metricsPromises = [];
      _.each(instance.components, function (component) {
        if (component.state.phase !== 'Running') {
          return;
        }
        metricsPromises.push(that.updateCpuUsage(component.name));
        metricsPromises.push(that.updateMemoryUsage(component.name));
      });
      return this.$q.all(metricsPromises);
    }

  });

  UpgradeController.$inject = [
    '$state',
    'app.model.modelManager',
    'service-manager.utils.version'
  ];

  function UpgradeController($state, modelManager, versionUtils) {
    var that = this;
    var hsmModel = modelManager.retrieve('service-manager.model');
    this.hsmModel = hsmModel;
    this.versionUtils = versionUtils;
    this.guid = $state.params.guid;
    this.id = $state.params.id;

    function processUpgrades() {
      var upgrades = {};
      _.each(hsmModel.instance.available_upgrades, function (productUpgrade) {
        var pUpgrade = {};
        upgrades[productUpgrade.product_version] = pUpgrade;
        _.each(productUpgrade.sdl_versions, function (sdlUpgrade) {
          pUpgrade[sdlUpgrade.sdl_version] = sdlUpgrade.is_latest;
        });
      });
      return upgrades;
    }

    hsmModel.getInstances(this.guid).then(function (instances) {
      var instance = _.find(instances, {instance_id: that.id});
      var upgrades = processUpgrades(instance);
      var serviceId = instance.service_id;
      that.hsmModel.getService(that.guid, serviceId).then(function (data) {
        that.versions = data.product_versions;
        _.each(that.versions, function (product) {
          product.versions = [];
          _.each(product.sdl_versions, function (url, sdlVersion) {
            var isUpgrade = upgrades[product.product_version] && upgrades[product.product_version][sdlVersion];
            product.versions.push({
              sdl_version: sdlVersion,
              isUpgrade: !!isUpgrade,
              isLatest: _.isBoolean(isUpgrade) && isUpgrade,
              isCurrent: instance.product_version === product.product_version && instance.sdl_version === sdlVersion
            });
          });
          versionUtils.sortByProperty(product.versions, 'sdl_version', true);
        });
        versionUtils.sortByProperty(that.versions, 'product_version', true);
      });
    });
  }

})();
