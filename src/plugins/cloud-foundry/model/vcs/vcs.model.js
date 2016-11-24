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
   * @property {Array} vcsClients - the list of VCS clients
   * @property {Array} supportedVcsInstances - the list of supported VCS instances
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
      // FIXME: this should always fetch
      if (forceFetch || this.vcsClients === null) {
        var that = this;
        return this.apiManager.retrieve('cloud-foundry.api.Vcs')
          .listVcsClients()
          .then(function (res) {
            that.vcsClients = res.data;
            return res.data;
          });
      }
      // Re-use cached data
      return this.$q.resolve(this.vcsClients);
    },

    registerVcsToken: function (vcsGuid, tokenName, tokenValue) {
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .registerVcsToken(vcsGuid, tokenName, tokenValue).then(function (res) {
          return res.data;
        });
    },

    checkVcsToken: function (tokenGuid) {
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .checkVcsToken(tokenGuid).then(function (res) {
          return res.data;
        });
    },

    renameVcsToken: function (tokenGuid, tokenName) {
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .renameVcsToken(tokenGuid, tokenName);
    },

    deleteVcsToken: function (tokenGuid) {
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .deleteVcsToken(tokenGuid);
    },

    listVcsTokens: function () {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .listVcsTokens().then(function (res) {
          that.vcsTokens = res.data;
          return res.data;
        });
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

      if (!hceVcsInstances || angular.isArray(hceVcsInstances) && _.isEmpty(hceVcsInstances)) {
        this.supportedVcsInstances = [];
        return this.$q.resolve(this.supportedVcsInstances);
      }

      var that = this;
      return this.listVcsTokens().then(function () {
        var supported = _.filter(that.vcsTokens, function (vcsToken) {
          var vcsInfo = VCS_TYPES[that._expandVcsType(vcsToken)];
          return vcsInfo && vcsInfo.supported && _.find(hceVcsInstances, function (hceVcs) {
            return hceVcs.browse_url === vcsToken.vcs.browse_url;
          });
        });

        that.supportedVcsInstances = _.map(supported, function (supportedVcs) {
          var vcs = _.clone(VCS_TYPES[that._expandVcsType(supportedVcs)]);

          var hceVcs = _.find(hceVcsInstances, function (hceVcs) {
            return hceVcs.browse_url === supportedVcs.vcs.browse_url;
          });

          vcs.label = supportedVcs.vcs.label;
          vcs.browse_url = supportedVcs.vcs.browse_url;
          vcs.value = supportedVcs;
          vcs.token_name = supportedVcs.name;
          vcs.token_guid = supportedVcs.guid;
          vcs.value.vcs_id = hceVcs.vcs_id;
          return vcs;
        });

        return that.supportedVcsInstances;
      }, function () {
        var msg = gettext('There was a problem retrieving VCS instances. Please try again.');
        return that.$q.reject(msg);
      });

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
      // FIXME: sort this out
      var expType = vcs.vcs.vcs_type;
      if (expType === 'github') {
        if (vcs.vcs.browse_url && vcs.vcs.browse_url.indexOf('https://github.com') === -1) {
          expType = 'GITHUB_ENTERPRISE';
        } else {
          expType = 'GITHUB';
        }
      }
      return expType;
    }
  });

})();
