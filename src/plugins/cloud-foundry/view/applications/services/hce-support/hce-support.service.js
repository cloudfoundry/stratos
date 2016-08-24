(function () {
  'use strict';

  /**
   * @name cloud-foundry.view.applications.services.hceSupport
   * @description Service to provide metadata on the HCE support within teh UI (VCS tyoes etc ...)
   **/
  angular
    .module('cloud-foundry.view.applications.services')
    .factory('cloud-foundry.view.applications.services.hceSupport', hceSupport);

  hceSupport.$inject = [
    '$q',
    'app.model.modelManager'
  ];

  /**
   * @memberof cloud-foundry.view.applications.services
   * @name hceSupport
   * @description A service to help with HCE supported capabilities wihtin the UI
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @returns {object} A service instance factory
   */
  function hceSupport($q, modelManager) {

    // Supported VCS Types
    var vcsTypes = {
      GITHUB: {
        description: gettext('Connect to a repository hosted on GitHub.com that you own or have admin rights to.'),
        img: 'github_octocat.png',
        supported: true
      },
      GITHUB_ENTERPRISE: {
        description: gettext('Connect to a repository hosted on your on-premise Github Enterprise instance that you own or have admin rights to.'),
        img: 'GitHub-Mark-120px-plus.png',
        supported: true
      }
    };

    /**
     * @function _expandVcsType
     * @memberof cloud-foundry.view.applications.services.hceSupport
     * @description Returns more detailed CS type name from VCS instance metadata
     * @param {object} vcs - VCS Instance Metadata
     * @returns {string} VCS type - expanded to split types like GitHub to GitHub and GitHub Enterprise
     * @private
     */
    function _expandVcsType(vcs) {
      var expType = vcs.vcs_type;
      if (expType === 'GITHUB' && vcs.browse_url && vcs.browse_url.indexOf('https://github.com') === -1) {
        expType = 'GITHUB_ENTERPRISE';
      }
      return expType;
    }

    return {

      /**
       * @function getSupportedVcsInstances
       * @memberof cloud-foundry.view.applications.services.hceSupport
       * @description Returns metadata about the supported VCS Instances, given a list of all of the available instances
       * @param {object} hceVcsInstances - HCE VCS instance metadata from HCE
       * @returns {object} Metadata array with details of the set of supported VCS Innstances that can be presented to the user
       * @public
       */
      getSupportedVcsInstances: function (hceVcsInstances) {
        var deferred = $q.defer();

        if (!hceVcsInstances || angular.isArray(hceVcsInstances) && _.isEmpty(hceVcsInstances)) {
          deferred.resolve([]);
        } else {
          var vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');
          vcsModel.listVcsClients().then(function (response) {
            var registeredVcsClients = response.data || [];
            var supported = _.filter(hceVcsInstances, function (vcs) {
              var vcsInfo = vcsTypes[_expandVcsType(vcs)];
              return vcsInfo && vcsInfo.supported && _.includes(registeredVcsClients, vcs.browse_url);
            });

            var supportedVcsInstances = _.map(supported, function (supportedVcs) {
              var vcs = _.clone(vcsTypes[_expandVcsType(supportedVcs)]);
              vcs.label = supportedVcs.label;
              vcs.browse_url = supportedVcs.browse_url;
              vcs.value = supportedVcs;
              return vcs;
            });

            deferred.resolve(supportedVcsInstances);
          }, function () {
            var msg = gettext('There was a problem retrieving VCS instances. Please try again.');
            deferred.reject(msg);
          });
        }

        return deferred.promise;
      }
    };
  }

})();
