(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.hceApi = mock.hceApi || {};

  mock.hceApi.HceProjectApi = {

    createProject: function (name, targetId, type, buildContainerId, repo, branch) {
      return {
        url: '/api/ce/v2/projects',
        response: {
          201: {
            body: {
              id: 1,
              name: name,
              type: type,
              user_id: 2,
              build_container_id: buildContainerId,
              token: 'GithubToken',
              branchRefName: branch,
              deployment_target_id: targetId,
              repo: repo
            }
          },

          500: {
            body: {}
          }
        }
      };
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
