(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('clusterRegistration', clusterRegistration);

  clusterRegistration.$inject = ['app.basePath'];

  /**
   * @namespace app.view.clusterRegistration
   * @memberof app.view
   * @name clusterRegistration
   * @description A cluster-registration directive
   * @param {string} path - the application base path
   * @returns {object} The cluster-registration directive definition object
   */
  function clusterRegistration(path) {
    return {
      bindToController: {
        showOverlayRegistration: '=?'
      },
      controller: ClusterRegistrationController,
      controllerAs: 'clusterRegistrationCtrl',
      scope: {},
      templateUrl: path + 'view/cluster-registration/cluster-registration.html'
    };
  }

  ClusterRegistrationController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.ClusterRegistrationController
   * @memberof app.view
   * @name ClusterRegistrationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {boolean} overlay - flag to show or hide this component
   * @property {app.model.serviceInstance} serviceInstanceModel - the cluster instance model
   * @property {array} clusterInstances - the cluster instances available to user
   * @property {string} warningMsg - the warning message to show if expired
   */
  function ClusterRegistrationController(modelManager) {
    this.overlay = angular.isDefined(this.showOverlayRegistration);
    this.clusterInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    // this.userModel = modelManager.retrieve('app.model.user');
    this.clusterInstances = this.clusterInstanceModel.serviceInstances;
    this.warningMsg = gettext('Authentication failed, please try reconnect.');
    this.clusterInstanceModel.list();
  }

  angular.extend(ClusterRegistrationController.prototype, {
    /**
     * @function completeRegistration
     * @memberOf app.view.ClusterRegistrationController
     * @description Set cluster instances as registered
     * @returns {void}
     */
    completeRegistration: function () {
      var that = this;
      if (this.clusterInstanceModel.numValid > 0) {
        this.userModel.updateRegistered(true)
          .then(function () {
            that.showOverlayRegistration = false;
          });
      }
    },

    // /**
    //  * @function connect
    //  * @memberOf app.view.ClusterRegistrationController
    //  * @description Connect cluster instance for user
    //  * @param {object} clusterInstance - the cluster instance to connect
    //  * @returns {void}
    //  */
    // connect: function (clusterInstance) {
    //   var that = this;
    //   this.clusterInstanceModel.connect(clusterInstance.url)
    //     .then(function success(response) {
    //       angular.extend(clusterInstance, response.data);
    //       clusterInstance.valid = true;
    //       that.clusterInstanceModel.numValid += 1;
    //     });
    // },
    //
    // /**
    //  * @function disconnect
    //  * @memberOf app.view.ClusterRegistrationController
    //  * @description Disconnect cluster instance for user
    //  * @param {object} clusterInstance - the cluster instance to disconnect
    //  * @returns {void}
    //  */
    // disconnect: function (clusterInstance) {
    //   var that = this;
    //   this.clusterInstanceModel.disconnect(clusterInstance.id)
    //     .then(function success() {
    //       delete clusterInstance.account;
    //       delete clusterInstance.expires_at;
    //       delete clusterInstance.valid;
    //       that.clusterInstanceModel.numValid -= 1;
    //     });
    // },

    /**
     * @function isEmpty
     * @memberOf app.view.ClusterRegistrationController
     * @description Check to see if this controller has any clusterInstances
     * @returns {boolean} true if no clusters have been registered.
     */
    isEmpty: function () {
      return this.clusterInstances.length === 0;
    }
  });

})();
