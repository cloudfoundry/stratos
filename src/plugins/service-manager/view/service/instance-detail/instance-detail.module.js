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
    '$state',
    '$stateParams',
    'app.utils.utilsService',
    'modelManager',
    'helion.framework.widgets.dialog.confirm',
    'service-manager.view.manage-instance.dialog',
    'service-manager.utils.version'
  ];

  function ServiceManagerInstanceDetailController($scope, $timeout, $state, $stateParams, utils, modelManager,
                                                  confirmDialog, manageInstanceDialog, versionUtils) {
    var that = this;

    this.initialized = false;
    this.guid = $stateParams.guid;
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.confirmDialog = confirmDialog;
    this.manageInstanceDialog = manageInstanceDialog;
    this.$timeout = $timeout;
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

    this.actions = [
      { id: 'upgrade', name: gettext('Upgrade Instance'),
        execute: function () {
          return that.upgradeInstance(that.id);
        }
      },
      { id: 'configure', name: gettext('Configure Instance'),
        execute: function () {
          return that.configureInstance(that.id);
        }
      },
      { id: 'delete', name: gettext('Delete Instance'),
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
      that.scopeDestroyed = true;
      that.$timeout.cancel(that.pollTimer);
    });

    $scope.$watch(function () {
      return that.hsmModel.hideCompletedComponents;
    }, function () {
      that._filterComponents();
    });

    if (angular.isUndefined(that.hsmModel.hideCompletedComponents)) {
      that.hsmModel.hideCompletedComponents = true;
    }

    this.fetch().then(function () {
      that.poll();
    });
  }

  angular.extend(ServiceManagerInstanceDetailController.prototype, {

    updateActions: function () {
      var isDelete = this.deleting || this.deleted || this.instance.state === 'deleting' ||
        this.instance.state === 'deleted';
      var isBusy = isDelete || this.interestingState;
      this.actionsMap.configure.disabled = isBusy;
      this.actionsMap.delete.disabled = isDelete;

      var hasUpgrades = this.instance && this.instance.available_upgrades && this.instance.available_upgrades.length > 0;
      this.actionsMap.upgrade.disabled = isBusy || !hasUpgrades;
    },

    poll: function (fetchNow) {
      if (this.scopeDestroyed) {
        return;
      }

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
        that._filterComponents();
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

    _filterComponents: function () {
      var that = this;
      if (!that.instance) {
        this.components = [];
      } else {
        this.components = _.filter(that.instance.components, function (item) {
          var inactive = item.state.phase === 'Failed' || item.state.phase === 'Succeeded';
          return that.hsmModel.hideCompletedComponents ? !inactive : true;
        });
      }
    },

    _sortUpgrades: function () {
      var that = this;
      this.versionUtils.sortByProperty(this.instance.available_upgrades, 'product_version', true);
      _.each(this.instance.available_upgrades, function (product) {
        that.versionUtils.sortByProperty(product.sdl_versions, 'sdl_version', true);
      });
    },

    _setStateIndicator: function () {
      this.stateIndicator = this.hsmModel.instanceStateIndicator(this.instance.state);
      this.interestingState = false;
      switch (this.instance.state) {
        case 'creating':
          this.interestingState = true;
          break;
        case 'deleting':
          this.interestingState = true;
          break;
        case 'modifying':
          this.interestingState = true;
          break;
      }
      this.updateActions();
    },

    deleteInstance: function (id) {
      var that = this;
      var dialog = this.confirmDialog({
        title: gettext('Delete Instance'),
        description: function () {
          return gettext('Are you sure that you want to delete instance "' + id + '" ?');
        },
        moment: moment,
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
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
    }
  });

  UpgradeController.$inject = [
    '$state',
    '$q',
    'modelManager',
    'app.utils.utilsService',
    'service-manager.utils.version'
  ];

  function UpgradeController($state, $q, modelManager, utils, versionUtils) {
    var that = this;

    this.versionUtils = versionUtils;
    this.guid = $state.params.guid;
    this.id = $state.params.id;

    function processUpgrades(instance) {
      var upgrades = {};
      _.each(instance.available_upgrades, function (productUpgrade) {
        var pUpgrade = {};
        upgrades[productUpgrade.product_version] = pUpgrade;
        _.each(productUpgrade.sdl_versions, function (sdlUpgrade) {
          pUpgrade[sdlUpgrade.sdl_version] = sdlUpgrade.is_latest;
        });
      });
      return upgrades;
    }

    function init() {
      that.hsmModel = modelManager.retrieve('service-manager.model');

      var instances = that.hsmModel.model[that.guid].instances;
      var instance = _.find(instances, {instance_id: that.id});

      if (!instance) {
        return $q.reject('Instance with id \'' + that.id + '\' not found: ');
      }

      var upgrades = processUpgrades(instance);
      var services = that.hsmModel.model[that.guid].services;
      var service = _.find(services, {id: instance.service_id});

      if (!service) {
        return $q.reject('Service with id \'' + instance.service_id + '\' not found: ');
      }

      that.versions = service.product_versions;
      _.each(that.versions, function (product) {
        product.versions = [];
        product.isUpgrade = _.has(upgrades, product.product_version);
        _.each(product.sdl_versions, function (url, sdlVersion) {
          var isUpgrade = upgrades[product.product_version] && _.has(upgrades[product.product_version], sdlVersion);
          var isLatest = product.latest === sdlVersion;
          product.versions.push({
            sdl_version: sdlVersion,
            isUpgrade: isUpgrade,
            isLatest: isLatest,
            isCurrent: instance.product_version === product.product_version && instance.sdl_version === sdlVersion
          });
        });
        versionUtils.sortByProperty(product.versions, 'sdl_version', true);
      });
      versionUtils.sortByProperty(that.versions, 'product_version', true);
    }

    utils.chainStateResolve('sm.endpoint.instance.versions', $state, init);

  }

})();
