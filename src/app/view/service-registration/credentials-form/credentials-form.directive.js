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
   * <credentials-form service="ctrl.serviceToRegister"
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
        service: '='
      },
      controller: CredentialsFormController,
      controllerAs: 'credentialsFormCtrl',
      scope: {},
      templateUrl: path + 'view/service-registration/credentials-form/credentials-form.html'
    };
  }

  CredentialsFormController.$inject = [
    '$scope',
    'app.event.eventService',
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
   * @param {app.event.eventService} eventService - the application event bus
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.model.account} account - the account model
   * @property {app.event.eventService} eventService - the application event bus
   * @property {boolean} authenticating - a flag that authentication is in process
   * @property {boolean} failedRegister - an error flag for bad credentials
   * @property {boolean} serverErrorOnRegister - an error flag for a server error
   * @property {boolean} serverFailedToRespond - an error flag for no server response
   * @property {object} _data - the view data (copy of service)
   */
  function CredentialsFormController($scope, eventService, modelManager) {
    var ctrl = this;

    this.account = modelManager.retrieve('app.model.account');
    this.eventService = eventService;
    this.authenticating = false;
    this.failedRegister = false;
    this.serverErrorOnRegister = false;
    this.serverFailedToRespond = false;

    $scope.$watchCollection(function watchService() {
      return ctrl.service;
    }, function serviceChanged(newValue) {
      ctrl._data = angular.extend({}, newValue);
    });
  }

  angular.extend(CredentialsFormController.prototype, {
    cancel: function () {
      delete this._data.username;
      delete this._data.password;

      if (angular.isDefined(this.onCancel)) {
        this.onCancel();
      }

      this.reset();
    },
    register: function () {
      this.authenticating = true;

      // mock authenticate credentials
      this._data.registered = true;
      delete this._data.password;

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
