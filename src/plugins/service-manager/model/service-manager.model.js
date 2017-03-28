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
    '$timeout',
    'modelManager',
    'apiManager',
    'app.event.eventService'
  ];

  function registerServiceManagerModel($q, $timeout, modelManager, apiManager, eventService) {
    modelManager.register('service-manager.model', new ServiceManagerModel($q, $timeout, apiManager, modelManager,
      eventService));
  }

  /**
   * @memberof cloud-foundry.model.hce
   * @name ServiceManagerModel
   * @param {object} $q - the Angular $q service
   * @param {object} $timeout - the Angular $timeout service
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
  function ServiceManagerModel($q, $timeout, apiManager, modelManager, eventService) {
    this.$q = $q;
    this.$timeout = $timeout;
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

    // Last loaded instance
    this.instance = {};
  }

  angular.extend(ServiceManagerModel.prototype, {

    // Can the user perform destructive/write operations and/or create new instances in HSM?
    // Implemented as method here so we can base this off of the user in the future
    canWrite: function () {
      return false;
    },

    instanceStateIndicator: function (instanceState) {
      switch (instanceState) {
        case 'running':
          return 'ok';
        case 'creating':
          return 'busy';
        case 'deleting':
          return 'busy';
        case 'modifying':
          return 'busy';
        case 'deleted':
          return 'deleted';
        case 'degraded':
          return 'warning';
        case 'failed':
          return 'error';
        case '404':
          return 'error';
      }

      return 'tentative';
    },

    getInstance: function (guid, id) {
      var that = this;
      return this.hsmApi.instance(guid, id).then(function (data) {
        that.instance = data;
        // Also update the root instances collection
        var instances = _.get(that, 'model[' + guid + '].instances');
        if (instances) {
          for (var i = 0; i < instances.length; i++) {
            if (instances[i].instance_id === data.instance_id) {
              instances[i] = data;
              break;
            }
          }
        }
        return data;
      });
    },

    getInstances: function (guid, noCache, noFetch) {
      var that = this;
      var loadPromise;

      if (noFetch && this.model[guid] && this.model[guid].instances) {
        loadPromise = this.$q.resolve();
      } else {
        loadPromise = this.hsmApi.instances(guid).then(function (data) {
          that.model[guid] = that.model[guid] || {};
          that.model[guid].instances = _.sortBy(data, 'instance_id');
          that._checkUpgrade(guid);
          return data;
        });
      }
      return this.model[guid] && this.model[guid].instances && !noCache ? this.$q.resolve(this.model[guid].instances) : loadPromise;
    },

    /* eslint-disable angular/no-service-method */
    getService: function (guid, id) {
      return this.hsmApi.service(guid, id);
    },
    /* eslint-enable angular/no-service-method */

    getServices: function (guid, noCache) {
      var that = this;
      var loadPromise = this.hsmApi.services(guid).then(function (data) {
        that.model[guid] = that.model[guid] || {};
        that.model[guid].services = _.sortBy(data, 'id');
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
      var that = this;
      return this.hsmApi.createInstance(guid, id, productVersion, sdlVersion, instanceId, params)
        .then(function (response) {
          // Async update the model instances collection
          that.getInstance(guid, response.instance_id).then(function (instance) {
            that.model[guid].instances.push(instance);
          });
          return response;
        })
        .catch(function (response) {
          if (response.status === 500) {
            // Sometimes the request can fail but the actual action can start. In these cases update the core instances
            // collection just in case
            that.$timeout(function () {
              that.getInstances(guid);
            }, 5000);
          }
          return that.$q.reject(response);
        });
    },

    deleteInstance : function (guid, id) {
      var that = this;
      return this.hsmApi.deleteInstance(guid, id).then(function (response) {
        // Update the model instances collection
        _.remove(that.model[guid].instances, { instance_id: id });
        return response;
      });
    },

    configureInstance: function (serviceManagerGuid, instance, params) {
      var that = this;
      return this.hsmApi.configureInstance(serviceManagerGuid, instance, params).then(function (response) {
        // Async update the model instances collection
        that.getInstance(serviceManagerGuid, instance.instance_id);
        return response;
      });
    },

    getHsmEndpoints: function () {
      var userServices = this.modelManager.retrieve('app.model.serviceInstance.user');
      return _.filter(userServices.serviceInstances, {cnsi_type: 'hsm'});
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
      if (menuItem) {
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
      this.upgrades = {};

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
