(function () {
  'use strict';

  angular
    .module('service-manager.view.manage-instance.form', [])
    .directive('manageInstanceForm', manageInstanceForm);

  manageInstanceForm.$inject = [
  ];

  /**
   * @name application
   * @returns {object} The manage instance form directive definition object
   */
  function manageInstanceForm() {
    return {
      controller: ManageInstanceForm,
      controllerAs: 'ciFormCtrl',
      templateUrl: 'plugins/service-manager/view/manage-instance/manage-instance-form.html',
      scope: {
        data: '='
      },
      bindToController: true
    };
  }

  ManageInstanceForm.$inject = [
    '$scope',
    '$q',
    '$window',
    'app.model.modelManager',
    'service-manager.utils.version'
  ];

  /**
   * @name ManageInstanceForm
   * @param {object} $scope - the Angular $scope service
   * @param {object} $q - the Angular $q promise service
   * @param {object} $window - the Angular $window service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} versionUtils - version utils service
   * @class
   */
  function ManageInstanceForm($scope, $q, $window, modelManager, versionUtils) {
    var that = this;
    this.$q = $q;
    this.hsmModel = modelManager.retrieve('service-manager.model');
    this.versionUtils = versionUtils;
    this.data.form = $scope.form;
    this.data.params = {};

    this.sdlOptions = [];

    this.instanceFile = {};

    this.FileReader = $window.FileReader;

    $scope.$watch('form', function (f) {
      that.data.form = f;
    });

    $scope.$watch(function () {
      return that.instanceFile;
    }, function () {
      if (that.instanceFile.name) {
        that.read();
      }
    });

    this.serviceOptions = [];

    _.each(this.data.services, function (svc, name) {
      that.serviceOptions.push({
        label: name,
        value: name
      });
    });

    if (this.data.mode === 'create') {
      this.serviceChanged(this.data.productVersion, this.data.sdlVersion);
    }

    if (this.data.mode === 'upgrade') {
      this.getUpgradeMetadata();
    }

    if (this.data.instance) {
      this.shownParams = this.data.instance.parameters;
      _.each(this.shownParams, function (p) {
        p.default = p.value;
      });
    }
  }

  angular.extend(ManageInstanceForm.prototype, {
    readInstanceFile: function (file, encoding) {
      var deferred = this.$q.defer();
      var reader = new this.FileReader();
      reader.onload = function () {
        deferred.resolve(reader.result);
      };
      reader.onerror = function () {
        deferred.reject(reader.result);
      };

      try {
        reader.readAsText(file, encoding);
      } catch (exception) {
        deferred.reject(exception);
      }

      return deferred.promise;
    },

    read: function () {
      var that = this;
      this.readInstanceFile(this.instanceFile).then(function (text) {
        // Possible improvement - Add general error handling + messages to cover unexpected file content/syntax or
        // missing required properties. At the moment these silently fail.

        // Exceptions will get caught later down the promise chain
        var json = angular.fromJson(text);
        if (json.instance_id) {
          that.data.instanceId = json.instance_id;
        }
        if (json.name) {
          that.data.serviceId = json.name;
          that.serviceChanged(json.product_version, json.sdl_version);
        }
        if (json.parameters) {
          that.data.params = {};
          _.each(json.parameters, function (p) {
            that.data.params[p.name] = p.value;
          });
        }
//      }).catch(function (err) {
      });
    },

    serviceChanged: function (productVersion, sdlVersion) {
      var that = this;
      var service = this.data.services[this.data.serviceId];
      this.service = service;
      this.productVersions = [];
      this.sdlVersions = {};

      if (service) {
        _.each(service.product_versions, function (version) {
          that.productVersions.push({
            label: version.product_version,
            value: version.product_version
          });
          var sdl = [];
          that.sdlVersions[version.product_version] = sdl;
          _.each(version.sdl_versions, function (url, sdlVersion) {
            sdl.push({
              label: sdlVersion,
              value: sdlVersion,
              latest: sdlVersion === version.latest
            });
          });
          that.versionUtils.sortByProperty(sdl, 'value', true);
        });

        this.versionUtils.sortByProperty(that.productVersions, 'value', true);

        if (productVersion) {
          this.data.product = productVersion;
        } else {
          this.data.product = this.productVersions[0].value;
        }
      }
      this.productChanged(sdlVersion);
    },

    productChanged: function (sdlVersion) {
      this.data.sdl = undefined;
      this.sdlOptions = this.sdlVersions[this.data.product] || [];
      var found = _.find(this.sdlOptions, {latest: true});
      if (!sdlVersion) {
        this.data.sdl = found ? found.value : undefined;
      } else {
        this.data.sdl = sdlVersion;
        if (!_.find(this.sdlOptions, {value: sdlVersion})) {
          this.data.sdl = found ? found.value : undefined;
        }
      }
      this.sdlChanged();
    },

    isParamRequired: function (param) {
      return param.required && !param.generator && !(param.default || _.isString(param.default));
    },

    sdlChanged: function () {
      var that = this;
      if (this.data.sdl) {
        this.hsmModel.getServiceSdl(this.data.guid, this.service.id, this.data.product, this.data.sdl).then(function (sdl) {
          that.parameters = sdl.parameters;
          _.each(that.parameters, function (param) {
            param.notSupplied = that.isParamRequired(param);
          });
          that.showAllParams(false);
        });
      } else {
        this.parameters = undefined;
      }
    },

    showAllParams: function (showAll) {
      var that = this;
      if (!showAll) {
        that.shownParams = _.filter(that.parameters, function (param) {
          return that.isParamRequired(param);
        });
      } else {
        that.shownParams = that.parameters;
      }
    },

    getUpgradeMetadata: function () {
      var that = this;
      this.productVersions = [];
      this.sdlVersions = {};
      var upgrades = this.data.instance.available_upgrades;
      _.each(upgrades, function (version) {
        that.productVersions.push({
          label: version.product_version,
          value: version.product_version
        });
        var sdl = [];
        that.sdlVersions[version.product_version] = sdl;
        _.each(version.sdl_versions, function (sdlVersion) {
          sdl.push({
            label: sdlVersion.sdl_version,
            value: sdlVersion.sdl_version,
            latest: sdlVersion.is_latest
          });
        });
        that.versionUtils.sortByProperty(sdl, 'value', true);
      });
      this.versionUtils.sortByProperty(that.productVersions, 'value', true);
      this.data.product = that.productVersions[0].value;
      this.sdlOptions = this.sdlVersions[this.data.product] || [];
      var found = _.find(this.sdlOptions, {latest: true});
      this.data.sdl = found ? found.value : undefined;
    }
  });
})();
