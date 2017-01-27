(function () {
  'use strict';

  angular
    .module('service-manager.view.create-instance.form', [])
    .directive('createInstanceForm', createInstanceForm);

  createInstanceForm.$inject = [
  ];

  /**
   * @name application
   * @returns {object} The create instance form directive definition object
   */
  function createInstanceForm() {
    return {
      controller: CreateInstanceForm,
      controllerAs: 'ciFormCtrl',
      templateUrl: 'plugins/service-manager/view/create-instance/create-instance-form.html',
      scope: {
        data: '='
      },
      bindToController: true
    };
  }

  CreateInstanceForm.$inject = [
    '$scope',
    '$q',
    '$window',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.application.ApplicationController
   * @memberof app.view.application
   * @name CreateInstanceForm
   * @param {object} $scope - the Angular $scope service
   * @param {object} $q - the Angular $q promise service
   * @param {object} $window - the Angular $window service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @class
   */
  function CreateInstanceForm($scope, $q, $window, modelManager) {
    var that = this;
    this.$q = $q;
    this.hsmModel = modelManager.retrieve('service-manager.model');
    this.data.form = $scope.form;
    this.data.params = [];

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

    this.serviceChanged(this.data.productVersion, this.data.sdlVersion);
  }

  angular.extend(CreateInstanceForm.prototype, {
    readInstanceFile: function (file, encoding) {
      var deferred = this.$q.defer();
      var reader = new this.FileReader();
      reader.onload = function () {
        deferred.resolve(reader.result);
      };
      reader.onerror = function () {
        deferred.reject(reader.result);
      };

      reader.readAsText(file, encoding);
      return deferred.promise;
    },

    read: function () {
      var that = this;
      this.readInstanceFile(this.instanceFile).then(function (text) {
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
        });

        if (productVersion) {
          this.data.product = productVersion;
        } else {
          this.data.product = service.product_versions[0].product_version;
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
        if (!this.data.services[sdlVersion]) {
          this.data.sdl = found ? found.value : undefined;
        }
      }
      this.sdlChanged();
    },

    sdlChanged: function () {
      var that = this;
      if (this.data.sdl) {
        this.hsmModel.getServiceSdl(this.data.guid, this.service.id, this.data.product, this.data.sdl).then(function (sdl) {
          that.parameters = sdl.parameters;
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
          return param.required && !param.generator && !param.secret && !param.default;
        });
      } else {
        that.shownParams = that.parameters;
      }
    }
  });
})();
