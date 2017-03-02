(function () {
  'use strict';

  /**
   * @namespace control-plane.model
   * @name control-plane.model
   * @description Helion Control Plane model
   */
  angular
    .module('control-plane.model', [])
    .run(registerControlPlaneModel);

  registerControlPlaneModel.$inject = [
    '$q',
    'app.model.modelManager',
    'app.api.apiManager',
    'app.event.eventService'
  ];

  function registerControlPlaneModel($q, modelManager, apiManager, eventService) {
    modelManager.register('control-plane.model', new ControlPlaneModel($q, apiManager, modelManager, eventService));
  }

  function ControlPlaneModel($q, apiManager, modelManager, eventService) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.eventService = eventService;
    this.modelManager = modelManager;

    this.hcpApi = this.apiManager.retrieve('control-plane.api.HcpApi');

    this.model = {};

  }

  angular.extend(ControlPlaneModel.prototype, {

    _getAll: function (getter, propertyName, guid, noCache, noFetch) {
      var that = this;
      var loadPromise;

      if (noFetch && this.model[guid] && this.model[guid][propertyName]) {
        loadPromise = this.$q.resolve();
      } else {
        loadPromise = _.bind(getter, this.hcpApi)(guid).then(function (data) {
          that.model[guid] = that.model[guid] || {};
          that.model[guid][propertyName] = data;
          return data;
        });

        return this.model[guid] && this.model[guid][propertyName] && !noCache ? this.$q.resolve(this.model[guid][propertyName]) : loadPromise;
      }

      return loadPromise;
    },

    getComputeNode: function (guid, id) {
      return this.hcpApi.computes(guid, id).then(function (data) {
        return data;
      });
    },

    getComputeNodes: function (guid, noCache, noFetch) {
      return this._getAll(this.hcpApi.computes, 'compute', guid, noCache, noFetch);
    },

    getInstance: function (guid, id) {
      return this.hcpApi.instances(guid, id).then(function (data) {
        return data;
      });
    },

    getInstances: function (guid, noCache, noFetch) {
      return this._getAll(this.hcpApi.instances, 'instance', guid, noCache, noFetch);
    },

    getTask: function (guid, id) {
      return this.hcpApi.tasks(guid, id).then(function (data) {
        return data;
      });
    },

    getTasks: function (guid, noCache, noFetch) {
      return this._getAll(this.hcpApi.tasks, 'task', guid, noCache, noFetch);
    }

  });
})
();
