(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.github
   * @memberOf cloud-foundry.model
   * @name github
   * @description Github model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerGithubModel);

  registerGithubModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    '$q',
    '$filter',
    'linkHeaderParser'
  ];

  function registerGithubModel(modelManager, apiManager, $q, $filter, linkHeaderParser) {
    modelManager.register('cloud-foundry.model.github', new GithubModel(apiManager, $q, $filter, linkHeaderParser));
  }

  /**
   * @memberof cloud-foundry.model.github
   * @name GithubModel
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {object} $q - the Angular $q service
   * @param {object} $filter - the Angular $filter service
   * @param {linkHeaderParser} linkHeaderParser - the linkHeaderParser service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {object} $q - the Angular $q service
   * @property {object} $filter - the Angular $filter service
   * @property {linkHeaderParser} linkHeaderParser - the linkHeaderParser service
   * @property {object} data - the Github data
   * @class
   */
  function GithubModel(apiManager, $q, $filter, linkHeaderParser) {
    this.apiManager = apiManager;
    this.$q = $q;
    this.$filter = $filter;
    this.linkHeaderParser = linkHeaderParser;
    this.repo = {
      filterTerm: null,
      page: 0,
      pageSize: 50,
      links: {}
    };
    this.data = {
      repoLinks: {},
      repos: [],
      filteredRepos: [],
      branches: [],
      commits: []
    };
  }

  angular.extend(GithubModel.prototype, {
    /**
     * @function isAuthenticated
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Whether the user has authenticated against Github
     * @returns {boolean} True if user has authenticated against Github
     */
    isAuthenticated: function () {
      return _.get(this.apiManager.retrieve('cloud-foundry.api.github'), 'authenticated');
    },

    /**
     * @function repos
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Get repos user owns or has admin rights to
     * @param {boolean} ignoreReset - flag to ignore reset of repos array
     * @returns {promise} A promise object
     * @public
     */
    repos: function (ignoreReset) {
      var that = this;
      if (!ignoreReset) {
        this._resetRepos();
      }

      return this.nextRepos()
        .then(function (response) {
          return response;
        }, function (err) {
          that.onReposError();
          return err;
        });
    },

    filterRepos: function (filterTerm) {
      this.repo.filterTerm = filterTerm || null;
      if (this.repo.filterTerm !== null) {
        this.data.filteredRepos = this.$filter('filter')(this.data.repos, this.repo.filterTerm);
        var filteredCnt = this.data.filteredRepos.length;
        var maxCnt = this.repo.page * this.repo.pageSize;
        if (filteredCnt < maxCnt) {
          return this.repos(true);
        }
      } else {
        this.data.filteredRepos.length = 0;
      }
    },

    /**
     * @function nextRepos
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Get next set of repos
     * @returns {promise} A promise object
     * @public
     */
    nextRepos: function () {
      var that = this;
      var deferred = this.$q.defer();
      var config = {per_page: 50};
      var numFetched = 0;
      var fetchedRepos = [];

      function next() {
        if (that.repo.links.next) {
          config.page = _.toInteger(that.repo.links.next.page);
        }

        that.apiManager.retrieve('cloud-foundry.api.github')
          .repos(config)
          .then(function (response) {
            // Parse out the Link header
            var linkHeaderText = response.headers('Link');
            var links = linkHeaderText ? that.linkHeaderParser.parse(linkHeaderText) : {};
            that.repo.links = links;

            var repos = response.data || [];
            var adminRepos = _.filter(repos, function (o) { return o.permissions.admin; });

            if (that.repo.filterTerm) {
              var filteredAdminRepos = that.$filter('filter')(adminRepos, that.repo.filterTerm);
              numFetched += filteredAdminRepos.length;
              [].push.apply(that.data.filteredRepos, filteredAdminRepos);
            } else {
              numFetched += adminRepos.length;
            }

            [].push.apply(fetchedRepos, adminRepos);
            [].push.apply(that.data.repos, adminRepos);

            if (numFetched < that.repo.pageSize && links.next) {
              next();   // eslint-disable-line callback-return
            } else {
              that.repo.page++;
              deferred.resolve({newRepos: fetchedRepos, repos: that.data.repos, links: that.repo.links, page: that.repo.page});
            }
          }, function (err) {
            deferred.reject(err);
          });
      }

      if (this.repo.page === 0 || this.repo.links.next) {
        next();   // eslint-disable-line callback-return
      } else {
        deferred.resolve({newRepos: fetchedRepos, repos: this.data.repos, links: this.repo.links, page: this.repo.page});
      }

      return deferred.promise;
    },

    /**
     * @function _resetRepos
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Reset repos
     * @returns {void}
     * @private
     */
    _resetRepos: function () {
      this.data.repos.length = 0;
      this.repo.page = 0;
      this.repo.links = {};
    },

    /**
     * @function branches
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Get branches for user's repository
     * @param {string} repo - the repo to get branches for
     * @returns {promise} A promise object
     * @public
     */
    branches: function (repo) {
      var that = this;
      var githubApi = this.apiManager.retrieve('cloud-foundry.api.github');
      return githubApi.branches(repo, {per_page: 100})
        .then(function (response) {
          that.onBranches(response);
        })
        .catch(function (err) {
          that.onBranchesError();
          throw err;
        });
    },

    /**
     * @function getBranch
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Get specified branch
     * @param {string} repo - the repo full name
     * @param {string} branch - the branch name
     * @returns {promise} A promise object
     * @public
     */
    getBranch: function (repo, branch) {
      var githubApi = this.apiManager.retrieve('cloud-foundry.api.github');
      return githubApi.getBranch(repo, branch);
    },

    /**
     * @function commits
     * @memberof cloud-foundry.model.github.GithubModel
     * @description Get commits for a branch
     * @param {string} repo - the repo to get commits for
     * @param {string} branch - the branch to get commits for (optional - default matches git's default branch)
     * @param {number} quantity - the number of commits to return (optional - defaults to github api's per_page)
     * @returns {promise} A promise object
     * @public
     */
    commits: function (repo, branch, quantity) {
      var that = this;
      var params = {};
      if (angular.isDefined(branch)) {
        params.sha = branch;
      }
      if (angular.isDefined(quantity)) {
        params.per_page = quantity;
      }
      var githubApi = this.apiManager.retrieve('cloud-foundry.api.github');
      return githubApi.commits(repo, params)
        .then(function (response) {
          that.onCommits(response);
        })
        .catch(function (err) {
          that.onCommitsError();
          throw err;
        });
    },

    /**
     * @function onBranches
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onBranches handler
     * @param {string} response - the JSON response from API call
     * @private
     */
    onBranches: function (response) {
      this.data.branches.length = 0;
      [].push.apply(this.data.branches, response.data || []);
    },

    /**
     * @function onCommits
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onCommits handler
     * @param {string} response - the JSON response from API call
     * @private
     */
    onCommits: function (response) {
      this.data.commits.length = 0;
      [].push.apply(this.data.commits, response.data || []);
    },

    /**
     * @function onReposError
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onReposError handler
     * @private
     */
    onReposError: function () {
      this._resetRepos();
    },

    /**
     * @function onBranchesError
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onBranchesError handler
     * @private
     */
    onBranchesError: function () {
      this.data.branches.length = 0;
    },

    /**
     * @function onCommitsError
     * @memberof cloud-foundry.model.github.GithubModel
     * @description onCommitsError handler
     * @private
     */
    onCommitsError: function () {
      this.data.commits.length = 0;
    }
  });

})();
