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
    this.validTokens = {};
    this.vcsTokens = [];
  }

  angular.extend(VcsModel.prototype, {

    /**
     * @function listVcsClients
     * @memberof cloud-foundry.model.vcs.VcsModel
     * @description Get the list of valid VCS clients
     * @returns {promise} A promise object
     * @public
     */
    listVcsClients: function () {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .listVcsClients()
        .then(function (res) {

          // Filter out unsupported clients
          var supported = _.filter(res.data, function (vcs) {
            return VCS_TYPES[that._expandVcsType(vcs)];
          });

          that.vcsClients = supported;
          return supported;
        });
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

    _cacheValid: function (vcsToken) {
      var that = this;
      return function (res) {
        if (res.valid === true) {
          that.validTokens[vcsToken.token.guid] = true;
        } else {
          delete that.validTokens[vcsToken.token.guid];
        }
      };
    },

    _tokenFinder: function (tokenGuid) {
      return function (token) {
        return token.token.guid === tokenGuid;
      };
    },

    checkTokensValidity: function () {

      // Cleanup stale tokens
      for (var tokenGuid in this.validTokens) {
        if (!this.validTokens.hasOwnProperty(tokenGuid)) {
          continue;
        }
        if (!_.find(this.vcsTokens, this._tokenFinder(tokenGuid))) {
          delete this.validTokens[tokenGuid];
        }
      }

      var promises = [];
      for (var i = 0; i < this.vcsTokens.length; i++) {
        var vcsToken = this.vcsTokens[i];
        var check = this.checkVcsToken(vcsToken.token.guid).then(this._cacheValid(vcsToken));
        promises.push(check);
      }

      return this.$q.all(promises);
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
          var vcsInfo = VCS_TYPES[that._expandVcsType(vcsToken.vcs)];
          return vcsInfo && vcsInfo.supported && _.find(hceVcsInstances, function (hceVcs) {
            return hceVcs.browse_url === vcsToken.vcs.browse_url;
          });
        });

        that.supportedVcsInstances = _.map(supported, function (supportedVcs) {
          var vcs = _.clone(VCS_TYPES[that._expandVcsType(supportedVcs.vcs)]);

          var hceVcs = _.find(hceVcsInstances, function (hceVcs) {
            return hceVcs.browse_url === supportedVcs.vcs.browse_url;
          });

          vcs.label = supportedVcs.vcs.label;
          vcs.browse_url = supportedVcs.vcs.browse_url;
          vcs.value = supportedVcs;
          vcs.token_name = supportedVcs.token.name;
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
     * @description Returns more detailed VCS type name from VCS instance metadata
     * @param {object} vcs - VCS Instance Metadata
     * @returns {string} VCS type - expanded to split types like GitHub to GitHub and GitHub Enterprise
     * @private
     */
    _expandVcsType: function (vcs) {
      var expType = vcs.vcs_type;
      if (expType === 'github') {
        if (vcs.browse_url && vcs.browse_url.indexOf('https://github.com') === -1) {
          expType = 'GITHUB_ENTERPRISE';
        } else {
          expType = 'GITHUB';
        }
      }
      return expType;
    }
  });

})();
