(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.hceApi = mock.hceApi || {};

  mock.hceApi.HceUserApi = {

    createUser: function (userId, login, vcs, secret) {
      return {
        url: '/pp/v1/proxy/v2/users',
        response: {
          201: {
            body: {
              id: 1,
              userId: userId,
              login: login,
              vcs: vcs,
              secret: secret
            }
          },

          500: {
            body: {}
          }
        }
      };
    },

    getUser: function (userId) {
      return {
        url: '/pp/v1/proxy/v2/users/' + userId,
        response: {
          200: {
            body: {
              id: userId,
              userId: 'githubuser',
              login: 'user',
              vcs: 'github',
              secret: 'GithubToken'
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
