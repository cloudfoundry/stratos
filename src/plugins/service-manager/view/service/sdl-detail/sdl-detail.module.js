(function () {
  'use strict';

  angular
    .module('service-manager.view.service.sdl-detail', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('sm.endpoint.service.sdl', {
      url: '/sdl/:product/:sdl',
      templateUrl: 'plugins/service-manager/view/service/sdl-detail/sdl-detail.html',
      controller: ServiceManagerSdlDetailController,
      controllerAs: 'sdlCtrl',
      ncyBreadcrumb: {
        label: '{{ sdlCtrl.pv }} ({{ sdlCtrl.sv }})',
        parent: 'sm.endpoint.service.detail'
      },
      data: {
        activeMenuState: 'sm.list'
      }
    });
  }

  ServiceManagerSdlDetailController.$inject = [
    '$stateParams',
    '$log',
    'app.utils.utilsService',
    '$state',
    '$q',
    'app.model.modelManager'
  ];

  function ServiceManagerSdlDetailController($stateParams, $log, utils, $state, $q, modelManager) {
    var that = this;
    that.loading = true;

    this.initialized = false;
    this.guid = $stateParams.guid;
    this.id = $stateParams.id;
    this.pv = $stateParams.product;
    this.sv = $stateParams.sdl;

    this.hsmModel = modelManager.retrieve('service-manager.model');

    this.hsmModel.getService(that.guid, that.id).then(function (data) {
      that.service = data;
      return that.hsmModel.getServiceSdl(that.guid, that.id, that.pv, that.sv).then(function (sdl) {
        return that.hsmModel.getTemplate(that.guid, sdl).then(function (template) {
          that.template = template;
        });
      });
    }).finally(function () {
      that.initialized = true;
      that.loading = false;
      that.json = that.template;
    });
  }

  angular.extend(ServiceManagerSdlDetailController.prototype, {

    filterSDL: function () {
      this.json = this.applyFilter(this.template, this.filter);
    },

    escapeRegExp: function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    },

    applyFilter: function (source, filter) {
      if (!filter) {
        return source;
      }

      var json = {};
      var regex = new RegExp(this.escapeRegExp(filter.toLowerCase()));
      json = this.filterObject(source, regex);
      return json;
    },

    include: function (value) {
      if (_.isArray(value)) {
        return value.length;
      } else if (_.isObject(value)) {
        /* eslint-disable angular/no-private-call */
        var min = value.$$hashKey ? 1 : 0;
        /* eslint-enable angular/no-private-call */
        return Object.keys(value).length > min;
      } else {
        return value;
      }
    },

    filterObject: function (source, regex) {
      var that = this;
      if (_.isArray(source)) {
        var destArray = [];
        _.each(source, function (value) {
          var found = that.filterObject(value, regex);

          if (that.include(found)) {
            destArray.push(found);
          }
        });
        return destArray;
      } else if (_.isObject(source)) {
        var dest = {};
        _.each(source, function (value, key) {
          var found = that.filterObject(value, regex);
          if (that.include(found)) {
            dest[key] = found;
          }
        });
        return dest;
      } else {
        var value = source.toString().toLowerCase();
        if (regex.test(value)) {
          return source;
        }
        return undefined;
      }
    }
  });
})();
