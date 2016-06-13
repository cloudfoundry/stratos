(function() {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-logs')
    .controller('triggerBuildsDetailViewController', TriggerBuildsDetailViewController);

  TriggerBuildsDetailViewController.$inject = [
    '$scope',
    '$timeout',
    '$uibModalInstance',
    'context',
    'content',
    'app.model.modelManager'
  ];

  /**
   * @name TriggerBuildsDetailViewController
   * @constructor
   * @param {object} $scope - the angular scope object for the controller
   * @param {object} $timeout - the angular timeout service
   * @param {object} $uibModalInstance - the modal object which is associated with this controller
   * @param {object} context - parameter object passed in to DetailView
   * @param {object} content - configuration object passed in to DetailView
   * @param {app.model.modelManager} modelManager - the Model management service
   */
  function TriggerBuildsDetailViewController($scope, $timeout, $uibModalInstance, context, content, modelManager) {
    var that = this;
    that.context = context;
    that.content = content;
    that.hasToken = false;
    that.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    that.githubModel = modelManager.retrieve('cloud-foundry.model.github');
    that.$uibModalInstance = $uibModalInstance;
    that.$timeout = $timeout;
    that.$scope = $scope;

    // Always initially attempt to fetch commits associated with this projects repo/branch
    that.fetchCommits();

    $scope.$watch(function() {
      return that.githubModel.getToken();
    }, function(newValue, oldValue) {
        that.hasToken = newValue;
        that.addMock();
        if (!oldValue && newValue) {
          that.fetchCommits();
          // that.$timeout(function() {
          //   that.$scope.$apply();
          // }, 500);
        }
    });
  }

  angular.extend(TriggerBuildsDetailViewController.prototype, {

    build: function() {
      var that = this;
      that.hceModel.triggerPipelineExecution(that.context.guid, that.context.project.id, that.selectedCommit.sha)
        .then(function() {
          // Success, cause successful promise
          that.$uibModalInstance.close();
        })
        .catch(function(err) {
          // Failure, cause rejected promise
          that.$uibModalInstance.dismiss(err);
        });
    },

    fetchCommits: function() {
      var that = this;

      if (!this.hasToken) {
        return;
      }

      this.githubModel.commits(this.context.project.repo.full_name, this.context.project.repo.branch, 5)
        .then(function() {
          that.selectedCommit = _.get(that, 'githubModel.data.commits.length') ? that.githubModel.data.commits[0] : null;
        });
    },

    addMock: function() {
      var that = this;
      this.hasToken = true;
      this.githubModel.data.commits = [{
        "sha": "7bf036deaa8ac4a35dd737f19dee02db49aab104",
        "commit": {
          "author": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-10T13:05:44Z"
          },
          "committer": {"name": "GitHub", "email": "noreply@github.com", "date": "2016-06-10T13:05:44Z"},
          "message": "Merge pull request #1 from irfanhabib/patch-1\n\nUpdate manifest.yml",
          "tree": {
            "sha": "4f1116265a9ac6a4c25f1e1c0490600c9c318094",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/4f1116265a9ac6a4c25f1e1c0490600c9c318094"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/7bf036deaa8ac4a35dd737f19dee02db49aab104",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/7bf036deaa8ac4a35dd737f19dee02db49aab104",
        "html_url": "https://github.com/richard-cox/node-env/commit/7bf036deaa8ac4a35dd737f19dee02db49aab104",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/7bf036deaa8ac4a35dd737f19dee02db49aab104/comments",
        "author": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "web-flow",
          "id": 19864447,
          "avatar_url": "https://avatars.githubusercontent.com/u/19864447?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/web-flow",
          "html_url": "https://github.com/web-flow",
          "followers_url": "https://api.github.com/users/web-flow/followers",
          "following_url": "https://api.github.com/users/web-flow/following{/other_user}",
          "gists_url": "https://api.github.com/users/web-flow/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/web-flow/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/web-flow/subscriptions",
          "organizations_url": "https://api.github.com/users/web-flow/orgs",
          "repos_url": "https://api.github.com/users/web-flow/repos",
          "events_url": "https://api.github.com/users/web-flow/events{/privacy}",
          "received_events_url": "https://api.github.com/users/web-flow/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "44f605c62671275eca471e505a65a6e48e6c5fb7",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/44f605c62671275eca471e505a65a6e48e6c5fb7",
          "html_url": "https://github.com/richard-cox/node-env/commit/44f605c62671275eca471e505a65a6e48e6c5fb7"
        }, {
          "sha": "ccc094d7e901bb3a3bb7b478b9eef92cc5433884",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/ccc094d7e901bb3a3bb7b478b9eef92cc5433884",
          "html_url": "https://github.com/richard-cox/node-env/commit/ccc094d7e901bb3a3bb7b478b9eef92cc5433884"
        }]
      }, {
        "sha": "ccc094d7e901bb3a3bb7b478b9eef92cc5433884",
        "commit": {
          "author": {"name": "Irfan Habib", "email": "irfan.habib@hpe.com", "date": "2016-06-10T13:05:10Z"},
          "committer": {"name": "GitHub", "email": "noreply@github.com", "date": "2016-06-10T13:05:10Z"},
          "message": "Update manifest.yml",
          "tree": {
            "sha": "4f1116265a9ac6a4c25f1e1c0490600c9c318094",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/4f1116265a9ac6a4c25f1e1c0490600c9c318094"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/ccc094d7e901bb3a3bb7b478b9eef92cc5433884",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/ccc094d7e901bb3a3bb7b478b9eef92cc5433884",
        "html_url": "https://github.com/richard-cox/node-env/commit/ccc094d7e901bb3a3bb7b478b9eef92cc5433884",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/ccc094d7e901bb3a3bb7b478b9eef92cc5433884/comments",
        "author": {
          "login": "irfanhabib",
          "id": 18684569,
          "avatar_url": "https://avatars.githubusercontent.com/u/18684569?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/irfanhabib",
          "html_url": "https://github.com/irfanhabib",
          "followers_url": "https://api.github.com/users/irfanhabib/followers",
          "following_url": "https://api.github.com/users/irfanhabib/following{/other_user}",
          "gists_url": "https://api.github.com/users/irfanhabib/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/irfanhabib/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/irfanhabib/subscriptions",
          "organizations_url": "https://api.github.com/users/irfanhabib/orgs",
          "repos_url": "https://api.github.com/users/irfanhabib/repos",
          "events_url": "https://api.github.com/users/irfanhabib/events{/privacy}",
          "received_events_url": "https://api.github.com/users/irfanhabib/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "web-flow",
          "id": 19864447,
          "avatar_url": "https://avatars.githubusercontent.com/u/19864447?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/web-flow",
          "html_url": "https://github.com/web-flow",
          "followers_url": "https://api.github.com/users/web-flow/followers",
          "following_url": "https://api.github.com/users/web-flow/following{/other_user}",
          "gists_url": "https://api.github.com/users/web-flow/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/web-flow/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/web-flow/subscriptions",
          "organizations_url": "https://api.github.com/users/web-flow/orgs",
          "repos_url": "https://api.github.com/users/web-flow/repos",
          "events_url": "https://api.github.com/users/web-flow/events{/privacy}",
          "received_events_url": "https://api.github.com/users/web-flow/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "44f605c62671275eca471e505a65a6e48e6c5fb7",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/44f605c62671275eca471e505a65a6e48e6c5fb7",
          "html_url": "https://github.com/richard-cox/node-env/commit/44f605c62671275eca471e505a65a6e48e6c5fb7"
        }]
      }, {
        "sha": "44f605c62671275eca471e505a65a6e48e6c5fb7",
        "commit": {
          "author": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-10T12:09:17Z"
          },
          "committer": {"name": "GitHub", "email": "noreply@github.com", "date": "2016-06-10T12:09:17Z"},
          "message": "updated manifest app name\n\nextended description",
          "tree": {
            "sha": "76a7f8998a9e162b57f8ade93713a7e502f7ce4b",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/76a7f8998a9e162b57f8ade93713a7e502f7ce4b"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/44f605c62671275eca471e505a65a6e48e6c5fb7",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/44f605c62671275eca471e505a65a6e48e6c5fb7",
        "html_url": "https://github.com/richard-cox/node-env/commit/44f605c62671275eca471e505a65a6e48e6c5fb7",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/44f605c62671275eca471e505a65a6e48e6c5fb7/comments",
        "author": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "web-flow",
          "id": 19864447,
          "avatar_url": "https://avatars.githubusercontent.com/u/19864447?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/web-flow",
          "html_url": "https://github.com/web-flow",
          "followers_url": "https://api.github.com/users/web-flow/followers",
          "following_url": "https://api.github.com/users/web-flow/following{/other_user}",
          "gists_url": "https://api.github.com/users/web-flow/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/web-flow/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/web-flow/subscriptions",
          "organizations_url": "https://api.github.com/users/web-flow/orgs",
          "repos_url": "https://api.github.com/users/web-flow/repos",
          "events_url": "https://api.github.com/users/web-flow/events{/privacy}",
          "received_events_url": "https://api.github.com/users/web-flow/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "fe2e8b4f33ccfecf77f8ffbf2cf426a1434acb36",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/fe2e8b4f33ccfecf77f8ffbf2cf426a1434acb36",
          "html_url": "https://github.com/richard-cox/node-env/commit/fe2e8b4f33ccfecf77f8ffbf2cf426a1434acb36"
        }]
      }, {
        "sha": "fe2e8b4f33ccfecf77f8ffbf2cf426a1434acb36",
        "commit": {
          "author": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-09T16:06:48Z"
          },
          "committer": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-09T16:06:48Z"
          },
          "message": "Update manifest.yml",
          "tree": {
            "sha": "a55689eaf50daa857a26e3438a252921240f231e",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/a55689eaf50daa857a26e3438a252921240f231e"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/fe2e8b4f33ccfecf77f8ffbf2cf426a1434acb36",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/fe2e8b4f33ccfecf77f8ffbf2cf426a1434acb36",
        "html_url": "https://github.com/richard-cox/node-env/commit/fe2e8b4f33ccfecf77f8ffbf2cf426a1434acb36",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/fe2e8b4f33ccfecf77f8ffbf2cf426a1434acb36/comments",
        "author": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "a5373d01f945c22b6a2a76def9c4f7baeddced34",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/a5373d01f945c22b6a2a76def9c4f7baeddced34",
          "html_url": "https://github.com/richard-cox/node-env/commit/a5373d01f945c22b6a2a76def9c4f7baeddced34"
        }]
      }, {
        "sha": "a5373d01f945c22b6a2a76def9c4f7baeddced34",
        "commit": {
          "author": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-09T12:14:33Z"
          },
          "committer": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-09T12:14:33Z"
          },
          "message": "Update manifest.yml",
          "tree": {
            "sha": "8e8a68ca4aaa11fffb550b773363721002c074a9",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/8e8a68ca4aaa11fffb550b773363721002c074a9"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/a5373d01f945c22b6a2a76def9c4f7baeddced34",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/a5373d01f945c22b6a2a76def9c4f7baeddced34",
        "html_url": "https://github.com/richard-cox/node-env/commit/a5373d01f945c22b6a2a76def9c4f7baeddced34",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/a5373d01f945c22b6a2a76def9c4f7baeddced34/comments",
        "author": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "fa40f70a6e3d130548d192aa3828d516c1f6b164",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/fa40f70a6e3d130548d192aa3828d516c1f6b164",
          "html_url": "https://github.com/richard-cox/node-env/commit/fa40f70a6e3d130548d192aa3828d516c1f6b164"
        }]
      }, {
        "sha": "fa40f70a6e3d130548d192aa3828d516c1f6b164",
        "commit": {
          "author": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-09T12:14:24Z"
          },
          "committer": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-09T12:14:24Z"
          },
          "message": "Update manifest.yml",
          "tree": {
            "sha": "9c1c6d82c661d98dc502ae847ba7ad25014a592a",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/9c1c6d82c661d98dc502ae847ba7ad25014a592a"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/fa40f70a6e3d130548d192aa3828d516c1f6b164",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/fa40f70a6e3d130548d192aa3828d516c1f6b164",
        "html_url": "https://github.com/richard-cox/node-env/commit/fa40f70a6e3d130548d192aa3828d516c1f6b164",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/fa40f70a6e3d130548d192aa3828d516c1f6b164/comments",
        "author": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "94869292f97ff6f2fd8f2d07b49c0c3be4765d78",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/94869292f97ff6f2fd8f2d07b49c0c3be4765d78",
          "html_url": "https://github.com/richard-cox/node-env/commit/94869292f97ff6f2fd8f2d07b49c0c3be4765d78"
        }]
      }, {
        "sha": "94869292f97ff6f2fd8f2d07b49c0c3be4765d78",
        "commit": {
          "author": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-09T10:54:15Z"
          },
          "committer": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-09T10:54:15Z"
          },
          "message": "Update manifest.yml",
          "tree": {
            "sha": "a6ed24b2439adecec86cab7c83037a14705b2dab",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/a6ed24b2439adecec86cab7c83037a14705b2dab"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/94869292f97ff6f2fd8f2d07b49c0c3be4765d78",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/94869292f97ff6f2fd8f2d07b49c0c3be4765d78",
        "html_url": "https://github.com/richard-cox/node-env/commit/94869292f97ff6f2fd8f2d07b49c0c3be4765d78",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/94869292f97ff6f2fd8f2d07b49c0c3be4765d78/comments",
        "author": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "9d3b65b12c3dac703342bdb15ea2f1eb635ae927",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/9d3b65b12c3dac703342bdb15ea2f1eb635ae927",
          "html_url": "https://github.com/richard-cox/node-env/commit/9d3b65b12c3dac703342bdb15ea2f1eb635ae927"
        }]
      }, {
        "sha": "9d3b65b12c3dac703342bdb15ea2f1eb635ae927",
        "commit": {
          "author": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-07T10:43:47Z"
          },
          "committer": {
            "name": "Richard",
            "email": "richard-cox@users.noreply.github.com",
            "date": "2016-06-07T10:43:47Z"
          },
          "message": "Update manifest.yml",
          "tree": {
            "sha": "b0d709619b001f557d3c07039b53b90a46f02b48",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/b0d709619b001f557d3c07039b53b90a46f02b48"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/9d3b65b12c3dac703342bdb15ea2f1eb635ae927",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/9d3b65b12c3dac703342bdb15ea2f1eb635ae927",
        "html_url": "https://github.com/richard-cox/node-env/commit/9d3b65b12c3dac703342bdb15ea2f1eb635ae927",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/9d3b65b12c3dac703342bdb15ea2f1eb635ae927/comments",
        "author": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "richard-cox",
          "id": 18697775,
          "avatar_url": "https://avatars.githubusercontent.com/u/18697775?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/richard-cox",
          "html_url": "https://github.com/richard-cox",
          "followers_url": "https://api.github.com/users/richard-cox/followers",
          "following_url": "https://api.github.com/users/richard-cox/following{/other_user}",
          "gists_url": "https://api.github.com/users/richard-cox/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/richard-cox/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/richard-cox/subscriptions",
          "organizations_url": "https://api.github.com/users/richard-cox/orgs",
          "repos_url": "https://api.github.com/users/richard-cox/repos",
          "events_url": "https://api.github.com/users/richard-cox/events{/privacy}",
          "received_events_url": "https://api.github.com/users/richard-cox/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "e0d1e03fab0d55ba1103bbe3a984c7cf036b42c6",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/e0d1e03fab0d55ba1103bbe3a984c7cf036b42c6",
          "html_url": "https://github.com/richard-cox/node-env/commit/e0d1e03fab0d55ba1103bbe3a984c7cf036b42c6"
        }]
      }, {
        "sha": "e0d1e03fab0d55ba1103bbe3a984c7cf036b42c6",
        "commit": {
          "author": {
            "name": "Adam Sheldon",
            "email": "adam.sheldon@hotmail.com",
            "date": "2015-10-17T02:17:20Z"
          },
          "committer": {"name": "Adam Sheldon", "email": "adam.sheldon@hotmail.com", "date": "2015-10-17T02:17:20Z"},
          "message": "Update robots.txt",
          "tree": {
            "sha": "6941bcf8a87ea293cd1941ac2443ebc12070af08",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/6941bcf8a87ea293cd1941ac2443ebc12070af08"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/e0d1e03fab0d55ba1103bbe3a984c7cf036b42c6",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/e0d1e03fab0d55ba1103bbe3a984c7cf036b42c6",
        "html_url": "https://github.com/richard-cox/node-env/commit/e0d1e03fab0d55ba1103bbe3a984c7cf036b42c6",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/e0d1e03fab0d55ba1103bbe3a984c7cf036b42c6/comments",
        "author": {
          "login": "flacnut",
          "id": 2524397,
          "avatar_url": "https://avatars.githubusercontent.com/u/2524397?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/flacnut",
          "html_url": "https://github.com/flacnut",
          "followers_url": "https://api.github.com/users/flacnut/followers",
          "following_url": "https://api.github.com/users/flacnut/following{/other_user}",
          "gists_url": "https://api.github.com/users/flacnut/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/flacnut/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/flacnut/subscriptions",
          "organizations_url": "https://api.github.com/users/flacnut/orgs",
          "repos_url": "https://api.github.com/users/flacnut/repos",
          "events_url": "https://api.github.com/users/flacnut/events{/privacy}",
          "received_events_url": "https://api.github.com/users/flacnut/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "flacnut",
          "id": 2524397,
          "avatar_url": "https://avatars.githubusercontent.com/u/2524397?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/flacnut",
          "html_url": "https://github.com/flacnut",
          "followers_url": "https://api.github.com/users/flacnut/followers",
          "following_url": "https://api.github.com/users/flacnut/following{/other_user}",
          "gists_url": "https://api.github.com/users/flacnut/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/flacnut/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/flacnut/subscriptions",
          "organizations_url": "https://api.github.com/users/flacnut/orgs",
          "repos_url": "https://api.github.com/users/flacnut/repos",
          "events_url": "https://api.github.com/users/flacnut/events{/privacy}",
          "received_events_url": "https://api.github.com/users/flacnut/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "d49a268f1c71b67070abb706896e21f6335acc32",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/d49a268f1c71b67070abb706896e21f6335acc32",
          "html_url": "https://github.com/richard-cox/node-env/commit/d49a268f1c71b67070abb706896e21f6335acc32"
        }]
      }, {
        "sha": "d49a268f1c71b67070abb706896e21f6335acc32",
        "commit": {
          "author": {
            "name": "Adam Sheldon",
            "email": "adam.sheldon@hotmail.com",
            "date": "2015-10-16T00:51:31Z"
          },
          "committer": {"name": "Adam Sheldon", "email": "adam.sheldon@hotmail.com", "date": "2015-10-16T00:51:31Z"},
          "message": "new checkin",
          "tree": {
            "sha": "18289fe3137330dc8615dedf9405db987541faaa",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/18289fe3137330dc8615dedf9405db987541faaa"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/d49a268f1c71b67070abb706896e21f6335acc32",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/d49a268f1c71b67070abb706896e21f6335acc32",
        "html_url": "https://github.com/richard-cox/node-env/commit/d49a268f1c71b67070abb706896e21f6335acc32",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/d49a268f1c71b67070abb706896e21f6335acc32/comments",
        "author": {
          "login": "flacnut",
          "id": 2524397,
          "avatar_url": "https://avatars.githubusercontent.com/u/2524397?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/flacnut",
          "html_url": "https://github.com/flacnut",
          "followers_url": "https://api.github.com/users/flacnut/followers",
          "following_url": "https://api.github.com/users/flacnut/following{/other_user}",
          "gists_url": "https://api.github.com/users/flacnut/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/flacnut/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/flacnut/subscriptions",
          "organizations_url": "https://api.github.com/users/flacnut/orgs",
          "repos_url": "https://api.github.com/users/flacnut/repos",
          "events_url": "https://api.github.com/users/flacnut/events{/privacy}",
          "received_events_url": "https://api.github.com/users/flacnut/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "flacnut",
          "id": 2524397,
          "avatar_url": "https://avatars.githubusercontent.com/u/2524397?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/flacnut",
          "html_url": "https://github.com/flacnut",
          "followers_url": "https://api.github.com/users/flacnut/followers",
          "following_url": "https://api.github.com/users/flacnut/following{/other_user}",
          "gists_url": "https://api.github.com/users/flacnut/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/flacnut/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/flacnut/subscriptions",
          "organizations_url": "https://api.github.com/users/flacnut/orgs",
          "repos_url": "https://api.github.com/users/flacnut/repos",
          "events_url": "https://api.github.com/users/flacnut/events{/privacy}",
          "received_events_url": "https://api.github.com/users/flacnut/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "6427f4997dfd33f454dcb342aa32f531fac7abff",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/6427f4997dfd33f454dcb342aa32f531fac7abff",
          "html_url": "https://github.com/richard-cox/node-env/commit/6427f4997dfd33f454dcb342aa32f531fac7abff"
        }]
      }, {
        "sha": "6427f4997dfd33f454dcb342aa32f531fac7abff",
        "commit": {
          "author": {
            "name": "Adam Sheldon",
            "email": "adam.sheldon@hotmail.com",
            "date": "2015-10-12T22:01:38Z"
          },
          "committer": {"name": "Adam Sheldon", "email": "adam.sheldon@hotmail.com", "date": "2015-10-12T22:01:38Z"},
          "message": "Merge pull request #4 from ogazitt/master\n\npull omris changes",
          "tree": {
            "sha": "d778f0990d08672853f9393a8917d5d093ab6b56",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/d778f0990d08672853f9393a8917d5d093ab6b56"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/6427f4997dfd33f454dcb342aa32f531fac7abff",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/6427f4997dfd33f454dcb342aa32f531fac7abff",
        "html_url": "https://github.com/richard-cox/node-env/commit/6427f4997dfd33f454dcb342aa32f531fac7abff",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/6427f4997dfd33f454dcb342aa32f531fac7abff/comments",
        "author": {
          "login": "flacnut",
          "id": 2524397,
          "avatar_url": "https://avatars.githubusercontent.com/u/2524397?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/flacnut",
          "html_url": "https://github.com/flacnut",
          "followers_url": "https://api.github.com/users/flacnut/followers",
          "following_url": "https://api.github.com/users/flacnut/following{/other_user}",
          "gists_url": "https://api.github.com/users/flacnut/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/flacnut/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/flacnut/subscriptions",
          "organizations_url": "https://api.github.com/users/flacnut/orgs",
          "repos_url": "https://api.github.com/users/flacnut/repos",
          "events_url": "https://api.github.com/users/flacnut/events{/privacy}",
          "received_events_url": "https://api.github.com/users/flacnut/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "flacnut",
          "id": 2524397,
          "avatar_url": "https://avatars.githubusercontent.com/u/2524397?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/flacnut",
          "html_url": "https://github.com/flacnut",
          "followers_url": "https://api.github.com/users/flacnut/followers",
          "following_url": "https://api.github.com/users/flacnut/following{/other_user}",
          "gists_url": "https://api.github.com/users/flacnut/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/flacnut/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/flacnut/subscriptions",
          "organizations_url": "https://api.github.com/users/flacnut/orgs",
          "repos_url": "https://api.github.com/users/flacnut/repos",
          "events_url": "https://api.github.com/users/flacnut/events{/privacy}",
          "received_events_url": "https://api.github.com/users/flacnut/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "812f4f33ecbb20e7203651898db40405538ab2df",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/812f4f33ecbb20e7203651898db40405538ab2df",
          "html_url": "https://github.com/richard-cox/node-env/commit/812f4f33ecbb20e7203651898db40405538ab2df"
        }, {
          "sha": "e7506ede248794ae4b7a0074c845c22fc1462329",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/e7506ede248794ae4b7a0074c845c22fc1462329",
          "html_url": "https://github.com/richard-cox/node-env/commit/e7506ede248794ae4b7a0074c845c22fc1462329"
        }]
      }, {
        "sha": "e7506ede248794ae4b7a0074c845c22fc1462329",
        "commit": {
          "author": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-19T05:07:40Z"},
          "committer": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-19T05:07:40Z"},
          "message": "mark change",
          "tree": {
            "sha": "83533bea83723b79d07f2f49a24d27cc35a99530",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/83533bea83723b79d07f2f49a24d27cc35a99530"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/e7506ede248794ae4b7a0074c845c22fc1462329",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/e7506ede248794ae4b7a0074c845c22fc1462329",
        "html_url": "https://github.com/richard-cox/node-env/commit/e7506ede248794ae4b7a0074c845c22fc1462329",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/e7506ede248794ae4b7a0074c845c22fc1462329/comments",
        "author": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "36536057777d9b5e05b3c442ebf8eaffe56ff09e",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/36536057777d9b5e05b3c442ebf8eaffe56ff09e",
          "html_url": "https://github.com/richard-cox/node-env/commit/36536057777d9b5e05b3c442ebf8eaffe56ff09e"
        }]
      }, {
        "sha": "36536057777d9b5e05b3c442ebf8eaffe56ff09e",
        "commit": {
          "author": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-17T21:02:03Z"},
          "committer": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-17T21:02:03Z"},
          "message": "lance change",
          "tree": {
            "sha": "a97b29cabf464328af3db81d2f1bee1e1b073924",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/a97b29cabf464328af3db81d2f1bee1e1b073924"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/36536057777d9b5e05b3c442ebf8eaffe56ff09e",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/36536057777d9b5e05b3c442ebf8eaffe56ff09e",
        "html_url": "https://github.com/richard-cox/node-env/commit/36536057777d9b5e05b3c442ebf8eaffe56ff09e",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/36536057777d9b5e05b3c442ebf8eaffe56ff09e/comments",
        "author": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "d08f7d06f204e044a31d804d0e3b657237baa01c",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/d08f7d06f204e044a31d804d0e3b657237baa01c",
          "html_url": "https://github.com/richard-cox/node-env/commit/d08f7d06f204e044a31d804d0e3b657237baa01c"
        }]
      }, {
        "sha": "d08f7d06f204e044a31d804d0e3b657237baa01c",
        "commit": {
          "author": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-13T20:03:55Z"},
          "committer": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-13T20:03:55Z"},
          "message": "changed text to Robert",
          "tree": {
            "sha": "59d53bb59b79cd2d003b433d1562b8dc592939cf",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/59d53bb59b79cd2d003b433d1562b8dc592939cf"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/d08f7d06f204e044a31d804d0e3b657237baa01c",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/d08f7d06f204e044a31d804d0e3b657237baa01c",
        "html_url": "https://github.com/richard-cox/node-env/commit/d08f7d06f204e044a31d804d0e3b657237baa01c",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/d08f7d06f204e044a31d804d0e3b657237baa01c/comments",
        "author": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "3424351562b81516dcc3f21b62b7adb868c618ef",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/3424351562b81516dcc3f21b62b7adb868c618ef",
          "html_url": "https://github.com/richard-cox/node-env/commit/3424351562b81516dcc3f21b62b7adb868c618ef"
        }]
      }, {
        "sha": "3424351562b81516dcc3f21b62b7adb868c618ef",
        "commit": {
          "author": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-13T05:29:02Z"},
          "committer": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-13T05:29:02Z"},
          "message": "cleaned up html",
          "tree": {
            "sha": "51cd36645e376b1b3b5c42bd4a57604779d9ae96",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/51cd36645e376b1b3b5c42bd4a57604779d9ae96"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/3424351562b81516dcc3f21b62b7adb868c618ef",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/3424351562b81516dcc3f21b62b7adb868c618ef",
        "html_url": "https://github.com/richard-cox/node-env/commit/3424351562b81516dcc3f21b62b7adb868c618ef",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/3424351562b81516dcc3f21b62b7adb868c618ef/comments",
        "author": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "d9ccd59e130afcf6fd5d823f21465e6c74e0465c",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/d9ccd59e130afcf6fd5d823f21465e6c74e0465c",
          "html_url": "https://github.com/richard-cox/node-env/commit/d9ccd59e130afcf6fd5d823f21465e6c74e0465c"
        }]
      }, {
        "sha": "d9ccd59e130afcf6fd5d823f21465e6c74e0465c",
        "commit": {
          "author": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-13T01:30:14Z"},
          "committer": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-13T01:30:14Z"},
          "message": "Merge pull request #5 from viovanov/vladi-reduced-size\n\nUse node image based on busybox",
          "tree": {
            "sha": "c83248bb58afb7a91df332ffdbcad56138e65913",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/c83248bb58afb7a91df332ffdbcad56138e65913"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/d9ccd59e130afcf6fd5d823f21465e6c74e0465c",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/d9ccd59e130afcf6fd5d823f21465e6c74e0465c",
        "html_url": "https://github.com/richard-cox/node-env/commit/d9ccd59e130afcf6fd5d823f21465e6c74e0465c",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/d9ccd59e130afcf6fd5d823f21465e6c74e0465c/comments",
        "author": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "03829cb00a9084d848588f8ac981555a243964ee",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/03829cb00a9084d848588f8ac981555a243964ee",
          "html_url": "https://github.com/richard-cox/node-env/commit/03829cb00a9084d848588f8ac981555a243964ee"
        }, {
          "sha": "0c4c3777c3cb88af735d212ed39b08aa8aaf2ef4",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/0c4c3777c3cb88af735d212ed39b08aa8aaf2ef4",
          "html_url": "https://github.com/richard-cox/node-env/commit/0c4c3777c3cb88af735d212ed39b08aa8aaf2ef4"
        }]
      }, {
        "sha": "0c4c3777c3cb88af735d212ed39b08aa8aaf2ef4",
        "commit": {
          "author": {"name": "Vlad Iovanov", "email": "vlad.iovanov@hp.com", "date": "2015-08-12T21:18:06Z"},
          "committer": {"name": "Vlad Iovanov", "email": "vlad.iovanov@hp.com", "date": "2015-08-12T21:18:06Z"},
          "message": "Use node image based on busybox",
          "tree": {
            "sha": "0a6c138543f869654c90c1c8f6ba2344ac2c8ee4",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/0a6c138543f869654c90c1c8f6ba2344ac2c8ee4"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/0c4c3777c3cb88af735d212ed39b08aa8aaf2ef4",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/0c4c3777c3cb88af735d212ed39b08aa8aaf2ef4",
        "html_url": "https://github.com/richard-cox/node-env/commit/0c4c3777c3cb88af735d212ed39b08aa8aaf2ef4",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/0c4c3777c3cb88af735d212ed39b08aa8aaf2ef4/comments",
        "author": {
          "login": "viovanov",
          "id": 918484,
          "avatar_url": "https://avatars.githubusercontent.com/u/918484?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/viovanov",
          "html_url": "https://github.com/viovanov",
          "followers_url": "https://api.github.com/users/viovanov/followers",
          "following_url": "https://api.github.com/users/viovanov/following{/other_user}",
          "gists_url": "https://api.github.com/users/viovanov/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/viovanov/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/viovanov/subscriptions",
          "organizations_url": "https://api.github.com/users/viovanov/orgs",
          "repos_url": "https://api.github.com/users/viovanov/repos",
          "events_url": "https://api.github.com/users/viovanov/events{/privacy}",
          "received_events_url": "https://api.github.com/users/viovanov/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "viovanov",
          "id": 918484,
          "avatar_url": "https://avatars.githubusercontent.com/u/918484?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/viovanov",
          "html_url": "https://github.com/viovanov",
          "followers_url": "https://api.github.com/users/viovanov/followers",
          "following_url": "https://api.github.com/users/viovanov/following{/other_user}",
          "gists_url": "https://api.github.com/users/viovanov/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/viovanov/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/viovanov/subscriptions",
          "organizations_url": "https://api.github.com/users/viovanov/orgs",
          "repos_url": "https://api.github.com/users/viovanov/repos",
          "events_url": "https://api.github.com/users/viovanov/events{/privacy}",
          "received_events_url": "https://api.github.com/users/viovanov/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "da6cd3f229193872c1f7e6c20bfa8f6578c142d1",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/da6cd3f229193872c1f7e6c20bfa8f6578c142d1",
          "html_url": "https://github.com/richard-cox/node-env/commit/da6cd3f229193872c1f7e6c20bfa8f6578c142d1"
        }]
      }, {
        "sha": "03829cb00a9084d848588f8ac981555a243964ee",
        "commit": {
          "author": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-12T20:45:03Z"},
          "committer": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-12T20:45:03Z"},
          "message": "Merge pull request #4 from viovanov/vladi-reduced-size\n\nMove things back from src",
          "tree": {
            "sha": "80d3f391dc3fd2b7fbdad28d4e8ca6ab4afc2860",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/80d3f391dc3fd2b7fbdad28d4e8ca6ab4afc2860"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/03829cb00a9084d848588f8ac981555a243964ee",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/03829cb00a9084d848588f8ac981555a243964ee",
        "html_url": "https://github.com/richard-cox/node-env/commit/03829cb00a9084d848588f8ac981555a243964ee",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/03829cb00a9084d848588f8ac981555a243964ee/comments",
        "author": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "caef311e63365f6b353af50b7c71e63732f18f33",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/caef311e63365f6b353af50b7c71e63732f18f33",
          "html_url": "https://github.com/richard-cox/node-env/commit/caef311e63365f6b353af50b7c71e63732f18f33"
        }, {
          "sha": "da6cd3f229193872c1f7e6c20bfa8f6578c142d1",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/da6cd3f229193872c1f7e6c20bfa8f6578c142d1",
          "html_url": "https://github.com/richard-cox/node-env/commit/da6cd3f229193872c1f7e6c20bfa8f6578c142d1"
        }]
      }, {
        "sha": "caef311e63365f6b353af50b7c71e63732f18f33",
        "commit": {
          "author": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-12T20:43:11Z"},
          "committer": {"name": "Omri Gazitt", "email": "ogazitt@gmail.com", "date": "2015-08-12T20:43:11Z"},
          "message": "added kubernetes files",
          "tree": {
            "sha": "15393995731f11482cf8e04f260d25daa6d207dd",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/15393995731f11482cf8e04f260d25daa6d207dd"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/caef311e63365f6b353af50b7c71e63732f18f33",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/caef311e63365f6b353af50b7c71e63732f18f33",
        "html_url": "https://github.com/richard-cox/node-env/commit/caef311e63365f6b353af50b7c71e63732f18f33",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/caef311e63365f6b353af50b7c71e63732f18f33/comments",
        "author": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "ogazitt",
          "id": 1026051,
          "avatar_url": "https://avatars.githubusercontent.com/u/1026051?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/ogazitt",
          "html_url": "https://github.com/ogazitt",
          "followers_url": "https://api.github.com/users/ogazitt/followers",
          "following_url": "https://api.github.com/users/ogazitt/following{/other_user}",
          "gists_url": "https://api.github.com/users/ogazitt/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/ogazitt/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/ogazitt/subscriptions",
          "organizations_url": "https://api.github.com/users/ogazitt/orgs",
          "repos_url": "https://api.github.com/users/ogazitt/repos",
          "events_url": "https://api.github.com/users/ogazitt/events{/privacy}",
          "received_events_url": "https://api.github.com/users/ogazitt/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "50bc6faa4d2ac6acf69b7d8ab1859bfe3cfc5b60",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/50bc6faa4d2ac6acf69b7d8ab1859bfe3cfc5b60",
          "html_url": "https://github.com/richard-cox/node-env/commit/50bc6faa4d2ac6acf69b7d8ab1859bfe3cfc5b60"
        }]
      }, {
        "sha": "da6cd3f229193872c1f7e6c20bfa8f6578c142d1",
        "commit": {
          "author": {"name": "Vlad Iovanov", "email": "vlad.iovanov@hp.com", "date": "2015-08-12T20:31:19Z"},
          "committer": {"name": "Vlad Iovanov", "email": "vlad.iovanov@hp.com", "date": "2015-08-12T20:33:27Z"},
          "message": "Move things back from src",
          "tree": {
            "sha": "f5b67c1ff1c3eac7fc5f5bfb2b152fbfb97d4958",
            "url": "https://api.github.com/repos/richard-cox/node-env/git/trees/f5b67c1ff1c3eac7fc5f5bfb2b152fbfb97d4958"
          },
          "url": "https://api.github.com/repos/richard-cox/node-env/git/commits/da6cd3f229193872c1f7e6c20bfa8f6578c142d1",
          "comment_count": 0
        },
        "url": "https://api.github.com/repos/richard-cox/node-env/commits/da6cd3f229193872c1f7e6c20bfa8f6578c142d1",
        "html_url": "https://github.com/richard-cox/node-env/commit/da6cd3f229193872c1f7e6c20bfa8f6578c142d1",
        "comments_url": "https://api.github.com/repos/richard-cox/node-env/commits/da6cd3f229193872c1f7e6c20bfa8f6578c142d1/comments",
        "author": {
          "login": "viovanov",
          "id": 918484,
          "avatar_url": "https://avatars.githubusercontent.com/u/918484?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/viovanov",
          "html_url": "https://github.com/viovanov",
          "followers_url": "https://api.github.com/users/viovanov/followers",
          "following_url": "https://api.github.com/users/viovanov/following{/other_user}",
          "gists_url": "https://api.github.com/users/viovanov/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/viovanov/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/viovanov/subscriptions",
          "organizations_url": "https://api.github.com/users/viovanov/orgs",
          "repos_url": "https://api.github.com/users/viovanov/repos",
          "events_url": "https://api.github.com/users/viovanov/events{/privacy}",
          "received_events_url": "https://api.github.com/users/viovanov/received_events",
          "type": "User",
          "site_admin": false
        },
        "committer": {
          "login": "viovanov",
          "id": 918484,
          "avatar_url": "https://avatars.githubusercontent.com/u/918484?v=3",
          "gravatar_id": "",
          "url": "https://api.github.com/users/viovanov",
          "html_url": "https://github.com/viovanov",
          "followers_url": "https://api.github.com/users/viovanov/followers",
          "following_url": "https://api.github.com/users/viovanov/following{/other_user}",
          "gists_url": "https://api.github.com/users/viovanov/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/viovanov/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/viovanov/subscriptions",
          "organizations_url": "https://api.github.com/users/viovanov/orgs",
          "repos_url": "https://api.github.com/users/viovanov/repos",
          "events_url": "https://api.github.com/users/viovanov/events{/privacy}",
          "received_events_url": "https://api.github.com/users/viovanov/received_events",
          "type": "User",
          "site_admin": false
        },
        "parents": [{
          "sha": "5bd665faea3de47b0f905c50f8a8734a37e6f015",
          "url": "https://api.github.com/repos/richard-cox/node-env/commits/5bd665faea3de47b0f905c50f8a8734a37e6f015",
          "html_url": "https://github.com/richard-cox/node-env/commit/5bd665faea3de47b0f905c50f8a8734a37e6f015"
        }]
      }];
      this.$timeout(function() {
        that.$scope.$apply();
      }, 500);

      //this.githubModel.data.commits = [];
      that.selectedCommit = _.get(that, 'githubModel.data.commits.length') ? that.githubModel.data.commits[0] : null;
    }

  });

})();
