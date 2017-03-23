(function () {
  'use strict';

  // Supported VCS Types
  var SUPPORTED_VCS_TYPES = {
    GITHUB: {
      description: gettext('Connect to a repository hosted on GitHub.com that you own or have admin rights to.'),
      img: 'github_octocat.png',
      label: 'GitHub'
    },
    GITHUB_ENTERPRISE: {
      description: gettext('Connect to a repository hosted on your on-premise Github Enterprise instance that you own or have admin rights to.'),
      img: 'GitHub-Mark-120px-plus.png',
      label: 'GitHub Enterprise'
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
    'modelManager',
    'apiManager'
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
    this.invalidTokens = {};
    this.vcsTokens = [];
    this.vcsTokensFetched = false;
    this.vcsClientsFetched = false;
    this.lastValidityCheck = $q.resolve();
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
            return SUPPORTED_VCS_TYPES[that.expandVcsType(vcs)];
          });

          that.vcsClients = supported;
          that.vcsClientsFetched = true;
          return supported;
        });
    },

    listVcsTokens: function () {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .listVcsTokens().then(function (res) {
          that.vcsTokens = res.data;

          that._rebuildTokenMap();

          that.vcsTokensFetched = true;
          return that.vcsTokens;
        });
    },

    registerVcsToken: function (vcsGuid, tokenName, tokenValue) {
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .registerVcsToken(vcsGuid, tokenName, tokenValue).then(function (res) {
          return res.data;
        });
    },

    checkVcsToken: function (tokenGuid) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .checkVcsToken(tokenGuid).then(function (res) {
          that._cacheInvalid(tokenGuid, res.data.valid === false && res.data.invalid_reason);
          return res.data;
        }, function (res) {
          // Best effort to get data out of the error
          var reason = _.get(res, 'data.error');
          if (!reason) {
            reason = _.get(res, 'data');
          }
          if (!reason) {
            reason = 'Checking Token failed for an unknown reason';
          }
          that._cacheInvalid(tokenGuid, reason);
          // the result was processed, resolve the promise
        });
    },

    getToken: function (tokenGuid) {
      return _.find(this.vcsTokens, this._tokenFinder(tokenGuid));
    },

    getTokensForVcs: function (vcs) {
      return this.tokensByVcs[vcs.guid] || [];
    },

    checkTokensValidity: function (vcs) {
      var tokensToCheck, tokenGuid;

      // Cleanup cached invalidity of stale tokens
      for (tokenGuid in this.invalidTokens) {
        if (!this.invalidTokens.hasOwnProperty(tokenGuid)) {
          continue;
        }
        if (!this.getToken(tokenGuid)) {
          delete this.invalidTokens[tokenGuid];
        }
      }

      if (angular.isUndefined(vcs)) {
        tokensToCheck = this.vcsTokens;
      } else {
        tokensToCheck = this.getTokensForVcs(vcs);
      }

      // Also queue up any previous validity checks
      var promises = [this.lastValidityCheck];

      for (var i = 0; i < tokensToCheck.length; i++) {
        promises.push(this.checkVcsToken(tokensToCheck[i].token.guid));
      }

      this.lastValidityCheck = this.$q.all(promises);
      return this.lastValidityCheck;
    },

    renameVcsToken: function (tokenGuid, tokenName) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .renameVcsToken(tokenGuid, tokenName).then(function () {
          // Update cache after successful rename
          var cachedToken = that.getToken(tokenGuid);
          if (cachedToken) {
            cachedToken.token.name = tokenName;
          }
        });
    },

    unregisterVcs: function (vcsGuid) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .unregisterVcs(vcsGuid).then(function () {
          that.listVcsClients();
        });
    },

    deleteVcsToken: function (tokenGuid) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .deleteVcsToken(tokenGuid).then(function () {
          // Remove token from cache on successful delete
          var index = _.findIndex(that.vcsTokens, function (vcsToken) {
            return vcsToken.token.guid === tokenGuid;
          });
          if (index > -1) {
            that.vcsTokens.splice(index, 1);
            that._rebuildTokenMap();
          }
        });
    },

    getSupportedType: function (vcs) {
      return _.clone(SUPPORTED_VCS_TYPES[this.expandVcsType(vcs)]);
    },

    /**
     * @function _expandVcsType
     * @memberof cloud-foundry.model.vcs.VcsModel
     * @description Returns more detailed VCS type name from VCS instance metadata
     * @param {object} vcs - VCS Instance Metadata
     * @returns {string} VCS type - expanded to split types like GitHub to GitHub and GitHub Enterprise
     * @private
     */
    expandVcsType: function (vcs) {
      var expType = vcs.vcs_type;
      if (expType === 'github') {
        if (vcs.browse_url && vcs.browse_url.indexOf('https://github.com') === -1) {
          expType = 'GITHUB_ENTERPRISE';
        } else {
          expType = 'GITHUB';
        }
      }
      return expType;
    },

    getTypeLabel: function (vcs) {
      var vcsTypeDef = SUPPORTED_VCS_TYPES[this.expandVcsType(vcs)];
      if (!vcsTypeDef) {
        return 'Unknown Type';
      }
      return vcsTypeDef.label;
    },

    buildTokenOptions: function (vcs) {
      var that = this;
      var validTokens = _.filter(this.getTokensForVcs(vcs), function (vcsToken) {
        return !that.invalidTokens[vcsToken.token.guid];
      });

      vcs.tokenOptions = _.map(validTokens, function (vcsToken) {
        return {
          value: vcsToken.token.guid,
          label: vcsToken.token.name
        };
      });
      return validTokens;
    },

    _cacheInvalid: function (tokenGuid, valid) {
      this.invalidTokens[tokenGuid] = valid;
    },

    _tokenFinder: function (tokenGuid) {
      return function (token) {
        return token.token.guid === tokenGuid;
      };
    },

    _rebuildTokenMap: function () {
      // Build a map of tokens by VCS guid for quick access
      this.tokensByVcs = {};
      for (var i = 0; i < this.vcsTokens.length; i++) {
        var token = this.vcsTokens[i];
        this.tokensByVcs[token.vcs.guid] = this.tokensByVcs[token.vcs.guid] || [];
        this.tokensByVcs[token.vcs.guid].push(token);
      }
    }

  });

})();
