(function () {
  'use strict';

  angular
    .module('app.view.endpoints.dashboard')
    .factory('app.view.endpoints.dashboard.dashboardService', dashboardService);

  dashboardService.$inject = [
    '$q',
    'modelManager'
  ];

  /**
   * @namespace app.view.endpoints.dashboard.dashboardService
   * @memberof app.view.endpoints.dashboard
   * @name dashboardService
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @returns {object} Endpoints Dashboard Service
   */
  function dashboardService($q, modelManager) {
    var codeEngineVcs = [];
    return {
      endpoints: [],
      fetchedCodeEngineVcses: false,
      clear: clear,
      refreshCodeEngineVcses: refreshCodeEngineVcses,
      isCodeEngineVcs: isCodeEngineVcs
    };

    function clear() {
      this.endpoints.length = 0;
      this.fetchedCodeEngineVcses = false;
      codeEngineVcs.length = 0;
    }

    function refreshCodeEngineVcses() {
      var that = this;
      var promises = [];
      var hceModel = modelManager.retrieve('cloud-foundry.model.hce');

      var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
      _.forEach(userServiceInstanceModel.serviceInstances, function (ep) {
        if (ep.cnsi_type === 'hce' && ep.valid) {
          promises.push(hceModel.getVcses(ep.guid));
        }
      });

      return $q.all(promises).then(function (allCeVcses) {
        codeEngineVcs.length = 0;
        for (var i = 0; i < allCeVcses.length; i++) {
          var vcses = allCeVcses[i];
          Array.prototype.push.apply(codeEngineVcs, vcses);
        }
        that.fetchedCodeEngineVcses = true;
      });

    }

    function isCodeEngineVcs(ep) {
      return !!_.find(codeEngineVcs, function (vcs) {
        return vcs.browse_url === ep.vcs.browse_url && vcs.api_url === ep.vcs.api_url && vcs.label === ep.vcs.label;
      });
    }

  }

})();
