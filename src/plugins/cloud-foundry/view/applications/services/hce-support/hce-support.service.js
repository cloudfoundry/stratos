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
  ];

  /**
   * @memberof cloud-foundry.view.applications.services
   * @name hceSupport
   * @description A service to help with HCE supported capabilities wihtin the UI
   * @returns {object} A service instance factory
   */
  function hceSupport() {

    // Supported VCS Types
    var vcsTypes = {
      GITHUB: {
        label: gettext('GitHub'),
        description: gettext('Connect to a repository hosted on GitHub.com that you own or have admin rights to.'),
        img: 'github_octocat.png'
      },
      GITHUB_ENTERPRISE: {
        label: gettext('Github Enterprise'),
        description: gettext('Connect to a repository hosted on an on-premise Github Enterprise instance that you own or have admin rights to.'),
        img: 'GitHub-Mark-120px-plus.png'
      }
    };

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
        if (!hceVcsInstances) {
          return [];
        } else {
          var supported = _.filter(hceVcsInstances, function (vcs) {
            return _.has(vcsTypes, vcs.vcs_type);
          });
          return _.map(supported, function (supportedVcs) {
            var vcs = _.clone(vcsTypes[supportedVcs.vcs_type]);
            vcs.browse_url = supportedVcs.browse_url;
            vcs.value = supportedVcs;
            return vcs;
          });
        }
      }
    };
  }

})();
