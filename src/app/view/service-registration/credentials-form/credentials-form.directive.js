(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('credentialsForm', credentialsForm);

  credentialsForm.$inject = ['app.basePath'];

  /**
   * @namespace app.view.credentialsForm
   * @memberof app.view
   * @name credentialsForm
   * @description A credentials-form directive that allows
   * user to enter a username and password to register
   * accessible services/clusters
   * @param {string} path - the application base path
   * @example
   * <credentials-form service-instance="ctrl.serviceToRegister"
   *   on-cancel="ctrl.registerCancelled()"
   *   onSubmit="ctrl.registerSubmitted()">
   * </credentials-form>
   * @returns {object} The credentials-form directive definition object
   */
  function credentialsForm(path) {
    return {
      bindToController: {
        onCancel: '&?',
        onSubmit: '&?',
        serviceInstance: '='
      },
      controller: CredentialsFormController,
      controllerAs: 'credentialsFormCtrl',
      scope: {},
      templateUrl: path + 'view/service-registration/credentials-form/credentials-form.html'
    };
  }

  CredentialsFormController.$inject = [
    '$scope',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.credentialsForm.CredentialsFormController
   * @memberof app.view.credentialsForm
   * @name CredentialsFormController
   * @description Controller for credentialsForm directive that handles
   * service/cluster registration
   * @constructor
   * @param {object} $scope - this controller's directive scope
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.serviceInstance} serviceInstanceModel - the service instance model
   * @property {boolean} authenticating - a flag that authentication is in process
   * @property {boolean} failedRegister - an error flag for bad credentials
   * @property {boolean} serverErrorOnRegister - an error flag for a server error
   * @property {boolean} serverFailedToRespond - an error flag for no server response
   * @property {object} _data - the view data (copy of service)
   */
  function CredentialsFormController($scope, modelManager) {
    var ctrl = this;

    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.authenticating = false;
    this.failedRegister = false;
    this.serverErrorOnRegister = false;
    this.serverFailedToRespond = false;

    $scope.$watchCollection(function watchService() {
      return ctrl.serviceInstance;
    }, function serviceInstanceChanged(newValue) {
      ctrl._data = angular.extend({}, newValue);
    });
  }

  angular.extend(CredentialsFormController.prototype, {
    cancel: function () {
      delete this._data.service_user;
      delete this._data.service_password;

      if (angular.isDefined(this.onCancel)) {
        this.onCancel();
      }

      this.reset();
    },
    register: function () {
      var that = this;
      this.authenticating = true;

      this.serviceInstanceModel.register(this._data.name, this._data.service_user, this._data.service_password)
        .then(function onSuccess() {
          that.registerSuccessful();
        }, function onError(response) {
          that.registerFailed(response);
        });
    },
    registerFailed: function (response) {
      if (response.status === -1) {
        // handle the case when the server never responds
        this.serverFailedToRespond = true;
        this.serverErrorOnRegister = false;
        this.failedRegister = false;
      } else if (response.status >= 500 && response.status < 600) {
        // handle 5xx errors when attempting to authenticate
        this.serverFailedToRespond = false;
        this.serverErrorOnRegister = true;
        this.failedRegister = false;
      } else {
        // general authentication failed
        this.serverFailedToRespond = false;
        this.serverErrorOnRegister = false;
        this.failedRegister = true;
      }

      delete this._data.service_password;
      this.authenticating = false;
    },
    registerSuccessful: function () {
      this._data.registered = true;
      delete this._data.service_password;

      if (angular.isDefined(this.onSubmit)) {
        this.onSubmit({ data: this._data });
      }

      this.reset();
    },
    reset: function () {
      this.failedRegister = false;
      this.serverErrorOnRegister = false;
      this.serverFailedToRespond = false;

      this.authenticating = false;
      this.credentialsForm.$setPristine();
    }
  });

})();
