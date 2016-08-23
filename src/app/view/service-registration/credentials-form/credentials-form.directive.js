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
   * accessible CNSIs.
   * @param {string} path - the application base path
   * @example
   * <credentials-form cnsi="ctrl.serviceToRegister"
   *   on-cancel="ctrl.registerCancelled()"
   *   on-submit="ctrl.registerSubmitted()">
   * </credentials-form>
   * @returns {object} The credentials-form directive definition object
   */
  function credentialsForm(path) {
    return {
      bindToController: {
        cnsi: '=',
        onCancel: '&?',
        onSubmit: '&?'
      },
      controller: CredentialsFormController,
      controllerAs: 'credentialsFormCtrl',
      scope: {},
      templateUrl: path + 'view/service-registration/credentials-form/credentials-form.html'
    };
  }

  CredentialsFormController.$inject = [
    'app.event.eventService',
    'app.model.modelManager',
    'app.view.notificationsService'
  ];

  /**
   * @namespace app.view.credentialsForm.CredentialsFormController
   * @memberof app.view.credentialsForm
   * @name CredentialsFormController
   * @description Controller for credentialsForm directive that handles
   * service/cluster registration
   * @constructor
   * @param {app.event.eventService} eventService - the application event bus
   * @param {app.model.modelManager} modelManager - the application model manager
   * @param {app.view.notificationsService} notificationsService - the toast notification service
   * @property {app.event.eventService} eventService - the application event bus
   * @property {boolean} authenticating - a flag that authentication is in process
   * @property {boolean} failedRegister - an error flag for bad credentials
   * @property {boolean} serverErrorOnRegister - an error flag for a server error
   * @property {boolean} serverFailedToRespond - an error flag for no server response
   * @property {object} _data - the view data (copy of service)
   */
  function CredentialsFormController(eventService, modelManager, notificationsService) {
    this.userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    this.eventService = eventService;
    this.notificationsService = notificationsService;
    this.authenticating = false;
    this.failedRegister = false;
    this.serverErrorOnRegister = false;
    this.serverFailedToRespond = false;
    this._data = {};
  }

  angular.extend(CredentialsFormController.prototype, {
    /**
     * @function cancel
     * @memberOf app.view.credentialsForm.CredentialsFormController
     * @description Cancel credentials form
     * @returns {void}
     */
    cancel: function () {
      this.reset();
      if (angular.isDefined(this.onCancel)) {
        this.onCancel();
      }
    },

    /**
     * @function connect
     * @memberOf app.view.credentialsForm.CredentialsFormController
     * @description Connect service instance for user
     * @returns {void}
     */
    connect: function () {
      var that = this;
      this.authenticating = true;
      this.userServiceInstanceModel.connect(this.cnsi.guid, this.cnsi.name, this._data.username, this._data.password)
        .then(function success(response) {
          that.notificationsService.notify('success', gettext('Credentials validated'));
          that.reset();
          if (angular.isDefined(that.onSubmit)) {
            that.onSubmit({ serviceInstance: response.data });
          }
        }, function (err) {
          if (err.status >= 400) {
            that.failedRegister = true;
            that.authenticating = false;
          }
        });
    },

    /**
     * @function reset
     * @memberOf app.view.credentialsForm.CredentialsFormController
     * @description Reset credentials form
     * @returns {void}
     */
    reset: function () {
      this._data = {};

      this.failedRegister = false;
      this.serverErrorOnRegister = false;
      this.serverFailedToRespond = false;

      this.authenticating = false;
      this.credentialsForm.$setPristine();
    }
  });

})();
