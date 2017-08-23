(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.services')
    .directive('serviceCard', serviceCard);

  /**
   * @memberof cloud-foundry.view.applications.application.services
   * @name serviceCard
   * @description The service card directive
   * @returns {object} The service card directive definition object
   */
  function serviceCard() {
    return {
      bindToController: {
        app: '=',
        cnsiGuid: '=',
        service: '=',
        addOnly: '=?'
      },
      controller: ServiceCardController,
      controllerAs: 'serviceCardCtrl',
      restrict: 'E',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/applications/application/services/service-card/service-card.html'
    };
  }

  /**
   * @memberof cloud-foundry.view.applications.application.services.serviceCard
   * @name ServiceCardController
   * @description Controller for service card directive
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {object} cfServiceInstanceService - the service instance service
   * @property {array} actions - the actions that can be performed from vm.service card
   */
  function ServiceCardController(
    $scope,
    cfServiceInstanceService
  ) {
    var vm = this;

    vm.detach = detach;

    vm.actions = [
      {
        name: 'app.app-info.app-tabs.services.card.actions.detach',
        execute: function () {
          detach(vm.service, function (result) {
            vm.service = result;
          });
        }
      }
    ];

    $scope.$watch(function () {
      return vm.service;
    }, function () {
      vm.cardData = {
        title: vm.service.entity.name
      };
    });

    /**
     * @function detach
     * @memberof cloud-foundry.view.applications.application.services.serviceCard.ServiceCardController
     * @description Detach service instance from app
     * @returns {undefined}
     */
    function detach(serviceInstance, cb) {
      var serviceBindings = serviceInstance.entity.service_bindings || [];
      if (serviceBindings.length === 1) {
        var serviceBinding = serviceBindings[0];
        return cfServiceInstanceService.unbindServiceFromApp(
          vm.cnsiGuid,
          vm.app.summary.guid,
          serviceBinding.metadata.guid,
          serviceInstance.entity.name,
          function () {
            serviceInstance.entity.service_bindings = [];
            cb(serviceInstance);
          }
        );
      }
      return cb(serviceInstance);
    }
  }

})();
