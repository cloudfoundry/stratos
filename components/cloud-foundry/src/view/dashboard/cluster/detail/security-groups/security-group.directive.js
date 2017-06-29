(function () {
  'use strict';

  angular
    .module('app.view.endpoints')
    .directive('securityGroupDetail', SecurityGroupDetail);

  function SecurityGroupDetail() {
    return {
      bindToController: {
        model: '='
      },
      controller: SecurityGroupDetailController,
      controllerAs: 'secGroupDetailCtrl',
      templateUrl: 'plugins/cloud-foundry/view/dashboard/cluster/detail/security-groups/security-group.html'
    };
  }

  /**
   * @name SecurityGroupDetailController
   * @constructor
   */
  function SecurityGroupDetailController() {}

})();
