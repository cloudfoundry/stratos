(function () {
  'use strict';

  // Supported VCS Types
  var VCS_TYPES = {
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
   * @namespace cloud-foundry.model.vcs
   * @memberOf cloud-foundry.model
   * @name vcs
   * @description VCS model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerVcsModel);

  registerVcsModel.$inject = [
    '$q',
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerVcsModel($q, modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.vcs', new VcsModel($q, apiManager));
  }

  /**
   * @memberof cloud-foundry.model.vcs
   * @name VcsModel
   * @param {object} $q - the Angular $q service
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {object} $q - the Angular $q service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {array} vcsClients - the list of VCS clients
   * @property {array} supportedVcsInstances - the list of supported VCS instances
   * @class
   */
  function VcsModel($q, apiManager) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.vcsClients = null;
    this.supportedVcsInstances = [];
  }

  angular.extend(VcsModel.prototype, {
    /**
     * @function listVcsClients
     * @memberof cloud-foundry.model.vcs.VcsModel
     * @description Get the list of valid VCS clients
     * @param {boolean} forceFetch - force fetch VCS clients
     * @returns {promise} A promise object
     * @public
     */
    listVcsClients: function (forceFetch) {
      if (forceFetch || this.vcsClients === null) {
        var that = this;
        return this.apiManager.retrieve('cloud-foundry.api.Vcs')
          .listVcsClients()
          .then(function (response) {
            that.vcsClients = response.data;
            return response;
          });
      } else {
        var deferred = this.$q.defer();
        deferred.resolve({data: this.vcsClients});
        return deferred.promise;
      }
    },

    /**
     * @function getSupportedVcsInstances
     * @memberof cloud-foundry.model.vcs.VcsModel
     * @description Returns metadata about the supported VCS Instances, given a list of all of the available instances
     * @param {object} hceVcsInstances - HCE VCS instance metadata from HCE
     * @returns {object} Metadata array with details of the set of supported VCS instances that can be presented to the user
     * @public
     */
    getSupportedVcsInstances: function (hceVcsInstances) {
      var deferred = this.$q.defer();

      if (!hceVcsInstances || angular.isArray(hceVcsInstances) && _.isEmpty(hceVcsInstances)) {
        this.supportedVcsInstances = [];
        deferred.resolve(this.supportedVcsInstances);
      } else {
        var that = this;
        this.listVcsClients().then(function () {
          var supported = _.filter(hceVcsInstances, function (vcs) {
            var vcsInfo = VCS_TYPES[that._expandVcsType(vcs)];
            return vcsInfo && vcsInfo.supported && _.includes(that.vcsClients, vcs.browse_url);
          });

          that.supportedVcsInstances = _.map(supported, function (supportedVcs) {
            var vcs = _.clone(VCS_TYPES[that._expandVcsType(supportedVcs)]);
            vcs.label = supportedVcs.label;
            vcs.browse_url = supportedVcs.browse_url;
            vcs.value = supportedVcs;
            return vcs;
          });

          deferred.resolve(that.supportedVcsInstances);
        }, function () {
          var msg = gettext('There was a problem retrieving VCS instances. Please try again.');
          deferred.reject(msg);
        });
      }

      return deferred.promise;
    },

    /**
     * @function _expandVcsType
     * @memberof cloud-foundry.model.vcs.VcsModel
     * @description Returns more detailed CS type name from VCS instance metadata
     * @param {object} vcs - VCS Instance Metadata
     * @returns {string} VCS type - expanded to split types like GitHub to GitHub and GitHub Enterprise
     * @private
     */
    _expandVcsType: function (vcs) {
      var expType = vcs.vcs_type;
      if (expType === 'GITHUB' && vcs.browse_url && vcs.browse_url.indexOf('https://github.com') === -1) {
        expType = 'GITHUB_ENTERPRISE';
      }
      return expType;
    }
  });

})();
