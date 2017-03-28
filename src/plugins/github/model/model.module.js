(function () {
  'use strict';

  /**
   * @namespace github.model
   * @memberof github
   * @description Github model
   */
  angular
    .module('github.model', [])
    .run(registerGithubModel);

  registerGithubModel.$inject = [
    'modelManager',
    'apiManager',
    '$q',
    '$filter',
    'linkHeaderParser'
  ];

  function registerGithubModel(modelManager, apiManager, $q, $filter, linkHeaderParser) {
    modelManager.register('github.model', new GithubModel(apiManager, $q, $filter, linkHeaderParser));
  }

  /**
   * @namespace github.model.GithubModel
   * @memberof github.model
   * @name GithubModel
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {object} $q - the Angular $q service
   * @param {object} $filter - the Angular $filter service
   * @param {linkHeaderParser} linkHeaderParser - the linkHeaderParser service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {object} $q - the Angular $q service
   * @property {object} $filter - the Angular $filter service
   * @property {linkHeaderParser} linkHeaderParser - the linkHeaderParser service
   * @property {object} repo - the Github repo pagination configuration
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
     * @function repos
     * @memberof github.model.GithubModel
     * @description Get repos user owns or has admin rights to
     * @param {boolean} ignoreReset - flag to ignore reset of repos array
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
     */
    repos: function (ignoreReset, options) {
      var that = this;
      if (!ignoreReset) {
        this._resetRepos();
      }

      return this.nextRepos(options)
        .then(function (response) {
          return response;
        }, function (err) {
          that.onReposError();
          throw err;
        });
    },

    /**
     * @function filterRepos
     * @memberof github.model.GithubModel
     * @description Filter repos by term
     * @param {string} filterTerm - the term to filter repos by
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
     */
    filterRepos: function (filterTerm, options) {
      this.repo.filterTerm = filterTerm || null;
      if (this.repo.filterTerm !== null) {
        this.data.filteredRepos = this.$filter('filter')(this.data.repos, this.repo.filterTerm);
        var filteredCnt = this.data.filteredRepos.length;
        var maxCnt = this.repo.page * this.repo.pageSize;
        if (filteredCnt < maxCnt) {
          return this.repos(true, options);
        }
      } else {
        this.data.filteredRepos.length = 0;
      }
    },

    /**
     * @function nextRepos
     * @memberof github.model.GithubModel
     * @description Get next set of repos
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
     */
    nextRepos: function (options) {
      var that = this;
      var deferred = this.$q.defer();
      var config = {per_page: 50};
      var numFetched = 0;
      var fetchedRepos = [];

      function next() {
        if (that.repo.links.next) {
          config.page = _.toInteger(that.repo.links.next.page);
        }

        that.apiManager.retrieve('github.api')
          .repos(config, options)
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
     * @memberof github.model.GithubModel
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
     * @memberof github.model.GithubModel
     * @description Get branches for user's repository
     * @param {string} repo - the repo to get branches for
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
     */
    branches: function (repo, options) {
      this.data.branches.length = 0;

      var deferred = this.$q.defer();
      var that = this;
      var githubApi = this.apiManager.retrieve('github.api');
      var size = 100;

      _branches(1);

      function _branches(page) {
        githubApi.branches(repo, {page: page, per_page: size}, options)
          .then(function (response) {
            that.onBranches(response);
            if (response.data && response.data.length === size) {
              _branches(page + 1);
            } else {
              deferred.resolve();
            }
          })
          .catch(function (err) {
            that.onBranchesError();
            deferred.reject();
            throw err;
          });
      }

      return deferred.promise;
    },

    /**
     * @function getBranch
     * @memberof github.model.GithubModel
     * @description Get specified branch
     * @param {string} repo - the repo full name
     * @param {string} branch - the branch name
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
     */
    getBranch: function (repo, branch, options) {
      var githubApi = this.apiManager.retrieve('github.api');
      return githubApi.getBranch(repo, branch, {}, options);
    },

    /**
     * @function commits
     * @memberof github.model.GithubModel
     * @description Get commits for a branch
     * @param {string} repo - the repo to get commits for
     * @param {string} branch - the branch to get commits for (optional - default matches git's default branch)
     * @param {number} quantity - the number of commits to return (optional - defaults to github api's per_page)
     * @param {object} options - additional request options
     * @returns {promise} A promise object
     * @public
     */
    commits: function (repo, branch, quantity, options) {
      var that = this;
      var params = {};
      if (angular.isDefined(branch)) {
        params.sha = branch;
      }
      if (angular.isDefined(quantity)) {
        params.per_page = quantity;
      }
      var githubApi = this.apiManager.retrieve('github.api');
      return githubApi.commits(repo, params, options)
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
     * @memberof github.model.GithubModel
     * @description onBranches handler
     * @param {string} response - the JSON response from API call
     * @private
     */
    onBranches: function (response) {
      [].push.apply(this.data.branches, response.data || []);
    },

    /**
     * @function onCommits
     * @memberof github.model.GithubModel
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
     * @memberof github.model.GithubModel
     * @description onReposError handler
     * @private
     */
    onReposError: function () {
      this._resetRepos();
    },

    /**
     * @function onBranchesError
     * @memberof github.model.GithubModel
     * @description onBranchesError handler
     * @private
     */
    onBranchesError: function () {
    },

    /**
     * @function onCommitsError
     * @memberof github.model.GithubModel
     * @description onCommitsError handler
     * @private
     */
    onCommitsError: function () {
      this.data.commits.length = 0;
    }
  });

})();
