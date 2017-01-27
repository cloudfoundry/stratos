(function () {
  'use strict';

  /**
   * @namespace service-manager.model
   * @name service-manager.model
   * @description Helion Service Manager model
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
   * @param {object} $q - the Angular $q service
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the application event service
   * @property {object} $q - the Angular $q service
   * @property {app.model.modelManager} modelManager - the Model management service
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

    getTemplate: function (guid, sdl) {
      var templateUrl = sdl.templates['sdl.json'];
      return this.hsmApi.getTemplate(guid, templateUrl);
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
        count += Object.keys(svc).length;
      });
      return count;
    },

    setUpgradesAvailable: function () {
      var that = this;
      var count = 0;
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      var menuItem = menu.getMenuItem('sm.list');
      _.each(this.upgrades, function (instances, guid) {
        _.each(instances, function (value, id) {
          count = that.hasUpgrade(guid, id) ? count + 1 : count;
        });
      });

      if (count > 0) {
        menuItem.badge = {
          value: count
        };
      } else {
        delete menuItem.badge;
      }
    },

    hasUpgrade: function (guid, instanceId) {
      return this.upgrades[guid] && this.upgrades[guid][instanceId] &&
        !(this.ignoreUpgrades[guid] && this.ignoreUpgrades[guid][instanceId]);
    },

    hasUpgradeAvailable: function (guid, instanceId) {
      return this.upgrades[guid] && this.upgrades[guid][instanceId];
    },

    endpointHasUpgrades: function (guid) {
      return this.upgrades[guid] && Object.keys(this.upgrades[guid]).length &&
      !(this.ignoreUpgrades[guid] && Object.keys(this.upgrades[guid]).length === Object.keys(this.ignoreUpgrades[guid]).length);
    },

    clearUpgrades: function (guid, instanceId) {
      var that = this;
      this.ignoreUpgrades[guid] = this.ignoreUpgrades[guid] || {};
      if (instanceId) {
        this.ignoreUpgrades[guid][instanceId] = true;
      } else {
        _.each(this.upgrades[guid], function (value, id) {
          that.ignoreUpgrades[guid][id] = true;
        });
      }
      this.setUpgradesAvailable();
    },

    _checkUpgrade: function (guid, instanceData) {
      var upgrades = {};
      var data = instanceData ? instanceData : this.model[guid].instances;
      _.each(data, function (instance) {
        if (instance.available_upgrades && instance.available_upgrades.length) {
          upgrades[instance.instance_id] = true;
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
      var that = this;
      var promises = [];

      _.each(this.getHsmEndpoints(), function (hsm) {
        var p = that.getInstances(hsm.guid).then(function (data) {
          that._checkUpgrade(hsm.guid, data);
        });
        promises.push(p);
      });

      return this.$q.all(promises).then(function () {
        return that.getUpgradeCount();
      });
    }
  });
})();
