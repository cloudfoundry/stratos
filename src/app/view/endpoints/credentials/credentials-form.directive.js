(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('credentialsForm', credentialsForm);

  /**
   * @namespace app.view.credentialsForm
   * @memberof app.view
   * @name credentialsForm
   * @description A credentials-form directive that allows
   * user to enter a username and password to register
   * accessible CNSIs.
   * @example
   * <credentials-form cnsi="ctrl.serviceToRegister"
   *   on-cancel="ctrl.registerCancelled()"
   *   on-submit="ctrl.registerSubmitted()">
   * </credentials-form>
   * @returns {object} The credentials-form directive definition object
   */
  function credentialsForm() {
    return {
      bindToController: {
        cnsi: '=',
        onCancel: '&?',
        onSubmit: '&?'
      },
      controller: CredentialsFormController,
      controllerAs: 'credentialsFormCtrl',
      scope: {},
      templateUrl: 'app/view/endpoints/credentials/credentials-form.html'
    };
  }

  /**
   * @namespace app.view.credentialsForm.CredentialsFormController
   * @memberof app.view.credentialsForm
   * @name CredentialsFormController
   * @description Controller for credentialsForm directive that handles
   * service/cluster registration
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.view.appNotificationsService} appNotificationsService - the toast notification service
   * @property {boolean} authenticating - a flag that authentication is in process
   * @property {boolean} failedRegister - an error flag for bad credentials
   * @property {boolean} serverErrorOnRegister - an error flag for a server error
   * @property {boolean} serverFailedToRespond - an error flag for no server response
   * @property {object} _data - the view data (copy of service)
   */
  function CredentialsFormController(modelManager, appNotificationsService) {
    var vm = this;

    vm.authenticating = false;
    vm.failedRegister = false;
    vm.serverErrorOnRegister = false;
    vm.serverFailedToRespond = false;
    vm._data = {};
    vm.cancel = cancel;
    vm.connect = connect;
    vm.reset = reset;

    var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');

    /**
     * @function cancel
     * @memberOf app.view.credentialsForm.CredentialsFormController
     * @description Cancel credentials form
     * @returns {void}
     */
    function cancel() {
      vm.reset();
      if (angular.isDefined(vm.onCancel)) {
        vm.onCancel();
      }
    }

    /**
     * @function connect
     * @memberOf app.view.credentialsForm.CredentialsFormController
     * @description Connect service instance for user
     * @returns {void}
     */
    function connect() {
      vm.authenticating = true;
      userServiceInstanceModel.connect(vm.cnsi.guid, vm.cnsi.name, vm._data.username, vm._data.password)
        .then(function success(response) {
          appNotificationsService.notify('success', gettext("Successfully connected to '") + vm.cnsi.name + "'");
          vm.reset();
          if (angular.isDefined(vm.onSubmit)) {
            vm.onSubmit({serviceInstance: response.data});
          }
        }, function (err) {
          if (err.status >= 400) {
            vm.failedRegister = true;
            vm.authenticating = false;
          }
        });
    }

    /**
     * @function reset
     * @memberOf app.view.credentialsForm.CredentialsFormController
     * @description Reset credentials form
     * @returns {void}
     */
    function reset() {
      vm._data = {};

      vm.failedRegister = false;
      vm.serverErrorOnRegister = false;
      vm.serverFailedToRespond = false;

      vm.authenticating = false;
      vm.credentialsForm.$setPristine();
    }
  }

})();
