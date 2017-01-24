(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.hce
   * @memberOf cloud-foundry.model
   * @name hce
   * @description Helion Code Engine model
   */
  angular
    .module('service-manager.model', [])
    .run(registerServiceManagerModel);

  registerServiceManagerModel.$inject = [
    '$q',
    'app.model.modelManager',
    'app.api.apiManager',
    'app.event.eventService'
  ];

  function registerServiceManagerModel($q, modelManager, apiManager, eventService) {
    modelManager.register('service-manager.model', new ServiceManagerModel($q, apiManager, modelManager, eventService));
  }

  /**
   * @memberof cloud-foundry.model.hce
   * @name ServiceManagerModel
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.event.eventService} eventService - the application event service
   * @param {object} $log - Angular $log service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {app.event.eventService} eventService - the application event service
   * @property {object} data - the Helion Code Engine data
   * @class
   */
  function ServiceManagerModel($q, apiManager, modelManager, eventService) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.eventService = eventService;
    this.modelManager = modelManager;

    this.hsmApi = this.apiManager.retrieve('service-manager.api.HsmApi');

    // Instances that have upgrades available
    this.upgrades = {};

    // Upgrades to ignore
    this.ignoreUpgrades = {};

    // Model - key for each HSM Service (Endpoint guid)
    this.model = {};
  }

  angular.extend(ServiceManagerModel.prototype, {

    getInstance: function (guid, id) {
      return this.hsmApi.instance(guid, id);
    },

    getInstances: function (guid, noCache) {
      var that = this;
      var loadPromise = this.hsmApi.instances(guid).then(function (data) {
        that.model[guid] = that.model[guid] || {};
        that.model[guid].instances = data;
        that._checkUpgrade(guid);
        return data;
      });
      return this.model[guid] && this.model[guid].instances && !noCache ? this.$q.resolve(this.model[guid].instances) : loadPromise;
    },

    getService: function (guid, id) {
      return this.hsmApi.service(guid, id);
    },

    getServices: function (guid, noCache) {
      var that = this;
      var loadPromise = this.hsmApi.services(guid).then(function (data) {
        that.model[guid] = that.model[guid] || {};
        that.model[guid].services = data;
        return data;
      });
      return this.model[guid] && this.model[guid].services && !noCache ? this.$q.resolve(this.model[guid].services) : loadPromise;
    },

    getServiceSdl: function (guid, id, productVersion, sdlVersion) {
      return this.hsmApi.serviceSdl(guid, id, productVersion, sdlVersion);
    },

    getServiceProduct: function (guid, id, productVersion) {
      return this.hsmApi.serviceProduct(guid, id, productVersion);
    },

    getModel: function (guid, noCache) {
      var that = this;
      return this.$q.all([
        this.getInstances(guid, noCache),
        this.getServices(guid, noCache)
      ]).then(function () {
        that._checkUpgrade(guid);
        return that.model[guid];
      });
    },

    createInstance: function (guid, id, productVersion, sdlVersion, instanceId, params) {
      return this.hsmApi.createInstance(guid, id, productVersion, sdlVersion, instanceId, params);
    },

    deleteInstance : function (guid, id) {
      return this.hsmApi.deleteInstance(guid, id);
    },

    getHsmEndpoints: function () {
      var userServices = this.modelManager.retrieve('app.model.serviceInstance.user');
      var hsmServices = _.filter(userServices.serviceInstances, {cnsi_type: 'hsm'});
      return hsmServices;
    },

    getUpgradeCount: function () {
      var count = 0;
      _.each(this.upgrades, function (svc) {
        count += svc.length;
      });
      return count;
    },

    // _buildModel: function (guid) {
    //   this._checkUpgrade(guid);
    //   var m = this.model[guid];
    //   m.instanceCount = m.instances.length;

    // },

    setUpgradesAvailable: function () {
      var that = this;
      var count = 0;
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      var menuItem = menu.getMenuItem('sm.list');
      _.each(this.upgrades, function (v, k) {
        if (!that.ignoreUpgrades[k]) {
          count++;
        }
      });

      if (count > 0) {
        menuItem.badge = {
          value: upgrades
        };
      } else {
        delete menuItem.badge;
      }
    },

    clearUpgrades: function (guid) {
      this.ignoreUpgrades[guid] = true;
      this.setUpgradesAvailable();
    },

    _checkUpgrade: function (guid) {
      var upgrades = [];
      var data = this.model[guid].instances;
      _.each(data, function (instance) {
        if (instance.available_upgrades && instance.available_upgrades.length) {
          instance.error = {
            message: instance.available_upgrades.length + ' upgrades are available for this instance',
            status: 'info'
          };
          upgrades.push(instance);
        }
      });
      this.upgrades[guid] = upgrades;
    },

    checkHsmForUpgrade: function (guid) {
      var that = this;
      return that.getInstances(guid).then(function () {
        that._checkUpgrade(guid);
      });
    },

    checkForUpgrades: function () {
      console.log('checkForUpgrades');
      var that = this;
      var promises = [];

      _.each(this.getHsmEndpoints(), function (hsm) {
        var p = that.getInstances(hsm.guid).then(function (data) {
          var upgrades = [];
          _.each(data, function (instance) {
            if (instance.available_upgrades && instance.available_upgrades.length) {
              instance.error = {
                message: instance.available_upgrades.length + ' upgrades are available for this instance',
                status: 'info'
              };
              upgrades.push(instance);
            }
          });
          that.upgrades[hsm.guid] = upgrades;
        });
        promises.push(p);
      });

      return this.$q.all(promises).then(function () {
        return that.getUpgradeCount();
      });
    }
  });
})();
